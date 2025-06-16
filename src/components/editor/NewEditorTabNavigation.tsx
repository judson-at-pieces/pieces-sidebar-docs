
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Navigation, 
  Search, 
  Lock, 
  LockOpen, 
  Users, 
  AlertCircle
} from 'lucide-react';
import { NewBranchSelector } from './NewBranchSelector';

interface LiveSession {
  file_path: string;
  locked_by_email?: string;
  locked_by_name?: string;
  locked_at?: string;
}

interface NewEditorTabNavigationProps {
  activeTab: 'navigation' | 'content' | 'seo';
  setActiveTab: (tab: 'navigation' | 'content' | 'seo') => void;
  selectedFile?: string;
  isLocked: boolean;
  lockedBy: string;
  isAcquiringLock: boolean;
  onAcquireLock: () => Promise<boolean>;
  currentBranch: string;
  sessions: LiveSession[];
  hasChanges: boolean;
  initialized: boolean;
  branches: string[];
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

  const canEdit = selectedFile && !isLocked;
  const isLockedByOthers = selectedFile && isLocked && lockedBy !== 'You';

  const tabs = [
    {
      id: 'content' as const,
      label: 'Content',
      icon: FileText,
      badge: hasChanges ? '•' : undefined,
      badgeVariant: 'destructive' as const
    },
    {
      id: 'navigation' as const,
      label: 'Navigation',
      icon: Navigation,
      badge: undefined
    },
    {
      id: 'seo' as const,
      label: 'SEO',
      icon: Search,
      badge: undefined
    }
  ];

  return (
    <div className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={`gap-2 relative ${isActive ? 'shadow-sm' : ''}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge && (
                  <Badge 
                    variant={tab.badgeVariant || "secondary"} 
                    className="h-5 w-5 p-0 text-xs flex items-center justify-center ml-1"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {/* Live editing status */}
          {activeTab === 'content' && selectedFile && (
            <div className="flex items-center gap-2 text-sm">
              {isLockedByOthers ? (
                <>
                  <Lock className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">Locked by {lockedBy}</span>
                </>
              ) : canEdit ? (
                <>
                  <LockOpen className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Editing</span>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAcquireLock}
                  disabled={isAcquiringLock}
                  className="gap-2"
                >
                  <LockOpen className="h-3 w-3" />
                  {isAcquiringLock ? 'Acquiring...' : 'Take Lock'}
                </Button>
              )}
            </div>
          )}

          {/* Live sessions indicator */}
          {sessions.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{sessions.length} active</span>
            </div>
          )}

          {/* Branch selector */}
          {initialized && (
            <NewBranchSelector />
          )}
        </div>
      </div>

      {/* Status bar */}
      {activeTab === 'content' && selectedFile && (
        <div className="px-4 py-1 bg-muted/30 border-t border-border/30">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                Editing: <span className="font-medium text-foreground">{selectedFile}</span>
              </span>
              {hasChanges && (
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>Unsaved changes</span>
                </div>
              )}
            </div>
            <div className="text-muted-foreground">
              Branch: <span className="font-medium text-foreground">{currentBranch}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
