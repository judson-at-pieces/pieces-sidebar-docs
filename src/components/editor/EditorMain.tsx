
import React from 'react';
import { EnhancedEditor } from './EnhancedEditor';
import { FileText, MoreHorizontal, Copy, Trash2, Lock, Edit, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface EditorMainProps {
  selectedFile?: string;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  hasChanges: boolean;
  saving: boolean;
  isLocked?: boolean;
  lockedBy?: string | null;
}

export function EditorMain({
  selectedFile,
  content,
  onContentChange,
  onSave,
  hasChanges,
  saving,
  isLocked = false,
  lockedBy = null
}: EditorMainProps) {
  const isReadOnly = !isLocked;

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
      {/* File Header with Live Editing Status */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg truncate max-w-md">
              {selectedFile.split('/').pop()?.replace(/\.md$/, '') || 'Untitled'}
            </h2>
          </div>
          
          {isReadOnly && (
            <Badge variant="outline" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Read Only
            </Badge>
          )}
          
          {isLocked && lockedBy === 'You' && (
            <Badge variant="default" className="text-xs">
              <Edit className="h-3 w-3 mr-1" />
              Editing
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span>Auto-saving...</span>
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
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

      {isReadOnly && (
        <div className="px-4 py-2 bg-muted/30 border-b border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>
              This file is read-only. {lockedBy && lockedBy !== 'You' ? `${lockedBy} is currently editing this file.` : 'Click "Start Editing" to begin collaborative editing.'}
            </span>
          </div>
        </div>
      )}

      {/* Split View */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Editor Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col">
            <div className="flex-1 relative">
              <Textarea
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder={isReadOnly ? "Content is read-only..." : "Start typing your content here..."}
                className="h-full resize-none border-0 rounded-none focus:ring-0 font-mono text-sm leading-relaxed"
                style={{ 
                  minHeight: '100%',
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace'
                }}
                readOnly={isReadOnly}
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
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100%-57px)]">
              <div className="p-6">
                <MarkdownRenderer content={content} />
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
