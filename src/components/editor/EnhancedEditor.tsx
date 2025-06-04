
import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Save, FileText, Eye } from 'lucide-react';
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
        toast.info('Auto-saving...');
        onSave();
      }
    }, 2000);
  }, [onContentChange, onSave, hasChanges]);

  const handleSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    onSave();
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No file selected</p>
          <p className="text-sm">Select a file from the sidebar to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-lg">{selectedFile}</h2>
          {hasChanges && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg border p-1">
            <Button
              variant={activeView === 'code' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('code')}
              className="h-7 px-2"
            >
              Code
            </Button>
            <Button
              variant={activeView === 'split' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('split')}
              className="h-7 px-2"
            >
              Split
            </Button>
            <Button
              variant={activeView === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('preview')}
              className="h-7 px-2"
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
          </div>

          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            size="sm"
            className="min-w-[80px]"
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'code' && (
          <CodeEditor
            content={content}
            onChange={handleContentChange}
            language="markdown"
          />
        )}

        {activeView === 'preview' && (
          <TSXRenderer 
            content={content} 
            onContentChange={handleContentChange}
          />
        )}

        {activeView === 'split' && (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={30}>
              <CodeEditor
                content={content}
                onChange={handleContentChange}
                language="markdown"
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <TSXRenderer 
                content={content} 
                onContentChange={handleContentChange}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
