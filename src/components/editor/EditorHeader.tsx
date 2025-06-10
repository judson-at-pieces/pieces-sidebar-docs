
import React from "react";
import { useBranchManager } from "@/hooks/useBranchManager";
import { useBranchSessions } from "@/hooks/useBranchSessions";
import { NewBranchSelector } from "./NewBranchSelector";
import { NewPullRequestButton } from "./NewPullRequestButton";
import { NewEditorTabNavigation } from "./NewEditorTabNavigation";

interface EditorHeaderProps {
  activeTab: 'navigation' | 'content' | 'seo';
  hasChanges: boolean;
  totalLiveFiles: number;
}

export function EditorHeader({ activeTab, hasChanges, totalLiveFiles }: EditorHeaderProps) {
  const { branches, currentBranch, initialized } = useBranchManager();
  const { sessions } = useBranchSessions(currentBranch);

  // Debug logs to see what's happening
  console.log('🔴 EDITOR HEADER RENDER:', {
    currentBranch: JSON.stringify(currentBranch),
    currentBranchType: typeof currentBranch,
    initialized,
    branchesCount: branches.length,
    sessionsCount: sessions.length,
    hasChanges,
    totalLiveFiles
  });

  const activeSessions = sessions.filter(s => s.content && s.content.trim());

  return (
    <div className="h-16 bg-gradient-to-r from-background via-background to-muted/5 border-b border-border/40 flex items-center justify-between px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Documentation Editor
        </h1>
        
        <div className="flex items-center gap-2">
          <NewBranchSelector />
          
          {totalLiveFiles > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span>{totalLiveFiles} file{totalLiveFiles !== 1 ? 's' : ''} modified</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NewPullRequestButton
          currentBranch={currentBranch}
          sessions={activeSessions}
          hasChanges={hasChanges || activeSessions.length > 0}
          initialized={initialized}
          targetBranch="main"
        />
      </div>
    </div>
  );
}
