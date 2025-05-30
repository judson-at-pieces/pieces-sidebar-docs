
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

class GitHubService {
  private baseUrl = 'https://api.github.com';
  private token: string | null = null;
  private owner: string | null = null;
  private repo: string | null = null;

  constructor() {
    // These would typically come from environment variables or user authentication
    this.token = localStorage.getItem('github_token');
    this.owner = localStorage.getItem('github_owner');
    this.repo = localStorage.getItem('github_repo');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
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

  async createPullRequest({ title, body, files, baseBranch = 'main' }: CreatePRRequest) {
    if (!this.token || !this.owner || !this.repo) {
      throw new Error('GitHub configuration not found. Please connect your GitHub account.');
    }

    // Create a new branch
    const branchName = `docs-update-${Date.now()}`;
    
    try {
      // Get the latest commit SHA from the base branch
      const baseRef = await this.makeRequest(`/repos/${this.owner}/${this.repo}/git/ref/heads/${baseBranch}`);
      const baseSha = baseRef.object.sha;

      // Create a new branch
      await this.makeRequest(`/repos/${this.owner}/${this.repo}/git/refs`, {
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
            `/repos/${this.owner}/${this.repo}/contents/${file.path}?ref=${branchName}`
          );
          currentFileSha = currentFile.sha;
        } catch (error) {
          // File doesn't exist, which is fine for new files
        }

        // Update or create the file
        await this.makeRequest(`/repos/${this.owner}/${this.repo}/contents/${file.path}`, {
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
      const pr = await this.makeRequest(`/repos/${this.owner}/${this.repo}/pulls`, {
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

  isConfigured(): boolean {
    return !!(this.token && this.owner && this.repo);
  }

  configure(token: string, owner: string, repo: string) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
    
    localStorage.setItem('github_token', token);
    localStorage.setItem('github_owner', owner);
    localStorage.setItem('github_repo', repo);
  }
}

export const githubService = new GitHubService();
