
import React, { useState } from 'react';
import { GitPullRequest } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { githubService } from '@/services/githubService';
import { supabase } from '@/integrations/supabase/client';
import { useBranchManager } from '@/hooks/useBranchManager';
import { useBranchSessions } from '@/hooks/useBranchSessions';

const DEBUG = true;

export function NewPullRequestButton() {
  const { branches, currentBranch, initialized } = useBranchManager();
  const { sessions } = useBranchSessions(currentBranch);
  const [creating, setCreating] = useState(false);

  const getTargetBranch = () => {
    if (!currentBranch || branches.length === 0) return 'main';

    // Find the default branch
    const defaultBranch = branches.find(b => b.isDefault);
    let targetBranch = defaultBranch?.name || 'main';

    // If current branch is the default branch, find an alternative
    if (currentBranch === targetBranch) {
      const alternativeTargets = ['develop', 'dev', 'development', 'staging'];
      const alternative = branches.find(b => 
        alternativeTargets.includes(b.name.toLowerCase()) && b.name !== currentBranch
      );
      
      if (alternative) {
        targetBranch = alternative.name;
      } else {
        const otherBranch = branches.find(b => b.name !== currentBranch);
        if (otherBranch) {
          targetBranch = otherBranch.name;
        }
      }
    }

    return targetBranch;
  };

  const getButtonState = () => {
    if (!initialized || !currentBranch) {
      return {
        text: initialized ? 'No branch' : 'Loading...',
        enabled: false,
        tooltip: initialized ? 'No branch selected' : 'Loading branches...'
      };
    }

    const targetBranch = getTargetBranch();
    const activeSessions = sessions.filter(s => s.content && s.content.trim());
    const fileCount = activeSessions.length;

    if (creating) {
      return {
        text: 'Creating PR...',
        enabled: false,
        tooltip: 'Creating pull request...'
      };
    }

    if (currentBranch === targetBranch && branches.length <= 1) {
      return {
        text: `FORCED: ${currentBranch} (no target)`,
        enabled: false,
        tooltip: 'Cannot create PR: no suitable target branch found. Create a new branch first.'
      };
    }

    if (fileCount === 0) {
      return {
        text: `FORCED: ${currentBranch} → ${targetBranch}`,
        enabled: false,
        tooltip: `No changes to create PR for. Current: ${currentBranch} → ${targetBranch}`
      };
    }

    return {
      text: `FORCED: ${currentBranch} → ${targetBranch} (${fileCount})`,
      enabled: true,
      tooltip: `Create pull request from ${currentBranch} to ${targetBranch} with ${fileCount} file${fileCount !== 1 ? 's' : ''}`
    };
  };

  const getGitHubAppToken = async () => {
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
  };

  const getOriginalFilePath = (editorFilePath: string): string => {
    let cleanPath = editorFilePath.replace(/^\/+/, '');
    if (!cleanPath.endsWith('.md')) {
      cleanPath = `${cleanPath}.md`;
    }
    return `public/content/${cleanPath}`;
  };

  const handleCreatePR = async () => {
    const buttonState = getButtonState();
    
    if (!currentBranch || !buttonState.enabled) {
      if (DEBUG) console.log('🚀 Cannot create PR - conditions not met');
      return;
    }

    const targetBranch = getTargetBranch();
    const activeSessions = sessions.filter(s => s.content && s.content.trim());
    
    if (DEBUG) {
      console.log('🚀 CREATING PR:', {
        from: currentBranch,
        to: targetBranch,
        files: activeSessions.length
      });
    }
    
    setCreating(true);
    
    try {
      // Add cheese toast for fun
      toast.success('🧀 CHEESE - Creating that delicious PR!');
      
      const token = await getGitHubAppToken();
      const repoConfig = await githubService.getRepoConfig();
      
      if (!repoConfig) {
        toast.error('No GitHub repository configured. Please configure a repository first.');
        return;
      }

      if (activeSessions.length === 0) {
        toast.error('No changes to create a pull request for');
        return;
      }

      const files = activeSessions.map(session => ({
        path: getOriginalFilePath(session.file_path),
        content: session.content
      }));

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const tempBranchName = `editor-changes-${currentBranch}-${timestamp}`;

      const result = await githubService.createPullRequest(
        {
          title: `Update documentation from ${currentBranch} - ${files.length} file${files.length !== 1 ? 's' : ''} modified`,
          body: `Updated documentation files from branch "${currentBranch}" to ${targetBranch}:\n${files.map(file => `- ${file.path}`).join('\n')}\n\nThis pull request was created from the collaborative editor.`,
          files,
          baseBranch: targetBranch,
          headBranch: tempBranchName,
          useExistingBranch: false
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
        
        // Clear sessions after successful PR
        try {
          const { error } = await supabase
            .from('live_editing_sessions')
            .delete()
            .eq('branch_name', currentBranch)
            .in('file_path', activeSessions.map(s => s.file_path));
          
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

  const buttonState = getButtonState();

  return (
    <Button
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
        <GitPullRequest className="w-4 w-4" />
      )}
      PR: {buttonState.text}
    </Button>
  );
}
