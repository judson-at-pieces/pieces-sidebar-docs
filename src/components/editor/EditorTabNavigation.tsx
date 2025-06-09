
import React from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, FileText, Search, Edit3 } from 'lucide-react';
import { PullRequestButton } from './PullRequestButton';

interface EditorTabNavigationProps {
  activeTab: 'navigation' | 'content' | 'seo';
  setActiveTab: (tab: 'navigation' | 'content' | 'seo') => void;
  selectedFile?: string;
  isLocked: boolean;
  lockedBy: string | null;
  isAcquiringLock: boolean;
  onAcquireLock: () => void;
  totalLiveFiles: number;
  currentBranch: string;
  sessions: Array<{ file_path: string; content: string }>;
  hasChanges: boolean;
  initialized: boolean;
}

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
  initialized
}: EditorTabNavigationProps) {
  return (
    <div className="border-b border-border/50 px-6 py-4 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-muted/30 p-1 rounded-lg">
          <Button
            onClick={() => setActiveTab('navigation')}
            variant={activeTab === 'navigation' ? 'default' : 'ghost'}
            size="sm"
            className="gap-2 transition-all duration-200"
          >
            <Navigation className="h-4 w-4" />
            Navigation
          </Button>
          <Button
            onClick={() => setActiveTab('content')}
            variant={activeTab === 'content' ? 'default' : 'ghost'}
            size="sm"
            className="gap-2 transition-all duration-200"
          >
            <FileText className="h-4 w-4" />
            Content
          </Button>
          <Button
            onClick={() => setActiveTab('seo')}
            variant={activeTab === 'seo' ? 'default' : 'ghost'}
            size="sm"
            className="gap-2 transition-all duration-200"
          >
            <Search className="h-4 w-4" />
            SEO
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === 'content' && (
            <>
              {selectedFile && isLocked && lockedBy !== 'You' && !isAcquiringLock && (
                <Button
                  onClick={onAcquireLock}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Take Control
                </Button>
              )}

              {totalLiveFiles > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  {totalLiveFiles} file{totalLiveFiles !== 1 ? 's' : ''} with live changes on {currentBranch || 'main'}
                </div>
              )}
              
              <PullRequestButton
                currentBranch={currentBranch}
                sessions={sessions}
                hasChanges={hasChanges}
                initialized={initialized}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
