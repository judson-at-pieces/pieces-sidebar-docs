
import React, { useState, useEffect } from 'react';
import { GitPullRequest, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { githubService } from '@/services/githubService';
import { supabase } from '@/integrations/supabase/client';
import { getBranchCookie } from '@/utils/branchCookies';

interface CookieBasedPRButtonProps {
  sessions: Array<{ file_path: string; content: string }>;
  hasChanges: boolean;
  initialized: boolean;
  targetBranch?: string;
}

export function CookieBasedPRButton({ 
  sessions, 
  hasChanges, 
  initialized, 
  targetBranch = 'main' 
}: CookieBasedPRButtonProps) {
  const [creating, setCreating] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string>('');

  // Update current branch from cookie every 500ms
  useEffect(() => {
    const updateBranchFromCookie = () => {
      const cookieBranch = getBranchCookie();
      if (cookieBranch && cookieBranch !== currentBranch) {
        setCurrentBranch(cookieBranch);
        console.log('🍪 PR BUTTON: Updated branch from cookie:', cookieBranch);
      }
    };

    // Initial update
    updateBranchFromCookie();

    // Poll for changes
    const interval = setInterval(updateBranchFromCookie, 500);
    return () => clearInterval(interval);
  }, [currentBranch]);

  const activeSessions = sessions.filter(s => s.content && s.content.trim());
  const isEnabled = initialized && currentBranch && hasChanges && currentBranch !== targetBranch;

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

  const findExistingPR = async (token: string, repoConfig: any, headBranch: string, baseBranch: string) => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/pulls?head=${repoConfig.owner}:${headBranch}&base=${baseBranch}&state=open`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        }
      );

      if (response.ok) {
        const prs = await response.json();
        return prs.length > 0 ? prs[0] : null;
      }
      return null;
    } catch (error) {
      console.error('Error checking for existing PR:', error);
      return null;
    }
  };

  const handleCreatePR = async () => {
    if (!isEnabled) return;

    setCreating(true);
    
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

      console.log('🍪 Creating PR from cookie branch:', currentBranch, 'to:', targetBranch);

      // Check if a PR already exists for this branch
      const existingPR = await findExistingPR(token, repoConfig, currentBranch, targetBranch);
      
      if (existingPR) {
        toast.error(`A pull request already exists for branch "${currentBranch}"`, {
          action: {
            label: 'View Existing PR',
            onClick: () => window.open(existingPR.html_url, '_blank')
          }
        });
        return;
      }

      const useExistingBranch = currentBranch !== 'main';
      const headBranch = currentBranch === 'main' ? undefined : currentBranch;

      const result = await githubService.createPullRequest(
        {
          title: `Update documentation from ${currentBranch} - ${files.length} file${files.length !== 1 ? 's' : ''} modified`,
          body: `Updated documentation files from branch "${currentBranch}" to ${targetBranch}:\n${files.map(file => `- ${file.path}`).join('\n')}\n\nThis pull request was created from the collaborative editor.`,
          files,
          baseBranch: targetBranch,
          headBranch,
          useExistingBranch
        },
        token,
        repoConfig
      );

      if (result.success) {
        toast.success(`Pull request created from "${currentBranch}" to ${targetBranch}!`, {
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
        // Handle specific GitHub API errors
        if (result.error && result.error.includes('pull request already exists')) {
          const branchMatch = result.error.match(/for (.+)\./);
          const branchName = branchMatch ? branchMatch[1] : currentBranch;
          
          toast.error(`A pull request already exists for branch "${branchName}"`, {
            description: 'You can view or update the existing pull request instead.',
            action: {
              label: 'View on GitHub',
              onClick: () => window.open(`https://github.com/${repoConfig.owner}/${repoConfig.repo}/pulls`, '_blank')
            }
          });
        } else {
          toast.error(result.error || 'Failed to create pull request');
        }
      }
    } catch (error) {
      console.error('Error creating PR:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create pull request');
    } finally {
      setCreating(false);
    }
  };

  const getButtonText = () => {
    if (creating) return 'Creating PR...';
    if (!initialized) return 'Loading...';
    if (!currentBranch) return 'No Branch';
    if (!hasChanges) return 'No Changes';
    if (currentBranch === targetBranch) return 'Same Branch';
    return `${currentBranch} → ${targetBranch}`;
  };

  const getTooltip = () => {
    if (!initialized) return 'Loading...';
    if (!currentBranch) return 'No branch selected';
    if (!hasChanges) return 'No changes to create PR for';
    if (currentBranch === targetBranch) return `Cannot create PR to same branch (${targetBranch})`;
    return `Create pull request from ${currentBranch} to ${targetBranch}`;
  };

  console.log('🍪 COOKIE PR BUTTON RENDER:', {
    currentBranch,
    targetBranch,
    isEnabled,
    hasChanges,
    initialized,
    activeSessions: activeSessions.length
  });

  return (
    <Button
      onClick={handleCreatePR}
      variant="outline"
      size="sm"
      disabled={!isEnabled}
      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600"
      title={getTooltip()}
    >
      {creating ? (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <GitPullRequest className="w-4 h-4" />
      )}
      {getButtonText()}
    </Button>
  );
}
