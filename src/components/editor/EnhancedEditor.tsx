
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, Edit, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import HashnodeMarkdownRenderer from '@/components/markdown/HashnodeMarkdownRenderer';

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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [textareaContent, setTextareaContent] = useState(content);

  // Update textarea when content prop changes
  useEffect(() => {
    setTextareaContent(content);
  }, [content]);

  const handleContentChange = (newContent: string) => {
    setTextareaContent(newContent);
    onContentChange(newContent);
  };

  const handleSave = () => {
    onSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
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
            <Button
              variant={isPreviewMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="flex items-center gap-2"
            >
              {isPreviewMode ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              size="sm"
              className="flex items-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
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
        {isPreviewMode ? (
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <HashnodeMarkdownRenderer content={textareaContent} />
              </div>
            </div>
          </div>
        ) : (
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
      </div>
    </div>
  );
}
