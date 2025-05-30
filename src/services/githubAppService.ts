
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

  // Get installation access token using the GitHub App
  private async getInstallationToken(installationId: number): Promise<string> {
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

  // Get all installations for the app
  async getInstallations(): Promise<GitHubInstallation[]> {
    try {
      const { data, error } = await supabase
        .from('github_installations')
        .select('*')
        .order('installed_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get installations: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting installations:', error);
      throw error;
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
          currentFileSha = currentFile.sha;
          console.log('Found existing file, SHA:', currentFileSha);
        } catch (error) {
          console.log('File does not exist, creating new file');
        }

        // Update or create the file
        await this.makeRequest(`/repos/${owner}/${repo}/contents/${file.path}`, token, {
          method: 'PUT',
          body: JSON.stringify({
            message: `Update ${file.path}`,
            content: btoa(file.content), // Base64 encode the content
            branch: branchName,
            ...(currentFileSha && { sha: currentFileSha }),
          }),
        });
        console.log('Successfully updated file:', file.path);
      }

      // Create the pull request
      const pr = await this.makeRequest(`/repos/${owner}/${repo}/pulls`, token, {
        method: 'POST',
        body: JSON.stringify({
          title,
          body,
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
