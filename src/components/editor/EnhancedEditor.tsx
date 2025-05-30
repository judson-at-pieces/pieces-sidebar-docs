
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
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
  }, [hasChanges, onSave]);

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
          const rect = textarea.getBoundingClientRect();
          const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
          const linesBeforeCursor = beforeCursor.split('\n').length - 1;
          
          setCommandPosition({
            top: rect.top + (linesBeforeCursor * lineHeight) + 30,
            left: rect.left + 20
          });
          setIsCommandPaletteOpen(true);
          
          // Remove the "/" character
          const contentWithoutSlash = newContent.substring(0, cursorPosition - 1) + newContent.substring(cursorPosition);
          onContentChange(contentWithoutSlash);
          return;
        }
      }
    }
    
    onContentChange(newContent);
  };

  const handleInsertFragment = (fragmentContent: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const beforeCursor = content.substring(0, cursorPosition);
    const afterCursor = content.substring(cursorPosition);
    
    const newContent = beforeCursor + fragmentContent + afterCursor;
    onContentChange(newContent);
    
    // Set cursor position after the inserted content
    setTimeout(() => {
      if (textarea) {
        const newPosition = cursorPosition + fragmentContent.length;
        textarea.setSelectionRange(newPosition, newPosition);
        textarea.focus();
      }
    }, 0);
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground">No file selected</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Select a file from the sidebar to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Toolbar */}
      <div className="border-b border-border p-4 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{selectedFile}</span>
            {hasChanges && <span className="text-xs text-muted-foreground">• Modified</span>}
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center border border-border rounded-md">
              <Button
                variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('edit')}
                className="rounded-r-none"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('split')}
                className="rounded-none border-x"
              >
                Split
              </Button>
              <Button
                variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('preview')}
                className="rounded-l-none"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSave}
              disabled={!hasChanges || saving}
            >
              <Save className="h-4 w-4 mr-2" />
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
                className="w-full h-full resize-none font-mono text-sm"
                placeholder="Start writing your TSX documentation... (Type '/' for quick inserts)"
              />
              <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                Tip: Type "/" for TSX fragments, Ctrl+S to save
              </div>
            </div>
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="max-w-none">
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
                    className="w-full h-full resize-none font-mono text-sm"
                    placeholder="Start writing your TSX documentation... (Type '/' for quick inserts)"
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                    Type "/" for TSX fragments
                  </div>
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full overflow-y-auto p-4 border-l border-border">
                <div className="max-w-none">
                  <TSXRenderer content={content} />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onInsert={handleInsertFragment}
        position={commandPosition}
      />
    </div>
  );
}
