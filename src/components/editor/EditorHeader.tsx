
import React from "react";
import { useBranchSessions } from "@/hooks/useBranchSessions";
import { CookieBasedPRButton } from "./CookieBasedPRButton";
import { getBranchCookie } from "@/utils/branchCookies";

interface EditorHeaderProps {
  activeTab: 'navigation' | 'content' | 'seo';
  hasChanges: boolean;
  totalLiveFiles: number;
}

export function EditorHeader({ activeTab, hasChanges, totalLiveFiles }: EditorHeaderProps) {
  const currentBranch = getBranchCookie() || 'main';
  const { sessions } = useBranchSessions(currentBranch);

  console.log('🔴 EDITOR HEADER RENDER (Cookie-based):', {
    currentBranch,
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
        
        {totalLiveFiles > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span>{totalLiveFiles} file{totalLiveFiles !== 1 ? 's' : ''} modified</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <CookieBasedPRButton
          sessions={activeSessions}
          hasChanges={hasChanges || activeSessions.length > 0}
          initialized={true}
          targetBranch="main"
        />
      </div>
    </div>
  );
}
