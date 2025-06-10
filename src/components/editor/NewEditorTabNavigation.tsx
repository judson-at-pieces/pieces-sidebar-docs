
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Navigation, Search, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewBranchSelector } from './NewBranchSelector';

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
  selectedFile,
  isLocked,
  lockedBy,
  isAcquiringLock,
  onAcquireLock,
}: NewEditorTabNavigationProps) {
  
  const canEdit = isLocked && lockedBy === 'You';
  const isOtherUserEditing = isLocked && lockedBy !== 'You';

  return (
    <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-fit grid-cols-3 bg-muted/50">
              <TabsTrigger value="content" className="flex items-center gap-2 px-4">
                <FileText className="h-4 w-4" />
                Content
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
          
          <NewBranchSelector />
        </div>

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
        </div>
      </div>
    </div>
  );
}
