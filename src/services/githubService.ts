
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
      throw error;
    }
  }

  async verifyRepository(owner: string, repo: string, token: string) {
    try {
      console.log('Verifying repository structure for:', `${owner}/${repo}`);
      
      // First check if we can access the repository at all
      const repoResponse = await this.makeRequest(`/repos/${owner}/${repo}`, token);
      console.log('Repository accessible, permissions:', repoResponse.permissions);
      
      const response = await this.makeRequest(`/repos/${owner}/${repo}/contents/public/content`, token);

      // Check if it's a directory and has some content files
      if (!Array.isArray(response)) {
        throw new Error('Invalid repository structure: /public/content should be a directory');
      }

      // Look for some expected markdown files
      const hasMarkdownFiles = response.some((item: any) => 
        item.name.endsWith('.md') || item.type === 'dir'
      );

      if (!hasMarkdownFiles) {
        throw new Error('Repository structure validation failed: No markdown files or subdirectories found in /public/content');
      }

      console.log('Repository verification successful');
      return true;
    } catch (error) {
      console.error('Repository verification failed:', error);
      throw error;
    }
  }

  getRepoConfig(): GitHubConfig | null {
    const owner = localStorage.getItem('github_repo_owner');
    const repo = localStorage.getItem('github_repo_name');
    
    if (!owner || !repo) {
      return null;
    }
    
    return { owner, repo };
  }

  setRepoConfig(owner: string, repo: string) {
    localStorage.setItem('github_repo_owner', owner);
    localStorage.setItem('github_repo_name', repo);
  }

  isConfigured(): boolean {
    return !!this.getRepoConfig();
  }
}

export const githubService = new GitHubService();
