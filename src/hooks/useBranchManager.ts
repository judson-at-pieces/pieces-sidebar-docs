import { useState, useEffect, useCallback, useRef } from 'react';
import { githubService } from '@/services/githubService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setBranchCookie, getBranchCookie } from '@/utils/branchCookies';

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

  // 🚨 ULTRA COMPREHENSIVE BRANCH MANAGER DEBUGGING
  if (DEBUG) {
    console.group('🔥🔥🔥 BRANCH MANAGER HOOK RENDER');
    console.log('📊 CURRENT STATE SNAPSHOT:', {
      currentBranch: JSON.stringify(state.currentBranch),
      currentBranchType: typeof state.currentBranch,
      currentBranchLength: state.currentBranch?.length,
      currentBranchCharCodes: state.currentBranch ? Array.from(state.currentBranch).map(c => `${c}(${c.charCodeAt(0)})`) : 'empty',
      initialized: state.initialized,
      branchCount: state.branches.length,
      loading: state.loading,
      error: state.error,
      renderTimestamp: new Date().toISOString()
    });
    
    console.log('📊 BRANCHES ARRAY DETAILED:', state.branches.map(b => ({
      name: JSON.stringify(b.name),
      nameCharCodes: Array.from(b.name).map(c => `${c}(${c.charCodeAt(0)})`),
      isDefault: b.isDefault,
      sha: b.sha.substring(0, 7)
    })));
    
    console.log('📊 REFS STATE:', {
      initializationRef: initializationRef.current,
      mountedRef: mountedRef.current
    });
    console.groupEnd();
  }

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
    if (DEBUG) console.log('🔥🔥🔥 LOADING BRANCHES...');
    
    if (!mountedRef.current) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const repoConfig = await githubService.getRepoConfig();
      
      if (!repoConfig) {
        if (DEBUG) console.log('🔥🔥🔥 No repo config - using default');
        const defaultBranch: Branch = { name: 'main', sha: '', isDefault: true };
        if (mountedRef.current) {
          setState({
            branches: [defaultBranch],
            currentBranch: 'main',
            initialized: true,
            loading: false,
            error: null
          });
          setBranchCookie('main');
        }
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
        console.log('🔥🔥🔥 BRANCHES LOADED:', {
          branches: formattedBranches.map(b => ({ name: JSON.stringify(b.name), isDefault: b.isDefault })),
          defaultBranch: JSON.stringify(defaultBranchName)
        });
      }

      // Get current branch from cookie or use default
      const cookieBranch = getBranchCookie();
      const initialBranch = cookieBranch || defaultBranchName;

      if (mountedRef.current) {
        setState({
          branches: formattedBranches,
          currentBranch: initialBranch,
          initialized: true,
          loading: false,
          error: null
        });
        setBranchCookie(initialBranch);
      }

    } catch (error) {
      console.error('Error loading branches:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load branches';
      
      // Fallback to main branch
      const fallbackBranch: Branch = { name: 'main', sha: '', isDefault: true };
      if (mountedRef.current) {
        setState({
          branches: [fallbackBranch],
          currentBranch: 'main',
          initialized: true,
          loading: false,
          error: errorMessage
        });
        setBranchCookie('main');
      }
      
      toast.error(errorMessage);
    }
  }, [getGitHubAppToken]);

  const switchBranch = useCallback(async (branchName: string) => {
    console.group('🚨🚨🚨 SWITCH BRANCH FUNCTION CALLED');
    console.log('📊 FUNCTION ENTRY:', {
      requestedBranch: JSON.stringify(branchName),
      currentBranchState: JSON.stringify(state.currentBranch),
      timestamp: new Date().toISOString(),
      isSame: branchName === state.currentBranch,
      requestedCharCodes: Array.from(branchName).map(c => `${c}(${c.charCodeAt(0)})`),
      currentCharCodes: state.currentBranch ? Array.from(state.currentBranch).map(c => `${c}(${c.charCodeAt(0)})`) : 'empty'
    });
    
    if (branchName === state.currentBranch) {
      console.log('🚨 SWITCH BRANCH: Already on branch, exiting');
      console.groupEnd();
      return;
    }

    console.log('🚨 SWITCH BRANCH: Proceeding with branch switch...');

    try {
      // Ensure sessions exist for the target branch
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('🚨 SWITCH BRANCH: User found, ensuring sessions...');
        
        // Get latest content for each file from any branch
        const { data: allSessions } = await supabase
          .from('live_editing_sessions')
          .select('file_path, content, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (allSessions && allSessions.length > 0) {
          console.log('🚨 SWITCH BRANCH: Found existing sessions, creating for new branch...');
          
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
          console.log('🚨 SWITCH BRANCH: Sessions created for new branch');
        }
      }

      console.log('🚨 SWITCH BRANCH: About to update state and cookie to:', {
        newBranch: JSON.stringify(branchName),
        charCodes: Array.from(branchName).map(c => `${c}(${c.charCodeAt(0)})`)
      });

      // Update state and cookie
      if (mountedRef.current) {
        setState(prev => {
          const newState = { ...prev, currentBranch: branchName };
          console.log('🚨 SWITCH BRANCH: STATE ACTUALLY UPDATED TO:', {
            newCurrentBranch: JSON.stringify(newState.currentBranch),
            newCharCodes: newState.currentBranch ? Array.from(newState.currentBranch).map(c => `${c}(${c.charCodeAt(0)})`) : 'empty'
          });
          return newState;
        });
        setBranchCookie(branchName);
      }
      
      console.log('🚨 SWITCH BRANCH: State and cookie updated, showing toast...');
      toast.success(`Switched to branch "${branchName}"`);

      console.log('🚨 SWITCH BRANCH: Branch switch completed successfully');
    } catch (error) {
      console.error('🚨 SWITCH BRANCH: Error occurred:', error);
      toast.error('Failed to switch branch');
    } finally {
      console.groupEnd();
    }
  }, [state.currentBranch]);

  const createBranch = useCallback(async (branchName: string, sourceBranch?: string) => {
    if (!mountedRef.current) return;
    setState(prev => ({ ...prev, loading: true }));
    
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
      if (mountedRef.current) {
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  }, [state.currentBranch, getGitHubAppToken, loadBranches, switchBranch]);

  const deleteBranch = useCallback(async (branchName: string) => {
    const branchToDelete = state.branches.find(b => b.name === branchName);
    if (branchToDelete?.isDefault) {
      toast.error('Cannot delete the default branch');
      return;
    }

    if (!mountedRef.current) return;
    setState(prev => ({ ...prev, loading: true }));
    
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
      if (mountedRef.current) {
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  }, [state.branches, state.currentBranch, getGitHubAppToken, switchBranch, loadBranches]);

  // Initialize branches on mount
  useEffect(() => {
    if (!initializationRef.current) {
      initializationRef.current = true;
      if (DEBUG) console.log('🔥🔥🔥 INITIALIZING BRANCH MANAGER');
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
