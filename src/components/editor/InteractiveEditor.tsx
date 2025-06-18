
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit3, Save, Plus, Type, Image, List, Hash } from 'lucide-react';
import { toast } from 'sonner';
import HashnodeMarkdownRenderer from '@/components/HashnodeMarkdownRenderer';

interface InteractiveEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  isLocked?: boolean;
  lockedBy?: string | null;
}

export function InteractiveEditor({
  content,
  onContentChange,
  isLocked = false,
  lockedBy
}: InteractiveEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [tempContent, setTempContent] = useState(content);
  const containerRef = useRef<HTMLDivElement>(null);

  const canEdit = !isLocked || lockedBy === 'You';

  useEffect(() => {
    setTempContent(content);
  }, [content]);

  // Make elements editable when editing mode is enabled
  useEffect(() => {
    if (!containerRef.current || !canEdit) return;

    const container = containerRef.current;
    const editableElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p');

    editableElements.forEach((element) => {
      if (isEditing) {
        // Add click handler and styling for editing mode
        element.addEventListener('click', handleElementClick);
        element.classList.add('cursor-pointer', 'hover:bg-blue-50', 'dark:hover:bg-blue-900/20', 'p-2', 'rounded', 'transition-colors', 'ring-2', 'ring-blue-200', 'dark:ring-blue-800');
        element.setAttribute('title', 'Click to edit');
      } else {
        // Remove click handler and styling
        element.removeEventListener('click', handleElementClick);
        element.classList.remove('cursor-pointer', 'hover:bg-blue-50', 'dark:hover:bg-blue-900/20', 'p-2', 'rounded', 'transition-colors', 'ring-2', 'ring-blue-200', 'dark:ring-blue-800');
        element.removeAttribute('title');
      }
    });

    // Cleanup function
    return () => {
      editableElements.forEach((element) => {
        element.removeEventListener('click', handleElementClick);
      });
    };
  }, [isEditing, tempContent, canEdit]);

  const handleElementClick = (e: Event) => {
    if (!canEdit || !isEditing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.currentTarget as HTMLElement;
    const elementType = target.tagName.toLowerCase();
    
    // Make element editable
    target.contentEditable = 'true';
    target.focus();
    setEditingElement(target.id || `${elementType}-${Date.now()}`);
    
    // Add visual indication
    target.style.outline = '2px solid #3b82f6';
    target.style.outlineOffset = '2px';
    
    // Add keydown handler
    target.addEventListener('keydown', handleKeyDown);
    
    toast.info(`Editing ${elementType}. Press Enter to save or Escape to cancel.`);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveElement(e.currentTarget as HTMLElement);
    } else if (e.key === 'Escape') {
      cancelEdit(e.currentTarget as HTMLElement);
    }
  };

  const saveElement = (element: HTMLElement) => {
    const newContent = element.textContent || '';
    const elementType = element.tagName.toLowerCase();
    
    // Update the markdown content based on element type
    let updatedMarkdown = tempContent;
    
    // Simple content replacement - in a real implementation, you'd want more sophisticated parsing
    if (elementType === 'h1') {
      updatedMarkdown = updatedMarkdown.replace(/^# .+$/m, `# ${newContent}`);
    } else if (elementType === 'h2') {
      updatedMarkdown = updatedMarkdown.replace(/^## .+$/m, `## ${newContent}`);
    } else if (elementType === 'h3') {
      updatedMarkdown = updatedMarkdown.replace(/^### .+$/m, `### ${newContent}`);
    } else if (elementType === 'p') {
      // For paragraphs, replace the first occurrence of similar content
      const lines = updatedMarkdown.split('\n');
      const targetLine = lines.findIndex(line => line.trim() && !line.startsWith('#') && !line.startsWith('-') && !line.startsWith('```'));
      if (targetLine !== -1) {
        lines[targetLine] = newContent;
        updatedMarkdown = lines.join('\n');
      }
    }
    
    setTempContent(updatedMarkdown);
    onContentChange(updatedMarkdown);
    
    // Remove editing state
    element.contentEditable = 'false';
    element.style.outline = '';
    element.removeEventListener('keydown', handleKeyDown);
    setEditingElement(null);
    
    toast.success('Content updated!');
  };

  const cancelEdit = (element: HTMLElement) => {
    element.contentEditable = 'false';
    element.style.outline = '';
    element.removeEventListener('keydown', handleKeyDown);
    setEditingElement(null);
    
    // Restore original content
    setTempContent(content);
    toast.info('Edit cancelled');
  };

  const addNewSection = (type: 'heading' | 'paragraph' | 'list' | 'image') => {
    if (!canEdit) return;
    
    let newContent = '';
    
    switch (type) {
      case 'heading':
        newContent = '\n\n## New Heading\n\n';
        break;
      case 'paragraph':
        newContent = '\n\nNew paragraph content. Click to edit.\n\n';
        break;
      case 'list':
        newContent = '\n\n- List item 1\n- List item 2\n- List item 3\n\n';
        break;
      case 'image':
        newContent = '\n\n![Alt text](https://via.placeholder.com/400x200?text=Click+to+edit+image)\n\n';
        break;
    }
    
    const updatedContent = tempContent + newContent;
    setTempContent(updatedContent);
    onContentChange(updatedContent);
    
    toast.success(`New ${type} added!`);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Edit3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <span className="text-sm font-medium">Interactive Editor</span>
              <div className="text-xs text-muted-foreground">
                {isEditing ? "✨ Click any element to edit it" : "Click 'Edit Mode' to start editing"}
              </div>
            </div>
          </div>
          
          {isLocked && lockedBy && lockedBy !== 'You' && (
            <Badge variant="secondary" className="text-xs">
              Locked by {lockedBy}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button
                variant={isEditing ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="h-8 px-3 gap-2 text-xs font-medium transition-all duration-200"
              >
                <Edit3 className="h-3.5 w-3.5" />
                {isEditing ? 'Exit Edit Mode' : 'Edit Mode'}
              </Button>
              
              {isEditing && (
                <div className="flex items-center gap-1 border-l pl-2 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addNewSection('heading')}
                    className="h-7 w-7 p-0"
                    title="Add heading"
                  >
                    <Hash className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addNewSection('paragraph')}
                    className="h-7 w-7 p-0"
                    title="Add paragraph"
                  >
                    <Type className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addNewSection('list')}
                    className="h-7 w-7 p-0"
                    title="Add list"
                  >
                    <List className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addNewSection('image')}
                    className="h-7 w-7 p-0"
                    title="Add image"
                  >
                    <Image className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-background rounded-lg border border-border p-6 shadow-sm">
              {isEditing && canEdit && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <Edit3 className="h-4 w-4" />
                    <span className="font-medium">Interactive Edit Mode Active</span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Click on any text element to edit it directly. Press Enter to save or Escape to cancel.
                  </p>
                </div>
              )}
              
              <div className="markdown-content" ref={containerRef}>
                <HashnodeMarkdownRenderer content={tempContent} />
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
