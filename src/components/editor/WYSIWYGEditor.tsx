
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import HashnodeMarkdownRenderer from '@/components/markdown/HashnodeMarkdownRenderer';
import { Button } from '@/components/ui/button';
import { Wand2, Type, Bold, Italic, List, Quote, Code, Palette } from 'lucide-react';
import { CommandPalette } from './CommandPalette';

interface WYSIWYGEditorProps {
  content: string;
  onContentChange: (content: string) => void;
}

export function WYSIWYGEditor({ content, onContentChange }: WYSIWYGEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(content);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPosition, setCommandPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditableContent(content);
  }, [content]);

  // Debounced save function to prevent too many updates
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (newContent: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onContentChange(newContent);
        }, 500);
      };
    })(),
    [onContentChange]
  );

  const handleContentEdit = useCallback(() => {
    if (containerRef.current) {
      const textContent = containerRef.current.innerText || '';
      // For now, just use the text content as markdown
      // This preserves the content without complex HTML->MD conversion
      setEditableContent(textContent);
      debouncedSave(textContent);
    }
  }, [debouncedSave]);

  const handleInput = useCallback(() => {
    handleContentEdit();
  }, [handleContentEdit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Check for Ctrl+/ or Cmd+/ for command palette
    if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scrollTop = containerRef.current.scrollTop;
        
        setCommandPosition({
          top: rect.top + 40 - scrollTop,
          left: rect.left + 20
        });
        setShowCommandPalette(true);
      }
    } else if (e.key === 'Escape') {
      setShowCommandPalette(false);
    }
  }, []);

  const handleInsert = useCallback((insertContent: string) => {
    if (containerRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Create a text node with the new content
        const textNode = document.createTextNode('\n\n' + insertContent + '\n\n');
        range.deleteContents();
        range.insertNode(textNode);
        
        // Move cursor to end of inserted content
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Fallback: append to end
        const newContent = editableContent + '\n\n' + insertContent;
        setEditableContent(newContent);
        onContentChange(newContent);
      }
      
      // Trigger content update
      handleContentEdit();
    }
    setShowCommandPalette(false);
  }, [editableContent, onContentChange, handleContentEdit]);

  const insertText = useCallback((text: string) => {
    const newContent = editableContent + '\n\n' + text;
    setEditableContent(newContent);
    onContentChange(newContent);
  }, [editableContent, onContentChange]);

  const formatText = useCallback((command: string) => {
    if (!isEditing) return;
    
    try {
      document.execCommand(command, false);
      handleContentEdit();
    } catch (error) {
      console.log('Format command not supported:', command);
    }
  }, [isEditing, handleContentEdit]);

  const toolbarItems = [
    { icon: Type, label: 'Heading', action: () => insertText('## New Heading') },
    { icon: Bold, label: 'Bold', action: () => formatText('bold') },
    { icon: Italic, label: 'Italic', action: () => formatText('italic') },
    { icon: List, label: 'List', action: () => insertText('- List item\n- Another item') },
    { icon: Quote, label: 'Quote', action: () => insertText('> This is a quote') },
    { icon: Code, label: 'Code', action: () => insertText('```\ncode here\n```') },
  ];

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/10">
        <Button
          variant={isEditing ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="gap-2"
        >
          <Wand2 className="h-3.5 w-3.5" />
          {isEditing ? 'Exit Edit' : 'Edit Mode'}
        </Button>
        
        {isEditing && (
          <>
            <div className="w-px h-6 bg-border mx-2" />
            {toolbarItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={item.action}
                className="gap-1"
                title={item.label}
              >
                <item.icon className="h-3.5 w-3.5" />
              </Button>
            ))}
            
            <div className="w-px h-6 bg-border mx-2" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                <Palette className="h-3 w-3" />
                <span>Ctrl+/</span>
              </div>
              <span>for components</span>
            </div>
          </>
        )}
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isEditing ? (
            <div
              ref={containerRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onBlur={handleContentEdit}
              onKeyDown={handleKeyDown}
              className="min-h-[400px] outline-none prose prose-slate max-w-none dark:prose-invert focus:ring-2 focus:ring-primary/20 rounded-lg p-4 border border-dashed border-muted-foreground/30"
              style={{ whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ 
                __html: editableContent.replace(/\n/g, '<br>') 
              }}
            />
          ) : (
            <div className="prose prose-slate max-w-none dark:prose-invert">
              <HashnodeMarkdownRenderer content={editableContent} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onInsert={handleInsert}
        position={commandPosition}
      />
    </div>
  );
}
