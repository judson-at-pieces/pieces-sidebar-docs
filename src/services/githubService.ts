
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

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async createPullRequest(
    { title, body, files, baseBranch = 'main' }: CreatePRRequest,
    token: string,
    config: GitHubConfig
  ) {
    const { owner, repo } = config;

    // Create a new branch
    const branchName = `docs-update-${Date.now()}`;
    
    try {
      // Get the latest commit SHA from the base branch
      const baseRef = await this.makeRequest(`/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, token);
      const baseSha = baseRef.object.sha;

      // Create a new branch
      await this.makeRequest(`/repos/${owner}/${repo}/git/refs`, token, {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      });

      // Update files in the new branch
      for (const file of files) {
        // Get current file to get its SHA (if it exists)
        let currentFileSha: string | undefined;
        try {
          const currentFile = await this.makeRequest(
            `/repos/${owner}/${repo}/contents/${file.path}?ref=${branchName}`,
            token
          );
          currentFileSha = currentFile.sha;
        } catch (error) {
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
