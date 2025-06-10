
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Users, FileText, Navigation, Search } from 'lucide-react';
import { NewBranchSelector } from './NewBranchSelector';
import { CookieBasedPRButton } from './CookieBasedPRButton';

interface Branch {
  name: string;
  sha: string;
  isDefault: boolean;
}

interface NewEditorTabNavigationProps {
  activeTab: 'navigation' | 'content' | 'seo';
  setActiveTab: (tab: 'navigation' | 'content' | 'seo') => void;
  selectedFile?: string;
  isLocked: boolean;
  lockedBy: string | null;
  isAcquiringLock: boolean;
  onAcquireLock: () => void;
  currentBranch: string;
  sessions: Array<{ file_path: string; content: string }>;
  hasChanges: boolean;
  initialized: boolean;
  branches: Branch[];
}

export function NewEditorTabNavigation({
  activeTab,
  setActiveTab,
  selectedFile,
  isLocked,
  lockedBy,
  isAcquiringLock,
  onAcquireLock,
  currentBranch,
  sessions,
  hasChanges,
  initialized,
  branches
}: NewEditorTabNavigationProps) {
  const totalLiveFiles = sessions.filter(s => s.content && s.content.trim()).length;

  const tabs = [
    { id: 'navigation' as const, label: 'Navigation', icon: Navigation },
    { id: 'content' as const, label: 'Content', icon: FileText },
    { id: 'seo' as const, label: 'SEO', icon: Search },
  ];

  return (
    <div className="border-b border-border/40 bg-gradient-to-r from-background via-background/95 to-muted/10 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          {/* Tab Navigation */}
          <div className="flex bg-muted/30 rounded-lg p-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  className={`gap-2 transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'bg-background shadow-sm border border-border/50' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          {/* File Lock Status */}
          {selectedFile && activeTab === 'content' && (
            <div className="flex items-center gap-2 ml-4">
              {isLocked ? (
                <div className="flex items-center gap-2">
                  {lockedBy === 'You' ? (
                    <Badge variant="default" className="gap-1 bg-green-100 text-green-700 border-green-200">
                      <Lock className="h-3 w-3" />
                      Editing
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <Users className="h-3 w-3" />
                      Locked by {lockedBy}
                    </Badge>
                  )}
                </div>
              ) : (
                <Button
                  onClick={onAcquireLock}
                  variant="outline"
                  size="sm"
                  disabled={isAcquiringLock}
                  className="gap-1 text-xs"
                >
                  {isAcquiringLock ? (
                    <>
                      <div className="w-3 h-3 animate-spin rounded-full border border-current border-t-transparent" />
                      Acquiring...
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      Get Lock
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Branch Selector */}
          <NewBranchSelector />

          {/* Live Files Indicator */}
          {totalLiveFiles > 0 && (
            <Badge variant="secondary" className="gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              {totalLiveFiles} pending
            </Badge>
          )}

          {/* Single PR Button */}
          <CookieBasedPRButton
            sessions={sessions}
            hasChanges={hasChanges || totalLiveFiles > 0}
            initialized={initialized}
            targetBranch="main"
          />
        </div>
      </div>
    </div>
  );
}
