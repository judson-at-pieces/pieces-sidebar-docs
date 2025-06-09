
import { useState, useEffect, useCallback } from 'react';
import { githubService } from '@/services/githubService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Branch {
  name: string;
  sha: string;
  isDefault: boolean;
}

const DEBUG_BRANCHES = true;

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  if (DEBUG_BRANCHES) {
    console.log('🌿 USEBRANCHES HOOK RENDER');
    console.log('  currentBranch state:', currentBranch);
    console.log('  initialized state:', initialized);
    console.log('  branches count:', branches.length);
  }

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

  const fetchBranches = useCallback(async () => {
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
      
      // Only initialize current branch once, or if current branch doesn't exist
      if (!initialized || !formattedBranches.find(b => b.name === currentBranch)) {
        if (DEBUG_BRANCHES) {
          console.log('🌿 USEBRANCHES: Initializing current branch to:', defaultBranch);
        }
        setCurrentBranch(defaultBranch);
        setInitialized(true);
      }

    } catch (error) {
      console.error('Error fetching branches:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch branches');
      toast.error('Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  }, [initialized, currentBranch]);

  const ensureSessionsForBranch = async (branchName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('=== ENSURING SESSIONS FOR BRANCH ===', branchName);

      // Get latest content for each file across all branches for this user
      const { data: allSessions } = await supabase
        .from('live_editing_sessions')
        .select('file_path, content, updated_at, branch_name')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (allSessions && allSessions.length > 0) {
        // Group by file_path and get the most recent content
        const latestByFile = new Map<string, string>();
        
        allSessions.forEach(session => {
          if (!latestByFile.has(session.file_path) && session.content) {
            latestByFile.set(session.file_path, session.content);
          }
        });

        // Ensure each file has a session on the target branch
        const upsertPromises = Array.from(latestByFile.entries()).map(async ([filePath, content]) => {
          const { error } = await supabase
            .from('live_editing_sessions')
            .upsert({
              file_path: filePath,
              content: content,
              user_id: user.id,
              branch_name: branchName,
              locked_by: null,
              locked_at: null,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'file_path,branch_name'
            });

          if (error) {
            console.error('Error upserting session for', filePath, ':', error);
          } else {
            console.log('✅ Ensured session for', filePath, 'on branch:', branchName);
          }
        });

        await Promise.all(upsertPromises);
      }

      console.log('✅ Sessions ensured for branch:', branchName);
    } catch (error) {
      console.error('Error ensuring sessions for branch:', error);
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
      
      // Refresh branches first
      await fetchBranches();
      
      // Then switch to the new branch
      await switchBranch(branchName);

    } catch (error) {
      console.error('Error creating branch:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create branch');
    } finally {
      setLoading(false);
    }
  };

  const switchBranch = async (branchName: string) => {
    if (branchName === currentBranch) {
      if (DEBUG_BRANCHES) {
        console.log('🌿 USEBRANCHES: Already on branch:', branchName);
      }
      return;
    }

    if (DEBUG_BRANCHES) {
      console.log('🌿 USEBRANCHES: ===== SWITCHING TO BRANCH =====', branchName);
      console.log('🌿 USEBRANCHES: Current branch before switch:', currentBranch);
    }
    
    try {
      // First ensure sessions exist for the target branch
      await ensureSessionsForBranch(branchName);
      
      // Then update the current branch state
      if (DEBUG_BRANCHES) {
        console.log('🌿 USEBRANCHES: Setting currentBranch state to:', branchName);
      }
      setCurrentBranch(branchName);
      
      toast.success(`Switched to branch "${branchName}"`);
      
      if (DEBUG_BRANCHES) {
        console.log('🌿 USEBRANCHES: ✅ Branch switch completed:', branchName);
        console.log('🌿 USEBRANCHES: State should now be:', branchName);
      }
    } catch (error) {
      console.error('Error switching branch:', error);
      toast.error('Failed to switch branch');
    }
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
  }, [fetchBranches]);

  // Add effect to log currentBranch changes
  useEffect(() => {
    if (DEBUG_BRANCHES) {
      console.log('🌿 USEBRANCHES: currentBranch state changed to:', currentBranch);
    }
  }, [currentBranch]);

  if (DEBUG_BRANCHES) {
    console.log('🌿 USEBRANCHES: HOOK RETURNING:', {
      currentBranch,
      initialized,
      branchesCount: branches.length
    });
  }

  return {
    branches,
    currentBranch,
    loading,
    error,
    initialized,
    fetchBranches,
    createBranch,
    switchBranch,
    deleteBranch,
  };
}
