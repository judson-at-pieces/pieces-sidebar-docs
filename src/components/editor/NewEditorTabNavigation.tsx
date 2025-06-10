
import React from 'react';
import { FileText, Navigation, Search, Lock } from 'lucide-react';
import { NewPullRequestButton } from './NewPullRequestButton';
import { NewBranchSelector } from './NewBranchSelector';
import { useBranchManager } from '@/hooks/useBranchManager';
import { useBranchSessions } from '@/hooks/useBranchSessions';

interface NewEditorTabNavigationProps {
  activeTab: 'navigation' | 'content' | 'seo';
  setActiveTab: (tab: 'navigation' | 'content' | 'seo') => void;
  selectedFile?: string;
  isLocked: boolean;
  lockedBy: string | null;
  isAcquiringLock: boolean;
  onAcquireLock: () => void;
}

export function NewEditorTabNavigation({
  activeTab,
  setActiveTab,
  selectedFile,
  isLocked,
  lockedBy,
  isAcquiringLock,
  onAcquireLock
}: NewEditorTabNavigationProps) {
  const { currentBranch } = useBranchManager();
  const { sessions } = useBranchSessions(currentBranch);
  
  const totalLiveFiles = sessions.filter(s => s.content && s.content.trim()).length;

  return (
    <div className="px-6 py-4 border-b bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex rounded-lg bg-muted/50 p-1">
            <button
              onClick={() => setActiveTab('navigation')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${activeTab === 'navigation' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }
              `}
            >
              <Navigation className="w-4 h-4" />
              Navigation
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${activeTab === 'content' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }
              `}
            >
              <FileText className="w-4 h-4" />
              Content
              {totalLiveFiles > 0 && (
                <span className="ml-1 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full font-semibold">
                  {totalLiveFiles}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${activeTab === 'seo' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }
              `}
            >
              <Search className="w-4 h-4" />
              SEO
            </button>
          </div>
          
          {activeTab === 'content' && selectedFile && (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Status:</span>
              {isLocked && lockedBy ? (
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span className={`text-sm font-medium ${lockedBy === 'You' ? 'text-green-600' : 'text-amber-600'}`}>
                    {lockedBy === 'You' ? 'Editing' : `Locked by ${lockedBy}`}
                  </span>
                </div>
              ) : (
                <button
                  onClick={onAcquireLock}
                  disabled={isAcquiringLock}
                  className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                >
                  {isAcquiringLock ? (
                    <>
                      <div className="w-3 h-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Acquiring...
                    </>
                  ) : (
                    'Click to edit'
                  )}
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <NewBranchSelector />
          <NewPullRequestButton />
        </div>
      </div>
    </div>
  );
}
