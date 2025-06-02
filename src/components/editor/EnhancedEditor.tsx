
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Eye, Edit, Maximize2, Minimize2 } from "lucide-react";
import { TSXRenderer } from "./TSXRenderer";
import { CommandPalette } from "./CommandPalette";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface EnhancedEditorProps {
  selectedFile?: string;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  hasChanges: boolean;
  saving?: boolean;
}

export function EnhancedEditor({ 
  selectedFile, 
  content, 
  onContentChange, 
  onSave, 
  hasChanges,
  saving 
}: EnhancedEditorProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandPosition, setCommandPosition] = useState({ top: 0, left: 0 });
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [slashPosition, setSlashPosition] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle any keys when command palette is open - let it handle its own events
      if (isCommandPaletteOpen) {
        return;
      }
      
      // Handle Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges) {
          onSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges, onSave, isCommandPaletteOpen]);

  // Close command palette on window resize to prevent positioning issues
  useEffect(() => {
    const handleWindowResize = () => {
      if (isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };

    if (isCommandPaletteOpen) {
      window.addEventListener('resize', handleWindowResize);
    }

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [isCommandPaletteOpen]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Check if user typed "/" at the beginning of a line
    if (newContent[cursorPosition - 1] === '/') {
      const beforeCursor = newContent.substring(0, cursorPosition - 1);
      const lines = beforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      
      // If "/" is at the start of a line or after whitespace
      if (currentLine.trim() === '') {
        const textarea = textareaRef.current;
        if (textarea) {
          const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24;
          const linesBeforeCursor = beforeCursor.split('\n').length - 1;
          
          // Calculate position relative to textarea content
          const linePosition = linesBeforeCursor * lineHeight;
          const commandPaletteHeight = 320;
          const commandPaletteWidth = 320;
          
          // Position relative to the textarea (absolute positioning)
          let top = linePosition + lineHeight + 8; // 8px gap below the line
          let left = 20; // 20px from left edge of textarea
          
          // Get textarea dimensions to constrain the palette
          const textareaHeight = textarea.clientHeight;
          const textareaWidth = textarea.clientWidth;
          
          // Ensure command palette stays within textarea bounds
          if (top + commandPaletteHeight > textareaHeight) {
            top = linePosition - commandPaletteHeight - 8;
            if (top < 0) {
              top = 8;
            }
          }
          
          // Ensure horizontal position stays within textarea bounds
          if (left + commandPaletteWidth > textareaWidth) {
            left = textareaWidth - commandPaletteWidth - 20;
          }
          
          // Ensure minimum distance from textarea edges
          top = Math.max(8, Math.min(top, textareaHeight - commandPaletteHeight - 8));
          left = Math.max(8, Math.min(left, textareaWidth - commandPaletteWidth - 8));
          
          setCommandPosition({ top, left });
          setIsCommandPaletteOpen(true);
          
          // Store the position where slash was typed (before removing it)
          setSlashPosition(cursorPosition - 1);
          
          // Remove the "/" character
          const contentWithoutSlash = newContent.substring(0, cursorPosition - 1) + newContent.substring(cursorPosition);
          onContentChange(contentWithoutSlash);
          
          // Restore cursor position after removing slash - no setTimeout needed
          if (textarea) {
            textarea.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
          }
          return;
        }
      }
    }
    
    onContentChange(newContent);
  };

  const handleInsertFragment = (fragmentContent: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Use the stored slash position if available, otherwise use current cursor position
    const insertPosition = slashPosition !== null ? slashPosition : textarea.selectionStart;
    const beforeInsert = content.substring(0, insertPosition);
    const afterInsert = content.substring(insertPosition);
    
    const newContent = beforeInsert + fragmentContent + afterInsert;
    onContentChange(newContent);
    
    // Clear the slash position after using it
    setSlashPosition(null);
    
    // Set cursor position after the inserted content and ensure visibility
    setTimeout(() => {
      if (textarea) {
        const newPosition = insertPosition + fragmentContent.length;
        textarea.setSelectionRange(newPosition, newPosition);
        textarea.focus();
        
        // Only scroll if the cursor is not visible in the current viewport
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24;
        const linesBeforeCursor = newContent.substring(0, newPosition).split('\n').length - 1;
        const cursorTop = linesBeforeCursor * lineHeight;
        
        // Check if cursor is visible in current viewport
        const scrollTop = textarea.scrollTop;
        const visibleHeight = textarea.clientHeight;
        
        // Only scroll if cursor is outside visible area
        if (cursorTop < scrollTop || cursorTop > scrollTop + visibleHeight - lineHeight) {
          // Center the cursor in the viewport
          textarea.scrollTop = cursorTop - (visibleHeight / 2);
        }
      }
    }, 0);
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/10">
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <Edit className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No file selected</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Select a markdown file from the sidebar to start editing, or create a new one.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Toolbar */}
      <div className="border-b border-border p-3 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium truncate max-w-xs">{selectedFile}</span>
              {hasChanges && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  Modified
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center border border-border rounded-lg">
              <Button
                variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('edit')}
                className="rounded-r-none border-r h-8"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('split')}
                className="rounded-none border-r h-8"
              >
                Split
              </Button>
              <Button
                variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('preview')}
                className="rounded-l-none h-8"
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSave}
              disabled={!hasChanges || saving}
              className="h-8"
            >
              <Save className="h-3 w-3 mr-2" />
              {saving ? 'Creating PR...' : 'Save & Create PR'}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'edit' && (
          <div className="h-full p-4">
            <div className="relative h-full">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={handleTextareaChange}
                className="w-full h-full resize-none font-mono text-sm leading-6 bg-background"
                placeholder="Start writing your markdown documentation... (Type '/' for quick inserts)"
                style={{ minHeight: '100%' }}
              />
              <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50">
                Type "/" for snippets • Ctrl+S to save
              </div>
              {/* Command Palette positioned within textarea container */}
              <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => {
                  setIsCommandPaletteOpen(false);
                  setSlashPosition(null);
                }}
                onInsert={handleInsertFragment}
                position={commandPosition}
              />
            </div>
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6">
              <TSXRenderer content={content} />
            </div>
          </div>
        )}

        {viewMode === 'split' && (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full p-4">
                <div className="relative h-full">
                  <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleTextareaChange}
                    className="w-full h-full resize-none font-mono text-sm leading-6 bg-background"
                    placeholder="Start writing your markdown documentation... (Type '/' for quick inserts)"
                    style={{ minHeight: '100%' }}
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/90 backdrop-blur-sm px-2 py-1 rounded border border-border/50">
                    Type "/" for snippets
                  </div>
                  {/* Command Palette positioned within textarea container */}
                  <CommandPalette
                    isOpen={isCommandPaletteOpen}
                    onClose={() => {
                      setIsCommandPaletteOpen(false);
                      setSlashPosition(null);
                    }}
                    onInsert={handleInsertFragment}
                    position={commandPosition}
                  />
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full overflow-y-auto border-l border-border bg-muted/5">
                <div className="max-w-none p-6">
                  <TSXRenderer content={content} />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
