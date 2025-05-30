
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

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
}

class GitHubService {
  private baseUrl = 'https://api.github.com';

  private async getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.provider_token || null;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('GitHub OAuth token not found. Please sign in with GitHub.');
    }

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

  async getUserRepos(): Promise<GitHubRepo[]> {
    const repos = await this.makeRequest('/user/repos?sort=updated&per_page=100');
    return repos;
  }

  async createPullRequest({ title, body, files, baseBranch = 'main' }: CreatePRRequest, repoFullName: string) {
    const [owner, repo] = repoFullName.split('/');
    
    // Create a new branch
    const branchName = `docs-update-${Date.now()}`;
    
    try {
      // Get the latest commit SHA from the base branch
      const baseRef = await this.makeRequest(`/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`);
      const baseSha = baseRef.object.sha;

      // Create a new branch
      await this.makeRequest(`/repos/${owner}/${repo}/git/refs`, {
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
            `/repos/${owner}/${repo}/contents/${file.path}?ref=${branchName}`
          );
          currentFileSha = currentFile.sha;
        } catch (error) {
          // File doesn't exist, which is fine for new files
        }

        // Update or create the file
        await this.makeRequest(`/repos/${owner}/${repo}/contents/${file.path}`, {
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
      const pr = await this.makeRequest(`/repos/${owner}/${repo}/pulls`, {
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

  async isConfigured(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }
}

export const githubService = new GitHubService();
