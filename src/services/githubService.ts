import { supabase } from '@/integrations/supabase/client';

interface GitHubFile {
  path: string;
  content: string;
}

interface CreatePRRequest {
  title: string;
  body: string;
  files: GitHubFile[];
  baseBranch?: string;
}

interface GitHubConfig {
  owner: string;
  repo: string;
}

class GitHubService {
  private baseUrl = 'https://api.github.com';

  private async makeRequest(endpoint: string, token: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    console.log('Making GitHub API request to:', url);
    console.log('Request headers:', { ...headers, Authorization: '[REDACTED]' });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const responseText = await response.text();
    console.log('GitHub API response status:', response.status);
    console.log('GitHub API response:', responseText);

    if (!response.ok) {
      console.error('GitHub API error response:', responseText);
      
      let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`;
        }
        if (errorData.documentation_url) {
          console.log('GitHub API documentation:', errorData.documentation_url);
        }
      } catch (e) {
        if (responseText) {
          errorMessage += ` - ${responseText}`;
        }
      }
      
      // Add more specific error messages
      if (response.status === 404) {
        if (endpoint.includes('/repos/')) {
          const repoPath = endpoint.split('/repos/')[1].split('/')[0] + '/' + endpoint.split('/repos/')[1].split('/')[1];
          errorMessage = `Repository ${repoPath} not found. Please check that the repository exists and you have access to it.`;
        }
      } else if (response.status === 403) {
        errorMessage = 'Access forbidden. Please check that your GitHub token has the necessary permissions for this repository.';
      } else if (response.status === 401) {
        errorMessage = 'Authentication failed. Please sign out and sign back in to refresh your GitHub token.';
      }
      
      throw new Error(errorMessage);
    }

    return JSON.parse(responseText);
  }

  async testRepositoryAccess(owner: string, repo: string, token: string) {
    console.log('Testing repository access for:', `${owner}/${repo}`);
    
    try {
      // Test basic repository access
      const repoData = await this.makeRequest(`/repos/${owner}/${repo}`, token);
      console.log('Repository found:', repoData.full_name);
      console.log('Repository permissions:', repoData.permissions);
      
      // Test if we can read repository contents
      const contentsData = await this.makeRequest(`/repos/${owner}/${repo}/contents`, token);
      console.log('Repository contents accessible, found', contentsData.length, 'items');
      
      // Check if we can create branches (indicates write access)
      const branchesData = await this.makeRequest(`/repos/${owner}/${repo}/branches`, token);
      console.log('Repository branches accessible, found', branchesData.length, 'branches');
      
      return {
        hasAccess: true,
        canRead: true,
        permissions: repoData.permissions,
        defaultBranch: repoData.default_branch
      };
    } catch (error) {
      console.error('Repository access test failed:', error);
      return {
        hasAccess: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createPullRequest(
    { title, body, files, baseBranch = 'main' }: CreatePRRequest,
    token: string,
    config: GitHubConfig
  ) {
    const { owner, repo } = config;

    console.log('Creating PR for repository:', `${owner}/${repo}`);
    console.log('Files to update:', files.map(f => f.path));

    // Validate inputs
    if (!owner || !repo) {
      throw new Error('Repository owner and name are required');
    }

    if (!token) {
      throw new Error('GitHub token is required');
    }

    if (!files || files.length === 0) {
      throw new Error('At least one file is required to create a pull request');
    }

    // Create a new branch
    const branchName = `docs-update-${Date.now()}`;
    
    try {
      console.log('Step 1: Getting base branch reference');
      // Get the latest commit SHA from the base branch
      const baseRef = await this.makeRequest(`/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, token);
      const baseSha = baseRef.object.sha;
      console.log('Base SHA:', baseSha);

      console.log('Step 2: Creating new branch');
      // Create a new branch
      await this.makeRequest(`/repos/${owner}/${repo}/git/refs`, token, {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      });
      console.log('Created branch:', branchName);

      console.log('Step 3: Updating files');
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
          // File doesn't exist, which is fine for new files
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

      console.log('Step 4: Creating pull request');
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
      };
    } catch (error) {
      console.error('Error creating pull request:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          throw new Error(`Repository ${owner}/${repo} not found. Please check that the repository exists and you have access to it.`);
        } else if (error.message.includes('403')) {
          throw new Error('Access forbidden. Please check that your GitHub token has the necessary permissions for this repository.');
        } else if (error.message.includes('401')) {
          throw new Error('Authentication failed. Please sign out and sign back in to refresh your GitHub token.');
        } else if (error.message.includes('422')) {
          throw new Error('Invalid repository data. Please check the repository configuration and file paths.');
        }
      }
      
      throw error;
    }
  }

  async verifyRepository(owner: string, repo: string, token: string) {
    try {
      console.log('=== Starting Repository Verification ===');
      console.log('Repository:', `${owner}/${repo}`);
      console.log('Token available:', !!token);
      
      if (!owner || !repo) {
        throw new Error('Repository owner and name are required');
      }

      if (!token) {
        throw new Error('GitHub token is required for repository verification');
      }
      
      // First test repository access with detailed logging
      const accessTest = await this.testRepositoryAccess(owner, repo, token);
      if (!accessTest.hasAccess) {
        throw new Error(accessTest.error || 'Cannot access repository');
      }
      
      console.log('Repository access verified successfully');
      console.log('Default branch:', accessTest.defaultBranch);
      console.log('Permissions:', accessTest.permissions);
      
      return true;
    } catch (error) {
      console.error('=== Repository Verification Failed ===');
      console.error('Error:', error);
      throw error;
    }
  }

  async getRepoConfig(): Promise<GitHubConfig | null> {
    try {
      console.log('Fetching GitHub repository configuration from Supabase...');
      
      const { data: configs, error } = await supabase
        .from('github_config')
        .select('repo_owner, repo_name')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching GitHub config from Supabase:', error);
        throw new Error(`Failed to fetch repository configuration: ${error.message}`);
      }

      if (!configs) {
        console.log('No GitHub repository configuration found');
        return null;
      }

      console.log('Found GitHub config:', configs);
      return {
        owner: configs.repo_owner,
        repo: configs.repo_name,
      };
    } catch (error) {
      console.error('Error getting repo config:', error);
      throw error;
    }
  }

  async setRepoConfig(owner: string, repo: string): Promise<boolean> {
    try {
      console.log('Saving GitHub repository configuration to Supabase:', { owner, repo });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to save repository configuration');
      }

      const { error } = await supabase
        .from('github_config')
        .insert({
          repo_owner: owner,
          repo_name: repo,
          created_by: user.id,
        });

      if (error) {
        console.error('Error saving GitHub config to Supabase:', error);
        throw new Error(`Failed to save repository configuration: ${error.message}`);
      }

      console.log('Successfully saved GitHub repository configuration');
      return true;
    } catch (error) {
      console.error('Error setting repo config:', error);
      throw error;
    }
  }

  async isConfigured(): Promise<boolean> {
    try {
      const config = await this.getRepoConfig();
      return !!config;
    } catch (error) {
      console.error('Error checking if GitHub is configured:', error);
      return false;
    }
  }
}

export const githubService = new GitHubService();
