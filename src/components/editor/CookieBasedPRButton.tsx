import React, { useState, useEffect } from 'react';
import { GitPullRequest, ExternalLink, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { githubService } from '@/services/githubService';
import { supabase } from '@/integrations/supabase/client';
import { getBranchCookie } from '@/utils/branchCookies';

interface ExistingPR {
  number: number;
  title: string;
  html_url: string;
  head: { ref: string };
  base: { ref: string };
}

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
  const [existingPRs, setExistingPRs] = useState<ExistingPR[]>([]);
  const [loadingPRs, setLoadingPRs] = useState(false);

  // Update current branch from cookie every 500ms
  useEffect(() => {
    const updateBranchFromCookie = () => {
      const cookieBranch = getBranchCookie();
      if (cookieBranch && cookieBranch !== currentBranch) {
        setCurrentBranch(cookieBranch);
        console.log('🍪 PR BUTTON: Updated branch from cookie:', cookieBranch);
      }
    };

    updateBranchFromCookie();
    const interval = setInterval(updateBranchFromCookie, 500);
    return () => clearInterval(interval);
  }, [currentBranch]);

  // Check for existing PRs when branch changes
  useEffect(() => {
    if (!currentBranch || !initialized) return;
    
    const checkExistingPRs = async () => {
      setLoadingPRs(true);
      try {
        const token = await getGitHubAppToken();
        const repoConfig = await githubService.getRepoConfig();
        
        if (!repoConfig) return;

        const response = await fetch(
          `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/pulls?state=open`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json',
            }
          }
        );

        if (response.ok) {
          const allPRs = await response.json();
          // Filter PRs that involve our current branch
          const relevantPRs = allPRs.filter((pr: ExistingPR) => 
            pr.head.ref === currentBranch || pr.base.ref === currentBranch
          );
          setExistingPRs(relevantPRs);
        }
      } catch (error) {
        console.error('Error checking existing PRs:', error);
      } finally {
        setLoadingPRs(false);
      }
    };

    checkExistingPRs();
  }, [currentBranch, initialized]);

  // Get current branch content from live editing sessions
  const getCurrentBranchContent = async () => {
    console.log('🍪 Getting content for current branch:', currentBranch);
    
    try {
      // Get all live editing sessions for the current branch
      const { data: branchSessions, error } = await supabase
        .from('live_editing_sessions')
        .select('file_path, content')
        .eq('branch_name', currentBranch)
        .not('content', 'is', null)
        .neq('content', '');

      if (error) {
        console.error('Error fetching branch content:', error);
        // Fallback to the sessions passed as props
        return sessions.filter(s => s.content && s.content.trim());
      }

      if (branchSessions && branchSessions.length > 0) {
        console.log(`🍪 Found ${branchSessions.length} sessions for branch ${currentBranch}`);
        return branchSessions;
      } else {
        console.log('🍪 No sessions found in database, using prop sessions');
        return sessions.filter(s => s.content && s.content.trim());
      }
    } catch (error) {
      console.error('Error in getCurrentBranchContent:', error);
      return sessions.filter(s => s.content && s.content.trim());
    }
  };

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

      // Check for existing PR again before creating
      const existingPRResponse = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/pulls?head=${repoConfig.owner}:${currentBranch}&base=${targetBranch}&state=open`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        }
      );

      if (existingPRResponse.ok) {
        const existingPRs = await existingPRResponse.json();
        if (existingPRs.length > 0) {
          const existingPR = existingPRs[0];
          toast.error(`A pull request already exists for branch "${currentBranch}"`, {
            action: {
              label: 'View Existing PR',
              onClick: () => window.open(existingPR.html_url, '_blank')
            }
          });
          return;
        }
      }

      // Get current branch content instead of using prop sessions
      const currentBranchSessions = await getCurrentBranchContent();
      
      if (currentBranchSessions.length === 0) {
        toast('No changes to create PR for', {
          description: `There are no edited files on the "${currentBranch}" branch. Make some changes first, then create a pull request.`,
          action: {
            label: 'Got it',
            onClick: () => {}
          }
        });
        return;
      }

      const files = currentBranchSessions.map(session => ({
        path: getOriginalFilePath(session.file_path),
        content: session.content
      }));

      console.log('🍪 Creating PR from branch:', currentBranch, 'with', files.length, 'files');

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
          .in('file_path', currentBranchSessions.map(s => s.file_path));
        
        if (!error) {
          toast.success('Live editing sessions cleared');
          // Refresh existing PRs list
          setExistingPRs(prev => [...prev]);
        }
      } else {
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

  // Show existing PRs dropdown if there are any
  if (existingPRs.length > 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 hover:from-green-600 hover:to-blue-600"
          >
            <GitPullRequest className="w-4 h-4" />
            {existingPRs.length} PR{existingPRs.length !== 1 ? 's' : ''} Open
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          {existingPRs.map((pr) => (
            <DropdownMenuItem 
              key={pr.number}
              onClick={() => window.open(pr.html_url, '_blank')}
              className="flex flex-col items-start gap-1 p-3"
            >
              <div className="flex items-center gap-2 w-full">
                <GitPullRequest className="w-4 h-4" />
                <span className="font-medium">#{pr.number}</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </div>
              <span className="text-sm text-muted-foreground truncate w-full">
                {pr.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {pr.head.ref} → {pr.base.ref}
              </span>
            </DropdownMenuItem>
          ))}
          {isEnabled && (
            <>
              <div className="border-t my-1" />
              <DropdownMenuItem 
                onClick={handleCreatePR}
                disabled={creating}
                className="flex items-center gap-2 p-3"
              >
                {creating ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <GitPullRequest className="w-4 h-4" />
                )}
                Create New PR: {currentBranch} → {targetBranch}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  console.log('🍪 COOKIE PR BUTTON RENDER:', {
    currentBranch,
    targetBranch,
    isEnabled,
    hasChanges,
    initialized,
    activeSessions: activeSessions.length,
    existingPRs: existingPRs.length
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
