
interface PullRequestOptions {
  title: string;
  body: string;
  files: Array<{ path: string; content: string }>;
  baseBranch: string;
  headBranch?: string; // Optional - will be auto-generated if not provided
}

interface GitHubRepoConfig {
  owner: string;
  repo: string;
  installation_id?: number;
}

class GitHubService {
  async getRepoConfig(): Promise<GitHubRepoConfig | null> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('github_config')
        .select('repo_owner, repo_name, installation_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        console.error('No GitHub repository configured:', error);
        return null;
      }

      return {
        owner: data.repo_owner,
        repo: data.repo_name,
        installation_id: data.installation_id || undefined
      };
    } catch (error) {
      console.error('Error fetching repo config:', error);
      return null;
    }
  }

  async createPullRequest(
    options: PullRequestOptions,
    accessToken: string,
    repoConfig: GitHubRepoConfig
  ): Promise<{ success: boolean; prUrl?: string; error?: string }> {
    try {
      const { title, body, files, baseBranch, headBranch } = options;
      
      // Generate head branch name if not provided
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const finalHeadBranch = headBranch || `editor-changes-${timestamp}`;
      
      console.log('Creating PR with base branch (target):', baseBranch, 'head branch (source):', finalHeadBranch);

      // Step 1: Get the latest commit SHA from the base branch (the branch we want to target)
      const baseBranchResponse = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/git/ref/heads/${baseBranch}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!baseBranchResponse.ok) {
        const errorText = await baseBranchResponse.text();
        throw new Error(`Failed to get base branch ${baseBranch}: ${errorText}`);
      }

      const baseBranchData = await baseBranchResponse.json();
      const baseCommitSha = baseBranchData.object.sha;

      // Step 2: Create a new branch from the base branch for our changes
      const createBranchResponse = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/git/refs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: `refs/heads/${finalHeadBranch}`,
            sha: baseCommitSha,
          }),
        }
      );

      if (!createBranchResponse.ok) {
        const errorText = await createBranchResponse.text();
        throw new Error(`Failed to create branch ${finalHeadBranch}: ${errorText}`);
      }

      // Step 3: Get the tree from the base commit
      const baseCommitResponse = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/git/commits/${baseCommitSha}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      const baseCommitData = await baseCommitResponse.json();
      const baseTreeSha = baseCommitData.tree.sha;

      // Step 4: Create blobs for each file
      const blobs = [];
      for (const file of files) {
        const blobResponse = await fetch(
          `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/git/blobs`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: file.content,
              encoding: 'utf-8',
            }),
          }
        );

        if (!blobResponse.ok) {
          const errorText = await blobResponse.text();
          throw new Error(`Failed to create blob for ${file.path}: ${errorText}`);
        }

        const blobData = await blobResponse.json();
        blobs.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha,
        });
      }

      // Step 5: Create a new tree with the updated files
      const createTreeResponse = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/git/trees`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base_tree: baseTreeSha,
            tree: blobs,
          }),
        }
      );

      if (!createTreeResponse.ok) {
        const errorText = await createTreeResponse.text();
        throw new Error(`Failed to create tree: ${errorText}`);
      }

      const treeData = await createTreeResponse.json();

      // Step 6: Create a new commit
      const createCommitResponse = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/git/commits`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: title,
            tree: treeData.sha,
            parents: [baseCommitSha],
          }),
        }
      );

      if (!createCommitResponse.ok) {
        const errorText = await createCommitResponse.text();
        throw new Error(`Failed to create commit: ${errorText}`);
      }

      const commitData = await createCommitResponse.json();

      // Step 7: Update the branch reference
      const updateRefResponse = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/git/refs/heads/${finalHeadBranch}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sha: commitData.sha,
          }),
        }
      );

      if (!updateRefResponse.ok) {
        const errorText = await updateRefResponse.text();
        throw new Error(`Failed to update branch reference: ${errorText}`);
      }

      // Step 8: Create the pull request (head -> base)
      const createPrResponse = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/pulls`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            body,
            head: finalHeadBranch, // The branch with changes
            base: baseBranch,      // The target branch (what's selected in the dropdown)
          }),
        }
      );

      if (!createPrResponse.ok) {
        const errorText = await createPrResponse.text();
        throw new Error(`Failed to create pull request: ${errorText}`);
      }

      const prData = await createPrResponse.json();

      return {
        success: true,
        prUrl: prData.html_url,
      };
    } catch (error) {
      console.error('Error creating pull request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const githubService = new GitHubService();
