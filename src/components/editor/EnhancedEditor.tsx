
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, AlertCircle, SplitSquareHorizontal, MousePointer } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import HashnodeMarkdownRenderer from '@/components/markdown/HashnodeMarkdownRenderer';
import { WYSIWYGEditor } from './WYSIWYGEditor';

interface EnhancedEditorProps {
  selectedFile?: string;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  hasChanges: boolean;
  saving: boolean;
}

type ViewMode = 'edit' | 'preview' | 'split' | 'wysiwyg';

export function EnhancedEditor({ 
  selectedFile, 
  content, 
  onContentChange, 
  onSave, 
  hasChanges, 
  saving 
}: EnhancedEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [textareaContent, setTextareaContent] = useState(content);

  // Update textarea when content prop changes
  useEffect(() => {
    setTextareaContent(content);
  }, [content]);

  const handleContentChange = (newContent: string) => {
    setTextareaContent(newContent);
    onContentChange(newContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      // Auto-save on Ctrl+S
      onSave();
    }
  };

  if (!selectedFile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No file selected</h3>
          <p className="text-sm text-muted-foreground">Choose a file from the sidebar to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold truncate max-w-md">{selectedFile}</h2>
            {hasChanges && <Badge variant="secondary" className="text-xs">Unsaved</Badge>}
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Buttons */}
            <div className="flex items-center border rounded-md p-1">
              <Button
                variant={viewMode === 'edit' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('edit')}
                className="flex items-center gap-2 px-3 py-1"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              
              <Button
                variant={viewMode === 'wysiwyg' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('wysiwyg')}
                className="flex items-center gap-2 px-3 py-1"
              >
                <MousePointer className="w-4 h-4" />
                WYSIWYG
              </Button>
              
              <Button
                variant={viewMode === 'split' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('split')}
                className="flex items-center gap-2 px-3 py-1"
              >
                <SplitSquareHorizontal className="w-4 h-4" />
                Split
              </Button>
              
              <Button
                variant={viewMode === 'preview' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('preview')}
                className="flex items-center gap-2 px-3 py-1"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
            </div>
          </div>
        </div>
        
        {hasChanges && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <AlertCircle className="w-3 h-3" />
            <span>You have unsaved changes</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'edit' && (
          <div className="h-full p-4">
            <Textarea
              value={textareaContent}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Start writing your content..."
              className="h-full min-h-full resize-none border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm leading-relaxed"
              style={{ 
                fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, monospace',
                lineHeight: '1.6'
              }}
            />
          </div>
        )}

        {viewMode === 'wysiwyg' && (
          <WYSIWYGEditor
            content={textareaContent}
            onChange={handleContentChange}
          />
        )}

        {viewMode === 'preview' && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <HashnodeMarkdownRenderer content={textareaContent} />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'split' && (
          <div className="h-full flex">
            {/* Editor Pane */}
            <div className="flex-1 border-r">
              <div className="h-full p-4">
                <Textarea
                  value={textareaContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Start writing your content..."
                  className="h-full min-h-full resize-none border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm leading-relaxed"
                  style={{ 
                    fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, monospace',
                    lineHeight: '1.6'
                  }}
                />
              </div>
            </div>
            
            {/* Preview Pane */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-none mx-auto p-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <HashnodeMarkdownRenderer content={textareaContent} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
