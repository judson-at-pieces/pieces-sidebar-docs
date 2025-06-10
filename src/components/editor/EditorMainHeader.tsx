
import React from "react";
import { Button } from "@/components/ui/button";
import { Settings, Crown } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchSessions } from "@/hooks/useBranchSessions";
import { CookieBasedPRButton } from "./CookieBasedPRButton";
import { getBranchCookie } from "@/utils/branchCookies";
import { useNavigate } from "react-router-dom";
import { NewBranchSelector } from "./NewBranchSelector";

interface EditorMainHeaderProps {
  hasChanges: boolean;
  totalLiveFiles: number;
}

export function EditorMainHeader({ hasChanges, totalLiveFiles }: EditorMainHeaderProps) {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const currentBranch = getBranchCookie() || 'main';
  const { sessions } = useBranchSessions(currentBranch);

  const activeSessions = sessions.filter(s => s.content && s.content.trim());

  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <div className="h-16 bg-gradient-to-r from-background via-background to-muted/5 border-b border-border/40 flex items-center justify-between px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Documentation Editor
        </h1>
        
        {currentBranch && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
            <span className="font-medium">Branch:</span>
            <span className="font-mono bg-background px-2 py-0.5 rounded text-foreground">{currentBranch}</span>
          </div>
        )}
        
        {totalLiveFiles > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground bg-orange-50 px-2 py-1 rounded-md border border-orange-200">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span>{totalLiveFiles} file{totalLiveFiles !== 1 ? 's' : ''} modified</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Branch Selector */}
        <NewBranchSelector />

        {/* PR Button - positioned right after branch selector */}
        <CookieBasedPRButton
          sessions={activeSessions}
          hasChanges={hasChanges || activeSessions.length > 0}
          initialized={true}
          targetBranch="main"
        />

        {/* Admin Button */}
        {hasRole('admin') && (
          <Button
            onClick={handleAdminClick}
            variant="outline"
            size="sm"
            className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 hover:from-purple-600 hover:to-indigo-600"
          >
            <Crown className="h-4 w-4" />
            Admin
          </Button>
        )}

        {/* User Menu */}
        <UserMenu />
      </div>
    </div>
  );
}
