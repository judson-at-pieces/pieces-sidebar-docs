
import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Save, FileText, Eye, Code, Split, PenTool, Zap } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { TSXRenderer } from './TSXRenderer';
import { toast } from 'sonner';

interface EnhancedEditorProps {
  selectedFile?: string;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  hasChanges: boolean;
  saving: boolean;
}

export function EnhancedEditor({
  selectedFile,
  content,
  onContentChange,
  onSave,
  hasChanges,
  saving
}: EnhancedEditorProps) {
  const [activeView, setActiveView] = useState<'split' | 'code' | 'preview'>('split');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const handleContentChange = useCallback((newContent: string) => {
    onContentChange(newContent);
    
    // Auto-save after 2 seconds of inactivity
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (hasChanges) {
        toast.info('Auto-saving...', { duration: 1500 });
        onSave();
      }
    }, 2000);
  }, [onContentChange, onSave, hasChanges]);

  const handleSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    onSave();
    toast.success('Saved successfully!', { duration: 2000 });
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4 p-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-primary/60" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">Ready to Create</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Select a file from the sidebar to start editing, or create a new one to begin your documentation journey.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Enhanced Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-background to-muted/10 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="font-semibold text-lg text-foreground truncate max-w-xs">{selectedFile}</h2>
          </div>
          
          {hasChanges && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full text-xs font-medium animate-in fade-in slide-in-from-left-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Unsaved changes
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Enhanced View Toggle */}
          <div className="flex items-center bg-muted/50 backdrop-blur-sm rounded-lg p-1 border">
            <Button
              variant={activeView === 'code' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('code')}
              className="h-8 px-3 gap-2 text-xs font-medium transition-all duration-200"
            >
              <Code className="h-3.5 w-3.5" />
              Code
            </Button>
            <Button
              variant={activeView === 'split' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('split')}
              className="h-8 px-3 gap-2 text-xs font-medium transition-all duration-200"
            >
              <Split className="h-3.5 w-3.5" />
              Split
            </Button>
            <Button
              variant={activeView === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('preview')}
              className="h-8 px-3 gap-2 text-xs font-medium transition-all duration-200"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Button>
          </div>

          {/* Enhanced Save Button */}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            size="sm"
            className="min-w-[90px] gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-200 shadow-sm"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Editor Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeView === 'code' && (
          <div className="h-full animate-in fade-in slide-in-from-left-2 duration-300">
            <CodeEditor
              content={content}
              onChange={handleContentChange}
              language="markdown"
            />
          </div>
        )}

        {activeView === 'preview' && (
          <div className="h-full animate-in fade-in slide-in-from-right-2 duration-300">
            <TSXRenderer 
              content={content} 
              onContentChange={handleContentChange}
            />
          </div>
        )}

        {activeView === 'split' && (
          <div className="h-full animate-in fade-in scale-in duration-300">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={50} minSize={25} className="relative">
                <div className="absolute inset-0">
                  <CodeEditor
                    content={content}
                    onChange={handleContentChange}
                    language="markdown"
                  />
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle className="bg-border/50 hover:bg-border transition-colors duration-200" />
              
              <ResizablePanel defaultSize={50} minSize={25} className="relative">
                <div className="absolute inset-0">
                  <TSXRenderer 
                    content={content} 
                    onContentChange={handleContentChange}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        )}

        {/* Floating Auto-save Indicator */}
        {hasChanges && (
          <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-blue-500" />
              Auto-save in 2s
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
