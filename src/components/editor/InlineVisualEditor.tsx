
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
  const [isEditing, setIsEditing] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPosition, setCommandPosition] = useState({ top: 0, left: 0 });
  const [editingElement, setEditingElement] = useState<HTMLElement | null>(null);
  const [markdownLines, setMarkdownLines] = useState<string[]>([]);

  // Parse markdown into lines for easier manipulation
  useEffect(() => {
    setMarkdownLines(content.split('\n'));
  }, [content]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+/ for command palette
      if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setCommandPosition({
            top: rect.top + 100,
            left: rect.left + 50
          });
          setShowCommandPalette(true);
        }
      }
      
      // Escape to exit editing
      if (e.key === 'Escape') {
        setIsEditing(false);
        setEditingElement(null);
        setShowCommandPalette(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Make elements editable when clicked
  const makeElementsEditable = useCallback(() => {
    if (!containerRef.current || readOnly) return;

    const editableSelectors = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'li', 'blockquote',
      'code:not(pre code)', 'strong', 'em'
    ];

    editableSelectors.forEach(selector => {
      const elements = containerRef.current!.querySelectorAll(selector);
      elements.forEach((element: Element) => {
        const htmlElement = element as HTMLElement;
        
        // Add hover effect
        htmlElement.style.transition = 'all 0.2s ease';
        htmlElement.addEventListener('mouseenter', () => {
          if (!isEditing) {
            htmlElement.style.outline = '2px dashed #3b82f6';
            htmlElement.style.outlineOffset = '2px';
            htmlElement.style.cursor = 'pointer';
          }
        });
        
        htmlElement.addEventListener('mouseleave', () => {
          if (!isEditing) {
            htmlElement.style.outline = 'none';
          }
        });

        // Handle click to edit
        htmlElement.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (!isEditing) {
            setIsEditing(true);
            setEditingElement(htmlElement);
            htmlElement.contentEditable = 'true';
            htmlElement.style.outline = '2px solid #3b82f6';
            htmlElement.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            htmlElement.focus();
            
            // Select all text
            const range = document.createRange();
            range.selectNodeContents(htmlElement);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        });

        // Handle content changes
        htmlElement.addEventListener('blur', () => {
          if (htmlElement === editingElement) {
            handleElementEdit(htmlElement);
            setIsEditing(false);
            setEditingElement(null);
            htmlElement.contentEditable = 'false';
            htmlElement.style.outline = 'none';
            htmlElement.style.backgroundColor = 'transparent';
          }
        });

        htmlElement.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            htmlElement.blur();
          }
        });
      });
    });
  }, [isEditing, editingElement, readOnly]);

  // Convert edited HTML back to markdown
  const handleElementEdit = (element: HTMLElement) => {
    const newText = element.innerText.trim();
    const tagName = element.tagName.toLowerCase();
    
    // Find the original text in markdown and replace it
    let newMarkdown = content;
    
    // Simple text replacement for now - in a production app you'd want more sophisticated parsing
    const originalText = element.dataset.originalText || element.innerText;
    
    if (tagName.startsWith('h')) {
      const level = parseInt(tagName.charAt(1));
      const prefix = '#'.repeat(level);
      newMarkdown = newMarkdown.replace(
        new RegExp(`^${prefix}\\s+.*$`, 'm'),
        `${prefix} ${newText}`
      );
    } else if (tagName === 'p') {
      // Replace paragraph content
      const lines = newMarkdown.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() && !lines[i].startsWith('#') && !lines[i].startsWith('-') && !lines[i].startsWith('*')) {
          if (lines[i].includes(originalText)) {
            lines[i] = newText;
            break;
          }
        }
      }
      newMarkdown = lines.join('\n');
    }
    
    onContentChange(newMarkdown);
  };

  // Handle command palette insertions
  const handleInsertContent = (insertContent: string) => {
    const lines = content.split('\n');
    
    // Insert at the end for now - could be made smarter based on cursor position
    lines.push('', insertContent);
    
    onContentChange(lines.join('\n'));
    setShowCommandPalette(false);
  };

  // Re-make elements editable when content changes
  useEffect(() => {
    const timer = setTimeout(makeElementsEditable, 100);
    return () => clearTimeout(timer);
  }, [content, makeElementsEditable]);

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
                  ? "🎯 Click elsewhere or press Enter to save changes" 
                  : "✨ Click any element to edit inline • Ctrl+/ for components"
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
          <div 
            ref={containerRef}
            className={`
              bg-background rounded-lg border border-border p-6 shadow-sm
              ${!readOnly ? 'hover:shadow-md transition-shadow duration-200' : ''}
            `}
          >
            {!readOnly && (
              <div className="mb-4 text-sm text-muted-foreground border-b border-border pb-2">
                <span className="font-medium">Live Visual Editor</span>
                <p className="text-xs mt-1">
                  Click on any text element to edit it directly. Changes are automatically converted to markdown.
                </p>
              </div>
            )}
            
            <div className="markdown-content">
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
