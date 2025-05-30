
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

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error response:', errorText);
      
      let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`;
        }
      } catch (e) {
        // If we can't parse as JSON, include the raw text
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
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
      console.log('Verifying repository structure for:', `${owner}/${repo}`);
      
      if (!owner || !repo) {
        throw new Error('Repository owner and name are required');
      }

      if (!token) {
        throw new Error('GitHub token is required for repository verification');
      }
      
      // First check if we can access the repository at all
      console.log('Checking repository access...');
      const repoResponse = await this.makeRequest(`/repos/${owner}/${repo}`, token);
      console.log('Repository accessible, permissions:', repoResponse.permissions);
      
      // Check if the repository has the expected structure
      console.log('Checking repository structure...');
      let hasPublicContent = false;
      
      try {
        const response = await this.makeRequest(`/repos/${owner}/${repo}/contents/public/content`, token);
        
        // Check if it's a directory and has some content files
        if (Array.isArray(response)) {
          const hasMarkdownFiles = response.some((item: any) => 
            item.name.endsWith('.md') || item.type === 'dir'
          );
          
          if (hasMarkdownFiles) {
            hasPublicContent = true;
          }
        }
      } catch (error) {
        console.log('No /public/content directory found, checking for any content structure...');
        
        // If public/content doesn't exist, check if there's at least some content in the repo
        try {
          const rootContents = await this.makeRequest(`/repos/${owner}/${repo}/contents`, token);
          if (Array.isArray(rootContents) && rootContents.length > 0) {
            console.log('Repository has content, proceeding with verification');
            hasPublicContent = true;
          }
        } catch (rootError) {
          console.error('Failed to check repository contents:', rootError);
        }
      }

      if (!hasPublicContent) {
        console.warn('Repository structure validation warning: No expected content structure found');
        // Don't throw an error, just warn - let the user proceed
      }

      console.log('Repository verification completed successfully');
      return true;
    } catch (error) {
      console.error('Repository verification failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          throw new Error(`Repository ${owner}/${repo} not found. Please check that the repository exists and you have access to it.`);
        } else if (error.message.includes('403')) {
          throw new Error('Access forbidden. Please check that your GitHub token has the necessary permissions.');
        } else if (error.message.includes('401')) {
          throw new Error('Authentication failed. Please sign out and sign back in to refresh your GitHub token.');
        }
      }
      
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
