
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Navigation, Search, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PullRequestButton } from './PullRequestButton';

interface Branch {
  name: string;
  sha: string;
  isDefault: boolean;
}

interface EditorTabNavigationProps {
  activeTab: 'navigation' | 'content' | 'seo';
  setActiveTab: (tab: 'navigation' | 'content' | 'seo') => void;
  selectedFile?: string;
  isLocked: boolean;
  lockedBy: string;
  isAcquiringLock: boolean;
  onAcquireLock: () => void;
  totalLiveFiles: number;
  currentBranch: string;
  sessions: Array<{ file_path: string; content: string }>;
  hasChanges: boolean;
  initialized: boolean;
  branches: Branch[];
}

const DEBUG_TAB_NAV = true;

export function EditorTabNavigation({
  activeTab,
  setActiveTab,
  selectedFile,
  isLocked,
  lockedBy,
  isAcquiringLock,
  onAcquireLock,
  totalLiveFiles,
  currentBranch,
  sessions,
  hasChanges,
  initialized,
  branches
}: EditorTabNavigationProps) {
  
  if (DEBUG_TAB_NAV) {
    console.log('🟡 EDITOR TAB NAV RENDER');
    console.log('🟡 TAB NAV RECEIVED PROPS:');
    console.log('  🟡 currentBranch:', JSON.stringify(currentBranch), 'type:', typeof currentBranch);
    console.log('  🟡 initialized:', initialized);
    console.log('  🟡 hasChanges:', hasChanges);
    console.log('  🟡 sessions count:', sessions.length);
    console.log('  🟡 branches count:', branches.length);
  }

  const canEdit = isLocked && lockedBy === 'You';
  const isOtherUserEditing = isLocked && lockedBy !== 'You';

  if (DEBUG_TAB_NAV) {
    console.log('🟡 TAB NAV PASSING TO PR BUTTON:');
    console.log('  🟡 currentBranch:', currentBranch);
    console.log('  🟡 sessions:', sessions);
    console.log('  🟡 hasChanges:', hasChanges);
    console.log('  🟡 initialized:', initialized);
    console.log('  🟡 branches:', branches);
  }

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
          {/* Lock Status for Content Tab */}
          {activeTab === 'content' && selectedFile && (
            <div className="flex items-center gap-2">
              {isOtherUserEditing ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                  <Lock className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">Locked by {lockedBy}</span>
                </div>
              ) : canEdit ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                  <Unlock className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">You have edit access</span>
                </div>
              ) : (
                <Button
                  onClick={onAcquireLock}
                  disabled={isAcquiringLock}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {isAcquiringLock ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  {isAcquiringLock ? 'Acquiring...' : 'Start Editing'}
                </Button>
              )}
            </div>
          )}

          {/* Pull Request Button */}
          <PullRequestButton
            key={`pr-button-${currentBranch}-${initialized}`}
            currentBranch={currentBranch}
            sessions={sessions}
            hasChanges={hasChanges}
            initialized={initialized}
            branches={branches}
          />
        </div>
      </div>
    </div>
  );
}
