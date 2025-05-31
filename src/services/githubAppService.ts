
import { supabase } from '@/integrations/supabase/client';

interface GitHubInstallation {
  installation_id: number;
  account_login: string;
  account_type: string;
  installed_at: string;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
  default_branch: string;
}

class GitHubAppService {
  private appId = '1341292';
  private baseUrl = 'https://api.github.com';

  // Get installation access token using the GitHub App - made public
  async getInstallationToken(installationId: number): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('github-app-auth', {
        body: { installationId }
      });

      if (error) {
        throw new Error(`Failed to get installation token: ${error.message}`);
      }

      return data.token;
    } catch (error) {
      console.error('Error getting installation token:', error);
      throw error;
    }
  }

  // Helper function to properly encode content for GitHub API
  private encodeContent(content: string): string {
    // Use TextEncoder to handle Unicode characters properly
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(content);
    
    // Convert Uint8Array to base64
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    
    return btoa(binary);
  }

  // Get all installations for the app directly from GitHub
  async getInstallations(): Promise<GitHubInstallation[]> {
    try {
      console.log('Fetching installations directly from GitHub...');
      
      const { data, error } = await supabase.functions.invoke('github-app-auth', {
        body: { action: 'list-installations' }
      });

      if (error) {
        throw new Error(`Failed to get installations: ${error.message}`);
      }

      // Convert GitHub API format to our expected format
      const installations: GitHubInstallation[] = data.installations.map((install: any) => ({
        installation_id: install.id,
        account_login: install.account.login,
        account_type: install.account.type,
        installed_at: install.created_at
      }));

      console.log('Found installations from GitHub:', installations);

      // Store/update installations in our database for caching
      for (const installation of installations) {
        await supabase
          .from('github_installations')
          .upsert(installation, { 
            onConflict: 'installation_id',
            ignoreDuplicates: false 
          });
      }

      return installations;
    } catch (error) {
      console.error('Error getting installations from GitHub:', error);
      
      // Fallback to database if GitHub API fails
      console.log('Falling back to cached installations...');
      const { data: dbInstallations, error: dbError } = await supabase
        .from('github_installations')
        .select('installation_id, account_login, account_type, installed_at')
        .order('installed_at', { ascending: false });

      if (dbError) {
        throw new Error(`Failed to get installations: ${dbError.message}`);
      }

      return dbInstallations || [];
    }
  }

  // Get repositories for a specific installation
  async getInstallationRepositories(installationId: number): Promise<Repository[]> {
    try {
      const token = await this.getInstallationToken(installationId);
      
      const response = await fetch(`${this.baseUrl}/installation/repositories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.repositories.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        permissions: {
          admin: true, // App installations typically have admin access
          push: true,
          pull: true,
        },
        default_branch: repo.default_branch || 'main'
      }));
    } catch (error) {
      console.error('Error getting installation repositories:', error);
      throw error;
    }
  }

  // Create branch and PR using installation token
  async createBranchAndPR(
    installationId: number,
    owner: string,
    repo: string,
    { title, body, files, baseBranch = 'main' }: {
      title: string;
      body: string;
      files: { path: string; content: string }[];
      baseBranch?: string;
    }
  ) {
    try {
      const token = await this.getInstallationToken(installationId);
      
      // Create a descriptive branch name
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const branchName = `docs-update-${timestamp}-${Date.now().toString().slice(-6)}`;
      
      console.log('Creating branch and PR for repository:', `${owner}/${repo}`);
      console.log('Files to update:', files.map(f => f.path));

      // Get the latest commit SHA from the base branch
      const baseRef = await this.makeRequest(`/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, token);
      const baseSha = baseRef.object.sha;
      console.log('Base SHA:', baseSha);

      // Create a new branch
      await this.makeRequest(`/repos/${owner}/${repo}/git/refs`, token, {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      });
      console.log('Created branch:', branchName);

      // Update files in the new branch
      for (const file of files) {
        console.log('Updating file:', file.path);
        
        // Get current file to get its SHA (if it exists)
        let currentFileSha: string | undefined;
        try {
          const currentFile = await this.makeRequest(
            `/repos/${owner}/${repo}/contents/${file.path}?ref=${branchName}`,
            token
          );
          // Fix: properly extract SHA from the response
          currentFileSha = currentFile.sha;
          console.log('Found existing file, SHA:', currentFileSha);
        } catch (error) {
          console.log('File does not exist, creating new file');
        }

        // Update or create the file with proper encoding
        await this.makeRequest(`/repos/${owner}/${repo}/contents/${file.path}`, token, {
          method: 'PUT',
          body: JSON.stringify({
            message: `Update ${file.path}`,
            content: this.encodeContent(file.content),
            branch: branchName,
            ...(currentFileSha && { sha: currentFileSha }),
          }),
        });
        console.log('Successfully updated file:', file.path);
      }

      // Create the pull request with updated body
      const prBody = `${body}\n\n---\n*Created by Pieces Documentation Bot*`;
      
      const pr = await this.makeRequest(`/repos/${owner}/${repo}/pulls`, token, {
        method: 'POST',
        body: JSON.stringify({
          title,
          body: prBody,
          head: branchName,
          base: baseBranch,
        }),
      });

      console.log('Successfully created PR:', pr.html_url);

      return {
        success: true,
        prUrl: pr.html_url,
        prNumber: pr.number,
        branchName: branchName,
      };
    } catch (error) {
      console.error('Error creating branch and pull request:', error);
      throw error;
    }
  }

  private async makeRequest(endpoint: string, token: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    console.log('Making GitHub API request to:', url);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const responseText = await response.text();
    console.log('GitHub API response status:', response.status);

    if (!response.ok) {
      console.error('GitHub API error response:', responseText);
      
      let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`;
        }
      } catch (e) {
        if (responseText) {
          errorMessage += ` - ${responseText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    return JSON.parse(responseText);
  }

  // Get installation URL for users to install the app
  getInstallationUrl(accountName?: string): string {
    const baseUrl = 'https://github.com/apps/piecesdocumentationbot/installations/new';
    return accountName ? `${baseUrl}?suggested_target_owner=${accountName}` : baseUrl;
  }
}

export const githubAppService = new GitHubAppService();
