
import React, { useState } from 'react';
import { GitPullRequest } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { githubService } from '@/services/githubService';
import { supabase } from '@/integrations/supabase/client';
import { useBranchManager } from '@/hooks/useBranchManager';
import { useBranchSessions } from '@/hooks/useBranchSessions';

export function NewPullRequestButton() {
  const { branches, currentBranch, initialized } = useBranchManager();
  const { sessions } = useBranchSessions(currentBranch);
  const [creating, setCreating] = useState(false);

  const activeSessions = sessions.filter(s => s.content && s.content.trim());
  const hasChanges = activeSessions.length > 0;

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
    if (!initialized || !currentBranch || !hasChanges) {
      return;
    }

    setCreating(true);
    
    try {
      const token = await getGitHubAppToken();
      const repoConfig = await githubService.getRepoConfig();
      
      if (!repoConfig) {
        toast.error('No GitHub repository configured. Please configure a repository first.');
        return;
      }

      const files = activeSessions.map(session => ({
        path: getOriginalFilePath(session.file_path),
        content: session.content
      }));

      // Use the current branch as the head branch and enable useExistingBranch
      const result = await githubService.createPullRequest(
        {
          title: `Update documentation from ${currentBranch} - ${files.length} file${files.length !== 1 ? 's' : ''} modified`,
          body: `Updated documentation files from branch "${currentBranch}" to main:\n${files.map(file => `- ${file.path}`).join('\n')}\n\nThis pull request was created from the collaborative editor.`,
          files,
          baseBranch: 'main',
          headBranch: currentBranch,
          useExistingBranch: true
        },
        token,
        repoConfig
      );

      if (result.success) {
        toast.success(`Pull request created successfully!`, {
          action: {
            label: 'View PR',
            onClick: () => window.open(result.prUrl, '_blank')
          }
        });
        
        // Clear sessions after successful PR
        const { error } = await supabase
          .from('live_editing_sessions')
          .delete()
          .eq('branch_name', currentBranch)
          .in('file_path', activeSessions.map(s => s.file_path));
        
        if (!error) {
          toast.success('Live editing sessions cleared');
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

  const isEnabled = initialized && currentBranch && hasChanges;

  return (
    <Button
      onClick={handleCreatePR}
      variant="outline"
      size="sm"
      disabled={!isEnabled}
      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-pink-500 text-white border-0 hover:from-blue-600 hover:to-pink-600"
      title={isEnabled ? 'Create pull request' : 'No changes to create PR for'}
    >
      {creating ? (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <GitPullRequest className="w-4 h-4" />
      )}
      Create PR
    </Button>
  );
}
