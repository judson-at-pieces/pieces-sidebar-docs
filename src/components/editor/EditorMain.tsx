
import React, { useEffect, useRef } from 'react';
import { FileText, MoreHorizontal, Copy, Trash2, Eye, Edit3, Lock, Unlock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HashnodeMarkdownRenderer from '@/components/HashnodeMarkdownRenderer';
import { useLiveTyping } from '@/hooks/useLiveTyping';
import { TypingIndicator } from './TypingIndicator';
import { VisibilitySwitch } from './VisibilitySwitch';
import { VisualEditor } from './VisualEditor';
import { EnhancedCommandPalette } from './EnhancedCommandPalette';

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
  const [showCommandPalette, setShowCommandPalette] = React.useState(false);
  const [commandPosition, setCommandPosition] = React.useState({ top: 0, left: 0 });
  
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

  // Command palette for markdown editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        const scrollTop = textareaRef.current.scrollTop;
        
        setCommandPosition({
          top: rect.top + 40 - scrollTop,
          left: rect.left + 20
        });
        setShowCommandPalette(true);
      }
    } else if (e.key === 'Escape') {
      setShowCommandPalette(false);
    }
  };

  const handleInsert = (insertContent: string) => {
    if (textareaRef.current && canEdit) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newContent = content.slice(0, start) + insertContent + content.slice(end);
      onContentChange(newContent);
      
      // Set cursor position after the inserted content
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + insertContent.length, start + insertContent.length);
      }, 0);
    }
    setShowCommandPalette(false);
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
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background to-muted/10">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 mx-auto bg-muted/20 rounded-2xl flex items-center justify-center">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Select a File to Edit</h3>
            <p className="text-muted-foreground">
              Choose a file from the sidebar to start editing, or create a new one.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Live Editing Banner - only show when someone else is editing */}
      {isLockedByOther && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 border-b shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 animate-pulse" />
                <span className="font-semibold text-lg">
                  {lockedBy} is currently editing this page
                </span>
              </div>
              {(liveContent || latestTypingContent) && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Live Updates
                </Badge>
              )}
            </div>
            
            {/* Take Lock Button */}
            {onTakeLock && (
              <Button
                onClick={onTakeLock}
                disabled={isAcquiringLock}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {isAcquiringLock ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border border-current border-t-transparent" />
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
          <p className="text-center text-blue-100 mt-1 text-sm">
            {(liveContent || latestTypingContent) ? 'You can see their changes in real-time' : 'You can view the content but cannot make changes'}
          </p>
        </div>
      )}

      {/* File Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg truncate max-w-md">
              {selectedFile.split('/').pop()?.replace(/\.md$/, '') || 'Untitled'}
            </h2>
          </div>
          
          {canEdit && (
            <Badge variant="default" className="text-xs">
              <Edit3 className="h-3 w-3 mr-1" />
              Editing
            </Badge>
          )}

          {isLockedByOther && (
            <Badge variant="outline" className="text-xs">
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

        <div className="flex items-center gap-4">
          {/* Visibility Switch */}
          {canEdit && onVisibilityChange && (
            <VisibilitySwitch
              isPublic={isPublic}
              onToggle={onVisibilityChange}
              disabled={!canEdit}
            />
          )}

          <div className="flex items-center gap-2">
            {hasChanges && canEdit && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <span>Auto-saving...</span>
              </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isLockedByOther}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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

      {/* Editor Tabs */}
      <div className="flex-1 p-4">
        <Tabs defaultValue="split" className="h-full flex flex-col">
          <TabsList className="grid w-fit grid-cols-3 mb-4">
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="split">Split View</TabsTrigger>
          </TabsList>

          {/* Markdown Only */}
          <TabsContent value="markdown" className="flex-1 mt-0">
            <div className="h-full relative">
              <Textarea
                ref={textareaRef}
                value={displayContent}
                onChange={(e) => handleContentChangeWithTyping(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isLockedByOther 
                    ? `${lockedBy} is editing this file...` 
                    : canEdit
                      ? "Start typing your content here... Press Ctrl+/ for components"
                      : isAcquiringLock
                        ? "Acquiring editing permissions..."
                        : "Content will be editable once lock is acquired..."
                }
                disabled={!canEdit}
                className={`h-full resize-none border rounded-lg focus:ring-2 font-mono text-sm leading-relaxed ${
                  !canEdit ? 'bg-muted/30 cursor-default' : ''
                }`}
                style={{ 
                  minHeight: '100%',
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace'
                }}
              />
            </div>
          </TabsContent>

          {/* Visual Only */}
          <TabsContent value="visual" className="flex-1 mt-0">
            <VisualEditor
              content={displayContent}
              onContentChange={onContentChange}
              onSave={onSave}
              isLocked={!canEdit}
              lockedBy={isLockedByOther ? lockedBy : undefined}
            />
          </TabsContent>

          {/* Split View */}
          <TabsContent value="split" className="flex-1 mt-0">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Editor Panel */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full flex flex-col">
                  <div className="flex-1 relative">
                    <Textarea
                      ref={textareaRef}
                      value={displayContent}
                      onChange={(e) => handleContentChangeWithTyping(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        isLockedByOther 
                          ? `${lockedBy} is editing this file...` 
                          : canEdit
                            ? "Start typing your content here... Press Ctrl+/ for components"
                            : isAcquiringLock
                              ? "Acquiring editing permissions..."
                              : "Content will be editable once lock is acquired..."
                      }
                      disabled={!canEdit}
                      className={`h-full resize-none border-0 rounded-none focus:ring-0 font-mono text-sm leading-relaxed ${
                        !canEdit ? 'bg-muted/30 cursor-default' : ''
                      }`}
                      style={{ 
                        minHeight: '100%',
                        fontFamily: '"JetBrains Mono", "Fira Code", monospace'
                      }}
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Preview Panel */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full border-l border-border/50">
                  <div className="p-4 border-b border-border/50 bg-muted/10">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Live Preview</span>
                      {isLockedByOther && (
                        <Badge variant="outline" className="text-xs">
                          {(liveContent || latestTypingContent) ? 'Live Updates' : 'Read-only'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <ScrollArea className="h-[calc(100%-57px)]">
                    <div className="p-6">
                      <HashnodeMarkdownRenderer content={displayContent} />
                    </div>
                  </ScrollArea>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>
        </Tabs>
      </div>

      {/* Command Palette for Markdown Editor */}
      <EnhancedCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onInsert={handleInsert}
        position={commandPosition}
      />
    </div>
  );
}
