
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Navigation, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NewPullRequestButton } from './NewPullRequestButton';
import { PublishButton } from './PublishButton';
import { NewBranchSelector } from './NewBranchSelector';
import { useBranchManager } from '@/hooks/useBranchManager';
import { useBranchSessions } from '@/hooks/useBranchSessions';

interface NewEditorTabNavigationProps {
  activeTab: 'navigation' | 'content' | 'seo';
  setActiveTab: (tab: 'navigation' | 'content' | 'seo') => void;
  selectedFile?: string;
  isLocked: boolean;
  lockedBy: string;
  isAcquiringLock: boolean;
  onAcquireLock: () => void;
}

export function NewEditorTabNavigation({
  activeTab,
  setActiveTab,
}: NewEditorTabNavigationProps) {
  const { branches, currentBranch, initialized } = useBranchManager();
  const { sessions } = useBranchSessions(currentBranch);
  
  const totalLiveFiles = sessions.filter(s => s.content && s.content.trim()).length;
  const hasChanges = totalLiveFiles > 0;

  // Show Publish button for non-main branches, PR button for all branches
  const showPublishButton = currentBranch && currentBranch !== 'main';
  const showPRButton = currentBranch; // Always show PR button when we have a branch

  // 🚨 COMPREHENSIVE DEBUGGING
  console.group('🔍 NEW EDITOR TAB NAVIGATION DEBUG');
  console.log('📊 BRANCH STATE:', {
    currentBranch: JSON.stringify(currentBranch),
    currentBranchType: typeof currentBranch,
    currentBranchLength: currentBranch?.length,
    initialized,
    branchesCount: branches.length,
    branchesArray: branches.map(b => ({ name: b.name, isDefault: b.isDefault }))
  });
  
  console.log('📊 SESSIONS STATE:', {
    sessionsCount: sessions.length,
    totalLiveFiles,
    hasChanges,
    sessionFiles: sessions.map(s => s.file_path)
  });
  
  console.log('📊 BUTTON LOGIC:', {
    showPublishButton,
    showPRButton,
    publishCondition: `currentBranch(${currentBranch}) && currentBranch !== 'main'`,
    prCondition: `currentBranch(${currentBranch}) exists`
  });
  
  console.log('📊 COMPARISON CHECKS:', {
    'currentBranch === "main"': currentBranch === 'main',
    'currentBranch !== "main"': currentBranch !== 'main',
    'currentBranch == "main"': currentBranch == 'main',
    'currentBranch.trim() === "main"': currentBranch?.trim() === 'main',
    currentBranchCharCodes: currentBranch ? Array.from(currentBranch).map(c => c.charCodeAt(0)) : 'null'
  });
  console.groupEnd();

  return (
    <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-fit grid-cols-3 bg-muted/50">
            <TabsTrigger value="content" className="flex items-center gap-2 px-4">
              <FileText className="h-4 w-4" />
              Content
              {totalLiveFiles > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 text-xs">
                  {totalLiveFiles}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="navigation" className="flex items-center gap-2 px-4">
              <Navigation className="h-4 w-4" />
              Navigation
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2 px-4">
              <Search className="h-4 w-4" />
              SEO
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <NewBranchSelector />
          
          {/* Publish Button for non-main branches */}
          {showPublishButton && (
            <PublishButton
              currentBranch={currentBranch}
              sessions={sessions}
              hasChanges={hasChanges}
              initialized={initialized}
            />
          )}

          {/* PR Button for all branches */}
          {showPRButton && (
            <NewPullRequestButton
              currentBranch={currentBranch}
              sessions={sessions}
              hasChanges={hasChanges}
              initialized={initialized}
              targetBranch="main"
            />
          )}
        </div>
      </div>
    </div>
  );
}
