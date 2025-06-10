
import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { githubService } from '@/services/githubService';
import { supabase } from '@/integrations/supabase/client';

interface PublishButtonProps {
  currentBranch: string;
  sessions: Array<{ file_path: string; content: string }>;
  hasChanges: boolean;
  initialized: boolean;
}

export function PublishButton({ currentBranch, sessions, hasChanges, initialized }: PublishButtonProps) {
  const [publishing, setPublishing] = useState(false);

  const activeSessions = sessions.filter(s => s.content && s.content.trim());
  const isEnabled = initialized && currentBranch && currentBranch !== 'main' && hasChanges;

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

  const handlePublish = async () => {
    if (!isEnabled) return;

    setPublishing(true);
    
    try {
      const token = await getGitHubAppToken();
      const repoConfig = await githubService.getRepoConfig();
      
      if (!repoConfig) {
        toast.error('No GitHub repository configured.');
        return;
      }

      const files = activeSessions.map(session => ({
        path: getOriginalFilePath(session.file_path),
        content: session.content
      }));

      console.log('📤 Publishing directly to branch:', currentBranch);

      // Create a commit directly on the current branch
      const result = await githubService.createPullRequest(
        {
          title: `Update documentation on ${currentBranch} - ${files.length} file${files.length !== 1 ? 's' : ''} modified`,
          body: `Direct update to ${currentBranch} branch`,
          files,
          baseBranch: currentBranch, // Use current branch as base
          headBranch: currentBranch, // Use current branch as head
          useExistingBranch: true
        },
        token,
        repoConfig
      );

      if (result.success) {
        toast.success(`Changes published to "${currentBranch}" branch!`);
        
        // Clear sessions after successful publish
        const { error } = await supabase
          .from('live_editing_sessions')
          .delete()
          .eq('branch_name', currentBranch)
          .in('file_path', activeSessions.map(s => s.file_path));
        
        if (!error) {
          toast.success('Live editing sessions cleared');
        }
      } else {
        toast.error(result.error || 'Failed to publish changes');
      }
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to publish changes');
    } finally {
      setPublishing(false);
    }
  };

  const getTooltip = () => {
    if (!initialized) return 'Loading...';
    if (!currentBranch) return 'No branch selected';
    if (currentBranch === 'main') return 'Cannot publish directly to main - use PR instead';
    if (!hasChanges) return 'No changes to publish';
    return `Publish changes directly to ${currentBranch} branch`;
  };

  console.log('📤 PublishButton DEBUG:', {
    currentBranch,
    hasChanges,
    isEnabled,
    sessionsCount: activeSessions.length
  });

  return (
    <Button
      onClick={handlePublish}
      variant="outline"
      size="sm"
      disabled={!isEnabled}
      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 hover:from-green-600 hover:to-emerald-600"
      title={getTooltip()}
    >
      {publishing ? (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Upload className="w-4 h-4" />
      )}
      Publish
    </Button>
  );
}
