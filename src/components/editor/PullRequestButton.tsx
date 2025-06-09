import React, { useState, useEffect } from 'react';
import { GitPullRequest } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { githubService } from '@/services/githubService';
import { supabase } from '@/integrations/supabase/client';

interface Branch {
  name: string;
  sha: string;
  isDefault: boolean;
}

interface PullRequestButtonProps {
  currentBranch: string;
  sessions: Array<{ file_path: string; content: string }>;
  hasChanges: boolean;
  initialized: boolean;
  branches: Branch[];
}

const DEBUG_PR_BUTTON = true;

export function PullRequestButton({ currentBranch, sessions, hasChanges, initialized, branches }: PullRequestButtonProps) {
  const [creating, setCreating] = useState(false);
  const [buttonState, setButtonState] = useState({
    text: 'Loading...',
    enabled: false,
    tooltip: 'Loading...',
    targetBranch: 'main'
  });

  // Force re-render when currentBranch changes by using it as a key
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [currentBranch]);

  useEffect(() => {
    if (DEBUG_PR_BUTTON) {
      console.log('🔵 PR BUTTON USEEFFECT TRIGGERED');
      console.log('🔵 RECEIVED PROPS IN PR BUTTON:');
      console.log('  🔵 currentBranch:', JSON.stringify(currentBranch), 'type:', typeof currentBranch);
      console.log('  🔵 initialized:', initialized);
      console.log('  🔵 sessions.length:', sessions.length);
      console.log('  🔵 hasChanges:', hasChanges);
      console.log('  🔵 creating:', creating);
      console.log('  🔵 renderKey:', renderKey);
      console.log('  🔵 branches.length:', branches.length);
    }

    if (!initialized) {
      if (DEBUG_PR_BUTTON) {
        console.log('❌ PR BUTTON DISABLED: Not initialized');
      }
      setButtonState({
        text: 'Loading branches...',
        enabled: false,
        tooltip: 'Loading branches...',
        targetBranch: 'main'
      });
      return;
    }

    if (!currentBranch) {
      if (DEBUG_PR_BUTTON) {
        console.log('❌ PR BUTTON DISABLED: No currentBranch provided');
      }
      setButtonState({
        text: 'No branch selected',
        enabled: false,
        tooltip: 'No branch selected',
        targetBranch: 'main'
      });
      return;
    }

    // Determine target branch intelligently
    let targetBranch = 'main';
    
    // Find the default branch from the branches list
    const defaultBranch = branches.find(b => b.isDefault);
    if (defaultBranch) {
      targetBranch = defaultBranch.name;
    }

    // If current branch is the default branch, find an alternative target
    if (currentBranch === targetBranch) {
      // Look for common development branches
      const alternativeTargets = ['develop', 'dev', 'development', 'staging'];
      const availableAlternative = branches.find(b => 
        alternativeTargets.includes(b.name.toLowerCase()) && b.name !== currentBranch
      );
      
      if (availableAlternative) {
        targetBranch = availableAlternative.name;
      } else {
        // If no alternative found, look for any other branch
        const otherBranch = branches.find(b => b.name !== currentBranch);
        if (otherBranch) {
          targetBranch = otherBranch.name;
        }
      }
    }

    if (DEBUG_PR_BUTTON) {
      console.log('🔵 PR BUTTON BRANCH COMPARISON:');
      console.log('  🔵 currentBranch:', JSON.stringify(currentBranch));
      console.log('  🔵 targetBranch:', JSON.stringify(targetBranch));
      console.log('  🔵 defaultBranch:', defaultBranch?.name);
      console.log('  🔵 branches available:', branches.map(b => b.name));
      console.log('  🔵 currentBranch === targetBranch:', currentBranch === targetBranch);
    }

    if (currentBranch === targetBranch) {
      if (DEBUG_PR_BUTTON) {
        console.log('❌ PR BUTTON DISABLED: currentBranch === targetBranch, no suitable target found');
      }
      setButtonState({
        text: `${currentBranch} (no target)`,
        enabled: false,
        tooltip: `Cannot create PR: no suitable target branch found. Create a new branch first.`,
        targetBranch
      });
      return;
    }

    const sessionsWithContent = sessions.filter(s => s.content && s.content.trim());
    const totalLiveFiles = sessionsWithContent.length;
    const hasAnyChanges = hasChanges || totalLiveFiles > 0;

    if (DEBUG_PR_BUTTON) {
      console.log('🔵 PR BUTTON SESSIONS ANALYSIS:');
      console.log('  🔵 total sessions:', sessions.length);
      console.log('  🔵 sessions with content:', sessionsWithContent.length);
      console.log('  🔵 hasChanges:', hasChanges);
      console.log('  🔵 hasAnyChanges:', hasAnyChanges);
    }

    const buttonText = `${currentBranch} → ${targetBranch}${totalLiveFiles > 0 ? ` (${totalLiveFiles})` : ''}`;

    if (creating) {
      if (DEBUG_PR_BUTTON) {
        console.log('❌ PR BUTTON DISABLED: Currently creating PR');
      }
      setButtonState({
        text: 'Creating PR...',
        enabled: false,
        tooltip: 'Creating pull request...',
        targetBranch
      });
      return;
    }

    if (!hasAnyChanges) {
      if (DEBUG_PR_BUTTON) {
        console.log('❌ PR BUTTON DISABLED: No changes to create PR for');
      }
      setButtonState({
        text: buttonText,
        enabled: false,
        tooltip: `No changes to create PR for. Current: ${currentBranch} → ${targetBranch}`,
        targetBranch
      });
      return;
    }

    if (DEBUG_PR_BUTTON) {
      console.log('✅ PR BUTTON SHOULD BE ENABLED');
      console.log('🔵 FINAL BUTTON STATE:');
      console.log('  🔵 text:', buttonText);
      console.log('  🔵 enabled: true');
      console.log('  🔵 totalLiveFiles:', totalLiveFiles);
      console.log('  🔵 currentBranch:', currentBranch);
      console.log('  🔵 targetBranch:', targetBranch);
    }

    setButtonState({
      text: buttonText,
      enabled: true,
      tooltip: `Create pull request from ${currentBranch} to ${targetBranch} with ${totalLiveFiles} file${totalLiveFiles !== 1 ? 's' : ''}`,
      targetBranch
    });

  }, [initialized, currentBranch, sessions, hasChanges, creating, renderKey, branches]);

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

  const getOriginalFilePath = (editorFilePath: string): string => {
    let cleanPath = editorFilePath.replace(/^\/+/, '');
    if (!cleanPath.endsWith('.md')) {
      cleanPath = `${cleanPath}.md`;
    }
    return `public/content/${cleanPath}`;
  };

  const collectAllLiveContent = async () => {
    const allContent: { path: string; content: string }[] = [];
    
    if (DEBUG_PR_BUTTON) {
      console.log('🗂️ Collecting live content from', sessions.length, 'sessions for branch:', currentBranch);
    }
    
    for (const session of sessions) {
      if (session.content && session.content.trim()) {
        allContent.push({
          path: getOriginalFilePath(session.file_path),
          content: session.content
        });
        if (DEBUG_PR_BUTTON) {
          console.log('✅ Added session content for:', session.file_path);
        }
      }
    }
    
    if (DEBUG_PR_BUTTON) {
      console.log('📊 Total live content collected:', allContent.length, 'files from branch:', currentBranch);
    }
    return allContent;
  };

  const handleCreatePR = async () => {
    if (DEBUG_PR_BUTTON) {
      console.log('🚀 PR BUTTON CLICKED');
      console.log('  currentBranch:', currentBranch);
      console.log('  targetBranch:', buttonState.targetBranch);
      console.log('  buttonState.enabled:', buttonState.enabled);
    }

    if (!currentBranch || !buttonState.enabled) {
      if (DEBUG_PR_BUTTON) {
        console.log('❌ Cannot create PR - conditions not met');
      }
      return;
    }

    const targetBranch = buttonState.targetBranch;
    
    if (DEBUG_PR_BUTTON) {
      console.log('✅ Creating PR FROM branch:', currentBranch, 'TO branch:', targetBranch);
    }
    
    setCreating(true);
    
    try {
      const token = await getGitHubAppToken();
      const repoConfig = await githubService.getRepoConfig();
      
      if (!repoConfig) {
        toast.error('No GitHub repository configured. Please configure a repository first.');
        return;
      }

      const allLiveContent = await collectAllLiveContent();
      
      if (allLiveContent.length === 0) {
        toast.error('No changes to create a pull request for');
        return;
      }

      if (DEBUG_PR_BUTTON) {
        console.log('📋 Files to include in PR:', allLiveContent.map(item => item.path));
      }

      const result = await githubService.createPullRequest(
        {
          title: `Update documentation from ${currentBranch} - ${allLiveContent.length} file${allLiveContent.length !== 1 ? 's' : ''} modified`,
          body: `Updated documentation files from branch "${currentBranch}" to ${targetBranch}:\n${allLiveContent.map(item => `- ${item.path}`).join('\n')}\n\nThis pull request was created from the collaborative editor.`,
          files: allLiveContent.map(item => ({
            path: item.path,
            content: item.content
          })),
          baseBranch: targetBranch,
          headBranch: currentBranch,
          useExistingBranch: true
        },
        token,
        repoConfig
      );

      if (result.success) {
        toast.success(`Pull request created successfully from "${currentBranch}" to ${targetBranch}!`, {
          action: {
            label: 'View PR',
            onClick: () => window.open(result.prUrl, '_blank')
          }
        });
        
        // Clear all live editing sessions for current branch after successful PR
        try {
          if (DEBUG_PR_BUTTON) {
            console.log('🧹 Clearing live editing sessions for branch:', currentBranch);
          }
          const { error } = await supabase
            .from('live_editing_sessions')
            .delete()
            .eq('branch_name', currentBranch)
            .in('file_path', sessions.map(s => s.file_path));
          
          if (!error) {
            toast.success('Live editing sessions cleared');
          } else {
            console.error('Error clearing live sessions:', error);
          }
        } catch (error) {
          console.error('Error clearing live sessions:', error);
        }
      } else {
        toast.error(result.error || 'Failed to create pull request');
      }
    } catch (error) {
      console.error('Error creating PR:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create pull request');
    } finally {
      setCreating(false);
    }
  };

  if (DEBUG_PR_BUTTON) {
    console.log('🔵 PR BUTTON RENDER - KEY:', renderKey, 'CURRENT:', currentBranch, 'TARGET:', buttonState.targetBranch, 'TEXT:', buttonState.text, 'ENABLED:', buttonState.enabled);
  }

  return (
    <Button
      key={renderKey}
      onClick={handleCreatePR}
      variant="outline"
      size="sm"
      disabled={!buttonState.enabled}
      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-pink-500 text-white border-0 hover:from-blue-600 hover:to-pink-600"
      title={buttonState.tooltip}
    >
      {creating ? (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <GitPullRequest className="w-4 h-4" />
      )}
      PR: {buttonState.text}
    </Button>
  );
}
