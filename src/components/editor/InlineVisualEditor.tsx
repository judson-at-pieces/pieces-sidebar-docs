
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Eye, Edit3, Type, Hash, List, Link2, Image, Code, Quote, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import HashnodeMarkdownRenderer from '@/components/markdown/HashnodeMarkdownRenderer';
import { EnhancedCommandPalette } from './EnhancedCommandPalette';

interface InlineVisualEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  readOnly?: boolean;
}

export function InlineVisualEditor({ content, onContentChange, readOnly = false }: InlineVisualEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPosition, setCommandPosition] = useState({ top: 0, left: 0 });
  const [lastContent, setLastContent] = useState(content);
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+/ for command palette
      if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);
        let position = { top: 100, left: 50 };
        
        if (range) {
          const rect = range.getBoundingClientRect();
          position = {
            top: rect.bottom + 10,
            left: rect.left
          };
        } else if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          position = {
            top: rect.top + 100,
            left: rect.left + 50
          };
        }
        
        setCommandPosition(position);
        setShowCommandPalette(true);
      }
      
      // Escape to exit editing
      if (e.key === 'Escape') {
        setIsEditing(false);
        setShowCommandPalette(false);
        if (contentRef.current) {
          contentRef.current.blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save cursor position
  const saveCursorPosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !contentRef.current) return null;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(contentRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return {
      offset: preCaretRange.toString().length,
      element: contentRef.current
    };
  }, []);

  // Restore cursor position
  const restoreCursorPosition = useCallback((position: { offset: number; element: HTMLElement }) => {
    if (!position || !contentRef.current) return;

    const walker = document.createTreeWalker(
      contentRef.current,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let currentOffset = 0;
    let node;

    while (node = walker.nextNode()) {
      const textLength = node.textContent?.length || 0;
      if (currentOffset + textLength >= position.offset) {
        const range = document.createRange();
        const selection = window.getSelection();
        const targetOffset = position.offset - currentOffset;
        
        range.setStart(node, Math.min(targetOffset, textLength));
        range.setEnd(node, Math.min(targetOffset, textLength));
        
        selection?.removeAllRanges();
        selection?.addRange(range);
        break;
      }
      currentOffset += textLength;
    }
  }, []);

  // Improved HTML to markdown conversion that preserves structure
  const htmlToMarkdown = useCallback((html: string): string => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    function processNode(node: Node): string {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        const children = Array.from(element.childNodes).map(processNode).join('');
        
        switch (tagName) {
          case 'h1': return `# ${children}\n\n`;
          case 'h2': return `## ${children}\n\n`;
          case 'h3': return `### ${children}\n\n`;
          case 'h4': return `#### ${children}\n\n`;
          case 'h5': return `##### ${children}\n\n`;
          case 'h6': return `###### ${children}\n\n`;
          case 'p': 
            if (!children.trim()) return '';
            return `${children}\n\n`;
          case 'br': return '\n';
          case 'strong': case 'b': return `**${children}**`;
          case 'em': case 'i': return `_${children}_`;
          case 'code': return `\`${children}\``;
          case 'pre': return `\`\`\`\n${children}\n\`\`\`\n\n`;
          case 'blockquote': return `> ${children}\n\n`;
          case 'ul': return `${children}\n`;
          case 'ol': return `${children}\n`;
          case 'li': return `- ${children}\n`;
          case 'a': 
            const href = element.getAttribute('href');
            return href ? `[${children}](${href})` : children;
          case 'img':
            const src = element.getAttribute('src');
            const alt = element.getAttribute('alt') || '';
            return src ? `![${alt}](${src})` : '';
          case 'hr': return '---\n\n';
          case 'div': 
            // Handle special div classes
            if (element.classList.contains('markdown-content')) {
              return children;
            }
            return children ? `${children}\n` : '';
          case 'span': return children;
          default: return children;
        }
      }
      
      return '';
    }
    
    let markdown = '';
    Array.from(tempDiv.childNodes).forEach(node => {
      markdown += processNode(node);
    });
    
    // Clean up excessive newlines
    return markdown.replace(/\n{3,}/g, '\n\n').trim();
  }, []);

  // Handle content changes with cursor preservation
  const handleContentChange = useCallback(() => {
    if (!contentRef.current || readOnly || isUpdating) return;
    
    const cursorPosition = saveCursorPosition();
    const htmlContent = contentRef.current.innerHTML;
    const markdownContent = htmlToMarkdown(htmlContent);
    
    if (markdownContent !== lastContent) {
      setLastContent(markdownContent);
      onContentChange(markdownContent);
      
      // Restore cursor position after a short delay
      setTimeout(() => {
        if (cursorPosition) {
          restoreCursorPosition(cursorPosition);
        }
      }, 10);
    }
  }, [htmlToMarkdown, lastContent, onContentChange, readOnly, isUpdating, saveCursorPosition, restoreCursorPosition]);

  // Handle focus and blur
  const handleFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    handleContentChange();
  }, [handleContentChange]);

  // Handle input events for real-time updates with debouncing
  const handleInput = useCallback(() => {
    // Debounce the content change to avoid excessive updates
    const timeoutId = setTimeout(() => {
      handleContentChange();
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [handleContentChange]);

  // Handle command palette insertions
  const handleInsertContent = useCallback((insertContent: string) => {
    if (!contentRef.current) return;
    
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    
    if (range) {
      // Insert at cursor position
      range.deleteContents();
      
      // Insert as text node to maintain markdown format
      const textNode = document.createTextNode(insertContent);
      range.insertNode(textNode);
      
      // Move cursor after inserted content
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else {
      // Append to end
      const newContent = content + '\n\n' + insertContent;
      onContentChange(newContent);
    }
    
    setShowCommandPalette(false);
    
    // Trigger content change after insertion
    setTimeout(() => {
      handleContentChange();
    }, 50);
  }, [content, onContentChange, handleContentChange]);

  // Update content when prop changes (but preserve cursor)
  useEffect(() => {
    if (content !== lastContent && contentRef.current && !isEditing) {
      setIsUpdating(true);
      setLastContent(content);
      
      // Re-render the markdown content
      const tempContainer = document.createElement('div');
      tempContainer.className = 'markdown-content';
      
      // Create a React element and render it
      const renderContainer = document.createElement('div');
      renderContainer.innerHTML = `<div class="markdown-content"></div>`;
      
      // Clear and update content
      contentRef.current.innerHTML = '';
      
      // Use the HashnodeMarkdownRenderer to render content
      import('react-dom/client').then(({ createRoot }) => {
        const root = createRoot(contentRef.current!);
        root.render(React.createElement(HashnodeMarkdownRenderer, { content }));
        
        setTimeout(() => {
          setIsUpdating(false);
        }, 100);
      });
    }
  }, [content, lastContent, isEditing]);

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
              <span className="text-sm font-medium">Visual Editor</span>
              <div className="text-xs text-muted-foreground">
                {isEditing 
                  ? "✨ Editing mode active - type anywhere • Ctrl+/ for components" 
                  : "📝 Click anywhere to start editing • Ctrl+/ for components"
                }
              </div>
            </div>
          </div>
          {isEditing && (
            <Badge variant="default" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Editing
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
            <Plus className="h-3 w-3" />
            <span>Ctrl+/</span>
          </div>
          <span>for components</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className={`
            bg-background rounded-lg border border-border p-6 shadow-sm
            ${!readOnly ? 'hover:shadow-md transition-shadow duration-200' : ''}
          `}>
            {!readOnly && (
              <div className="mb-4 text-sm text-muted-foreground border-b border-border pb-2">
                <span className="font-medium">Fluid Visual Editor</span>
                <p className="text-xs mt-1">
                  Click anywhere to start editing. Type naturally and changes are saved as markdown automatically.
                </p>
              </div>
            )}
            
            <div 
              ref={contentRef}
              contentEditable={!readOnly}
              suppressContentEditableWarning={true}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onInput={handleInput}
              className={`
                markdown-content outline-none min-h-[200px]
                ${!readOnly ? 'cursor-text' : 'cursor-default'}
                ${isEditing ? 'ring-2 ring-purple-500/20 ring-offset-2' : ''}
              `}
              style={{
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            >
              <HashnodeMarkdownRenderer content={content} />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Command Palette */}
      <EnhancedCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onInsert={handleInsertContent}
        position={commandPosition}
      />
    </div>
  );
}
