
import React, { useEffect, useRef } from 'react';
import { FileText, MoreHorizontal, Copy, Trash2, Eye, Edit3, Lock, Unlock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import HashnodeMarkdownRenderer from '@/components/HashnodeMarkdownRenderer';
import { useLiveTyping } from '@/hooks/useLiveTyping';
import { TypingIndicator } from './TypingIndicator';
import { VisibilitySwitch } from './VisibilitySwitch';

interface EditorMainProps {
  selectedFile?: string;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  hasChanges: boolean;
  saving: boolean;
  isLocked?: boolean;
  lockedBy?: string | null;
  liveContent?: string;
  isAcquiringLock?: boolean;
  onTakeLock?: () => Promise<boolean>;
  isPublic?: boolean;
  onVisibilityChange?: (isPublic: boolean) => void;
}

export function EditorMain({
  selectedFile,
  content,
  onContentChange,
  onSave,
  hasChanges,
  saving,
  isLocked = false,
  lockedBy = null,
  liveContent,
  isAcquiringLock = false,
  onTakeLock,
  isPublic = true,
  onVisibilityChange
}: EditorMainProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Live typing functionality
  const { typingSessions, handleTyping, getLatestTypingContent } = useLiveTyping(selectedFile);
  
  // Determine if current user can edit
  const canEdit = isLocked && lockedBy === 'You';
  const isLockedByOther = isLocked && lockedBy !== 'You';

  // Get the most recent content - prioritize live typing content over live editing content
  const latestTypingContent = getLatestTypingContent();
  const displayContent = isLockedByOther && (latestTypingContent || liveContent) 
    ? (latestTypingContent || liveContent) 
    : content;

  // Handle content changes with live typing
  const handleContentChangeWithTyping = (newContent: string) => {
    if (canEdit) {
      // Update local content immediately for responsiveness
      onContentChange(newContent);
      
      // Get cursor position
      const cursorPosition = textareaRef.current?.selectionStart || 0;
      
      // Send typing event for real-time updates
      handleTyping(newContent, cursorPosition);
    }
  };

  // Update content when live typing content changes (for viewers)
  useEffect(() => {
    if (isLockedByOther && latestTypingContent && latestTypingContent !== content) {
      console.log('Updating display content with live typing changes');
      // For viewers, we don't call onContentChange as they shouldn't modify the local state
      // The display content will be updated through the displayContent calculation above
    }
  }, [latestTypingContent, content, isLockedByOther]);

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
        <div className="text-center space-y-6 max-w-md p-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-3xl flex items-center justify-center shadow-lg border border-blue-200/50 dark:border-blue-800/50">
            <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Select a File to Edit</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Choose a file from the sidebar to start editing, or create a new one to begin your documentation journey.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 shadow-lg">
      {/* Enhanced Live Editing Banner */}
      {isLockedByOther && (
        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg border-b border-blue-700/30">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Edit3 className="h-6 w-6 animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <span className="font-semibold text-lg">
                      {lockedBy} is currently editing this page
                    </span>
                    <div className="text-blue-100 text-sm">Live collaboration active</div>
                  </div>
                </div>
                {(liveContent || latestTypingContent) && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 shadow-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                    Live Updates
                  </Badge>
                )}
              </div>
              
              {/* Enhanced Take Lock Button */}
              {onTakeLock && (
                <Button
                  onClick={onTakeLock}
                  disabled={isAcquiringLock}
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 transition-all duration-200 shadow-sm"
                >
                  {isAcquiringLock ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Taking Lock...
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Take Lock
                    </>
                  )}
                </Button>
              )}
            </div>
            <p className="text-center text-blue-100 mt-3 text-sm font-medium">
              {(liveContent || latestTypingContent) ? '✨ You can see their changes in real-time' : '👀 You can view the content but cannot make changes'}
            </p>
          </div>
        </div>
      )}

      {/* Enhanced File Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200 truncate max-w-md">
                {selectedFile.split('/').pop()?.replace(/\.md$/, '') || 'Untitled'}
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {selectedFile}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {canEdit && (
              <Badge variant="default" className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800">
                <Edit3 className="h-3 w-3 mr-1" />
                Editing
              </Badge>
            )}

            {isLockedByOther && (
              <Badge variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:bg-orange-900/20">
                <Eye className="h-3 w-3 mr-1" />
                Read-only
              </Badge>
            )}

            {!isLocked && !isAcquiringLock && (
              <Badge variant="secondary" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Viewing
              </Badge>
            )}

            {isAcquiringLock && (
              <Badge variant="secondary" className="text-xs">
                <div className="w-3 h-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                Acquiring Lock...
              </Badge>
            )}

            {/* Live typing indicator */}
            <TypingIndicator typingSessions={typingSessions} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Visibility Switch */}
          {canEdit && onVisibilityChange && (
            <VisibilitySwitch
              isPublic={isPublic}
              onToggle={onVisibilityChange}
              disabled={!canEdit}
            />
          )}

          <div className="flex items-center gap-3">
            {hasChanges && canEdit && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <span className="font-medium">Auto-saving...</span>
              </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isLockedByOther} className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => {/* TODO: Implement file operations */}}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Path
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {/* TODO: Implement file operations */}}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete File
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Enhanced Split View */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Enhanced Editor Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={displayContent}
                onChange={(e) => handleContentChangeWithTyping(e.target.value)}
                placeholder={
                  isLockedByOther 
                    ? `${lockedBy} is editing this file...` 
                    : canEdit
                      ? "Start typing your content here..."
                      : isAcquiringLock
                        ? "Acquiring editing permissions..."
                        : "Content will be editable once lock is acquired..."
                }
                disabled={!canEdit}
                className={`h-full resize-none border-0 rounded-none focus:ring-0 font-mono text-sm leading-relaxed bg-transparent transition-all duration-200 ${
                  !canEdit ? 'bg-slate-100/50 dark:bg-slate-800/50 cursor-default text-slate-600 dark:text-slate-400' : 'bg-white dark:bg-slate-900'
                }`}
                style={{ 
                  minHeight: '100%',
                  fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
                  lineHeight: '1.7'
                }}
              />
              {!canEdit && (
                <div className="absolute inset-0 bg-transparent pointer-events-none" />
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-200" />

        {/* Enhanced Preview Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full border-l border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900">
            <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-800 dark:to-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Eye className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Live Preview</span>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Real-time markdown rendering</div>
                </div>
                {isLockedByOther && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    {(liveContent || latestTypingContent) ? (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Live Updates
                      </div>
                    ) : 'Read-only'}
                  </Badge>
                )}
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100%-73px)]">
              <div className="p-6 bg-gradient-to-b from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-900/50 min-h-full">
                <HashnodeMarkdownRenderer content={displayContent} />
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
