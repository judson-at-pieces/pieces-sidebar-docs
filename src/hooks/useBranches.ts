import { useState, useEffect } from 'react';
import { githubService } from '@/services/githubService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Branch {
  name: string;
  sha: string;
  isDefault: boolean;
}

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getGitHubAppToken = async () => {
    try {
      const { data: installations, error } = await supabase
        .from('github_installations')
        .select('installation_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !installations) {
        throw new Error('No GitHub app installation found');
      }

      const { data, error: tokenError } = await supabase.functions.invoke('github-app-auth', {
        body: { installationId: installations.installation_id }
      });

      if (tokenError) {
        throw new Error('Failed to get GitHub app token');
      }

      return data.token;
    } catch (error) {
      console.error('Error getting GitHub app token:', error);
      throw error;
    }
  };

  const fetchBranches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const repoConfig = await githubService.getRepoConfig();
      if (!repoConfig) {
        throw new Error('No repository configured');
      }

      const token = await getGitHubAppToken();
      
      // Fetch branches from GitHub API
      const response = await fetch(`https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/branches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }

      const branchesData = await response.json();
      
      // Get repository info to determine default branch
      const repoResponse = await fetch(`https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      const repoData = await repoResponse.json();
      const defaultBranch = repoData.default_branch;

      const formattedBranches: Branch[] = branchesData.map((branch: any) => ({
        name: branch.name,
        sha: branch.commit.sha,
        isDefault: branch.name === defaultBranch
      }));

      setBranches(formattedBranches);
      
      // Set current branch to default if not already set or if current branch doesn't exist
      if (!currentBranch || currentBranch === 'main' || !formattedBranches.find(b => b.name === currentBranch)) {
        console.log('Setting current branch to default:', defaultBranch);
        setCurrentBranch(defaultBranch);
      }

    } catch (error) {
      console.error('Error fetching branches:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch branches');
      toast.error('Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  const updateDatabaseForBranchSwitch = async (newBranchName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('=== UPDATING DATABASE FOR BRANCH SWITCH ===', newBranchName);

      // Get all existing sessions for this user
      const { data: existingSessions } = await supabase
        .from('live_editing_sessions')
        .select('file_path, content')
        .eq('user_id', user.id);

      if (existingSessions && existingSessions.length > 0) {
        // For each session, create or update a session on the new branch
        for (const session of existingSessions) {
          const { error: upsertError } = await supabase
            .from('live_editing_sessions')
            .upsert({
              file_path: session.file_path,
              content: session.content || '',
              user_id: user.id,
              branch_name: newBranchName,
              locked_by: null,
              locked_at: null,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'file_path,branch_name'
            });

          if (upsertError) {
            console.error('Error upserting session for branch switch:', upsertError);
          } else {
            console.log('✅ Upserted session for', session.file_path, 'on branch:', newBranchName);
          }
        }
      }

      console.log('✅ Database updated for branch switch to:', newBranchName);
    } catch (error) {
      console.error('Error updating database for branch switch:', error);
    }
  };

  const createBranch = async (branchName: string, sourceBranch?: string) => {
    setLoading(true);
    
    try {
      const repoConfig = await githubService.getRepoConfig();
      if (!repoConfig) {
        throw new Error('No repository configured');
      }

      const token = await getGitHubAppToken();
      const source = sourceBranch || currentBranch;
      
      // Get the SHA of the source branch
      const sourceBranchResponse = await fetch(`https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/git/ref/heads/${source}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (!sourceBranchResponse.ok) {
        throw new Error('Failed to get source branch');
      }

      const sourceBranchData = await sourceBranchResponse.json();
      const sourceSha = sourceBranchData.object.sha;

      // Create new branch
      const createResponse = await fetch(`https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/git/refs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: sourceSha,
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || 'Failed to create branch');
      }

      toast.success(`Branch "${branchName}" created successfully`);
      await fetchBranches();
      
      // Switch to the new branch and update database
      await updateDatabaseForBranchSwitch(branchName);
      setCurrentBranch(branchName);

    } catch (error) {
      console.error('Error creating branch:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create branch');
    } finally {
      setLoading(false);
    }
  };

  const switchBranch = async (branchName: string) => {
    console.log('=== SWITCHING TO BRANCH ===', branchName);
    
    // Update database first - this is the critical fix
    await updateDatabaseForBranchSwitch(branchName);
    
    // Then update the UI state
    setCurrentBranch(branchName);
    toast.success(`Switched to branch "${branchName}"`);
    
    console.log('✅ Branch switch completed:', branchName);
  };

  const deleteBranch = async (branchName: string) => {
    if (branches.find(b => b.name === branchName)?.isDefault) {
      toast.error('Cannot delete the default branch');
      return;
    }

    setLoading(true);
    
    try {
      const repoConfig = await githubService.getRepoConfig();
      if (!repoConfig) {
        throw new Error('No repository configured');
      }

      const token = await getGitHubAppToken();
      
      const response = await fetch(`https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/git/refs/heads/${branchName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete branch');
      }

      toast.success(`Branch "${branchName}" deleted successfully`);
      
      // Switch to default branch if we deleted the current branch
      if (currentBranch === branchName) {
        const defaultBranch = branches.find(b => b.isDefault)?.name || 'main';
        await switchBranch(defaultBranch);
      }
      
      await fetchBranches();

    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete branch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // Debug log to track current branch changes
  useEffect(() => {
    console.log('Current branch changed to:', currentBranch);
  }, [currentBranch]);

  return {
    branches,
    currentBranch,
    loading,
    error,
    fetchBranches,
    createBranch,
    switchBranch,
    deleteBranch,
  };
}
