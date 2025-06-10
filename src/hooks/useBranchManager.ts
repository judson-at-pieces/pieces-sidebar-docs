import { useState, useEffect, useCallback, useRef } from 'react';
import { githubService } from '@/services/githubService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Branch {
  name: string;
  sha: string;
  isDefault: boolean;
}

interface BranchManagerState {
  branches: Branch[];
  currentBranch: string;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const DEBUG = true;

export function useBranchManager() {
  const [state, setState] = useState<BranchManagerState>({
    branches: [],
    currentBranch: '',
    loading: false,
    error: null,
    initialized: false
  });

  const initializationRef = useRef(false);
  const mountedRef = useRef(true);

  // 🚨 COMPREHENSIVE BRANCH MANAGER DEBUGGING
  if (DEBUG) {
    console.group('🔥 BRANCH MANAGER RENDER');
    console.log('📊 CURRENT STATE:', {
      currentBranch: JSON.stringify(state.currentBranch),
      currentBranchType: typeof state.currentBranch,
      currentBranchLength: state.currentBranch?.length,
      currentBranchCharCodes: state.currentBranch ? Array.from(state.currentBranch).map(c => `${c}(${c.charCodeAt(0)})`) : 'empty',
      initialized: state.initialized,
      branchCount: state.branches.length,
      loading: state.loading,
      error: state.error
    });
    
    console.log('📊 BRANCHES ARRAY:', state.branches.map(b => ({
      name: JSON.stringify(b.name),
      isDefault: b.isDefault,
      charCodes: Array.from(b.name).map(c => `${c}(${c.charCodeAt(0)})`)
    })));
    console.groupEnd();
  }

  const updateState = useCallback((updates: Partial<BranchManagerState>) => {
    if (!mountedRef.current) return;
    
    if (DEBUG && updates.currentBranch !== undefined) {
      console.group('🔥 BRANCH MANAGER STATE UPDATE');
      console.log('📊 UPDATING currentBranch FROM:', {
        from: JSON.stringify(state.currentBranch),
        to: JSON.stringify(updates.currentBranch),
        fromCharCodes: state.currentBranch ? Array.from(state.currentBranch).map(c => `${c}(${c.charCodeAt(0)})`) : 'empty',
        toCharCodes: updates.currentBranch ? Array.from(updates.currentBranch).map(c => `${c}(${c.charCodeAt(0)})`) : 'empty'
      });
      console.groupEnd();
    }
    
    setState(prev => ({ ...prev, ...updates }));
  }, [state.currentBranch]);

  const getGitHubAppToken = useCallback(async () => {
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
  }, []);

  const loadBranches = useCallback(async () => {
    if (DEBUG) console.log('🔥 LOADING BRANCHES...');
    
    updateState({ loading: true, error: null });

    try {
      const repoConfig = await githubService.getRepoConfig();
      
      if (!repoConfig) {
        if (DEBUG) console.log('🔥 No repo config - using default');
        const defaultBranch: Branch = { name: 'main', sha: '', isDefault: true };
        updateState({
          branches: [defaultBranch],
          currentBranch: 'main',
          initialized: true,
          loading: false
        });
        return;
      }

      const token = await getGitHubAppToken();

      // Fetch branches
      const branchesResponse = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/branches`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        }
      );

      if (!branchesResponse.ok) {
        throw new Error('Failed to fetch branches from GitHub');
      }

      const branchesData = await branchesResponse.json();

      // Get repository info for default branch
      const repoResponse = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        }
      );

      const repoData = await repoResponse.json();
      const defaultBranchName = repoData.default_branch;

      const formattedBranches: Branch[] = branchesData.map((branch: any) => ({
        name: branch.name,
        sha: branch.commit.sha,
        isDefault: branch.name === defaultBranchName
      }));

      if (DEBUG) {
        console.log('🔥 BRANCHES LOADED:', {
          branches: formattedBranches.map(b => ({ name: JSON.stringify(b.name), isDefault: b.isDefault })),
          defaultBranch: JSON.stringify(defaultBranchName)
        });
      }

      updateState({
        branches: formattedBranches,
        currentBranch: defaultBranchName,
        initialized: true,
        loading: false
      });

    } catch (error) {
      console.error('Error loading branches:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load branches';
      
      // Fallback to main branch
      const fallbackBranch: Branch = { name: 'main', sha: '', isDefault: true };
      updateState({
        branches: [fallbackBranch],
        currentBranch: 'main',
        initialized: true,
        loading: false,
        error: errorMessage
      });
      
      toast.error(errorMessage);
    }
  }, [getGitHubAppToken, updateState]);

  const switchBranch = useCallback(async (branchName: string) => {
    if (branchName === state.currentBranch) {
      if (DEBUG) console.log('🔥 Already on branch:', JSON.stringify(branchName));
      return;
    }

    if (DEBUG) {
      console.group('🔥 SWITCHING TO BRANCH');
      console.log('📊 BRANCH SWITCH REQUEST:', {
        from: JSON.stringify(state.currentBranch),
        to: JSON.stringify(branchName),
        fromCharCodes: state.currentBranch ? Array.from(state.currentBranch).map(c => `${c}(${c.charCodeAt(0)})`) : 'empty',
        toCharCodes: Array.from(branchName).map(c => `${c}(${c.charCodeAt(0)})`)
      });
      console.groupEnd();
    }

    try {
      // Ensure sessions exist for the target branch
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get latest content for each file from any branch
        const { data: allSessions } = await supabase
          .from('live_editing_sessions')
          .select('file_path, content, updated_at')
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
            await supabase
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
          });

          await Promise.all(upsertPromises);
        }
      }

      updateState({ currentBranch: branchName });
      toast.success(`Switched to branch "${branchName}"`);

      if (DEBUG) {
        console.log('🔥 BRANCH SWITCH COMPLETED:', {
          newBranch: JSON.stringify(branchName),
          charCodes: Array.from(branchName).map(c => `${c}(${c.charCodeAt(0)})`)
        });
      }
    } catch (error) {
      console.error('Error switching branch:', error);
      toast.error('Failed to switch branch');
    }
  }, [state.currentBranch, updateState]);

  const createBranch = useCallback(async (branchName: string, sourceBranch?: string) => {
    updateState({ loading: true });
    
    try {
      const repoConfig = await githubService.getRepoConfig();
      if (!repoConfig) {
        throw new Error('No repository configured');
      }

      const token = await getGitHubAppToken();
      const source = sourceBranch || state.currentBranch;
      
      // Get the SHA of the source branch
      const sourceBranchResponse = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/git/ref/heads/${source}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        }
      );

      if (!sourceBranchResponse.ok) {
        throw new Error('Failed to get source branch');
      }

      const sourceBranchData = await sourceBranchResponse.json();
      const sourceSha = sourceBranchData.object.sha;

      // Create new branch
      const createResponse = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/git/refs`,
        {
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
        }
      );

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || 'Failed to create branch');
      }

      toast.success(`Branch "${branchName}" created successfully`);
      
      // Reload branches and switch to the new one
      await loadBranches();
      await switchBranch(branchName);

    } catch (error) {
      console.error('Error creating branch:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create branch');
    } finally {
      updateState({ loading: false });
    }
  }, [state.currentBranch, getGitHubAppToken, updateState, loadBranches, switchBranch]);

  const deleteBranch = useCallback(async (branchName: string) => {
    const branchToDelete = state.branches.find(b => b.name === branchName);
    if (branchToDelete?.isDefault) {
      toast.error('Cannot delete the default branch');
      return;
    }

    updateState({ loading: true });
    
    try {
      const repoConfig = await githubService.getRepoConfig();
      if (!repoConfig) {
        throw new Error('No repository configured');
      }

      const token = await getGitHubAppToken();
      
      const response = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/git/refs/heads/${branchName}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete branch');
      }

      toast.success(`Branch "${branchName}" deleted successfully`);
      
      // Switch to default branch if we deleted the current branch
      if (state.currentBranch === branchName) {
        const defaultBranch = state.branches.find(b => b.isDefault)?.name || 'main';
        await switchBranch(defaultBranch);
      }
      
      await loadBranches();

    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete branch');
    } finally {
      updateState({ loading: false });
    }
  }, [state.branches, state.currentBranch, getGitHubAppToken, updateState, switchBranch, loadBranches]);

  // Initialize branches on mount
  useEffect(() => {
    if (!initializationRef.current) {
      initializationRef.current = true;
      if (DEBUG) console.log('🔥 INITIALIZING BRANCH MANAGER');
      loadBranches();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [loadBranches]);

  return {
    branches: state.branches,
    currentBranch: state.currentBranch,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
    switchBranch,
    createBranch,
    deleteBranch,
    refreshBranches: loadBranches
  };
}
