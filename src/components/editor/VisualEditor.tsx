
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Wand2 } from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { createComponentMappings } from '@/components/markdown/componentMappings';
import { processCustomSyntax } from '@/components/markdown/customSyntaxProcessor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkFrontmatter from 'remark-frontmatter';
import rehypeRaw from 'rehype-raw';

interface VisualEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onSave?: () => void;
  isLocked?: boolean;
  lockedBy?: string | null;
}

export function VisualEditor({ 
  content, 
  onContentChange, 
  onSave, 
  isLocked = false, 
  lockedBy 
}: VisualEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPosition, setCommandPosition] = useState({ top: 0, left: 0 });
  const [currentContent, setCurrentContent] = useState(content);

  // Update content when prop changes
  useEffect(() => {
    setCurrentContent(content);
  }, [content]);

  // Process content for rendering
  const processedContent = React.useMemo(() => {
    try {
      return processCustomSyntax(currentContent);
    } catch (error) {
      console.error('Error processing content:', error);
      return currentContent;
    }
  }, [currentContent]);

  // Create enhanced component mappings for visual editing
  const createEditableComponents = useCallback(() => {
    const baseComponents = createComponentMappings();
    
    if (!isEditing) return baseComponents;

    // Add click handlers to make components editable
    return {
      ...baseComponents,
      h1: ({ children, ...props }: any) => (
        <h1 
          {...props}
          className="text-4xl font-bold mb-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded transition-colors"
          onClick={(e) => handleElementClick(e, 'h1', children)}
          title="Click to edit heading"
        >
          {children}
        </h1>
      ),
      h2: ({ children, ...props }: any) => (
        <h2 
          {...props}
          className="text-3xl font-semibold mb-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded transition-colors"
          onClick={(e) => handleElementClick(e, 'h2', children)}
          title="Click to edit heading"
        >
          {children}
        </h2>
      ),
      h3: ({ children, ...props }: any) => (
        <h3 
          {...props}
          className="text-2xl font-semibold mb-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded transition-colors"
          onClick={(e) => handleElementClick(e, 'h3', children)}
          title="Click to edit heading"
        >
          {children}
        </h3>
      ),
      p: ({ children, ...props }: any) => (
        <p 
          {...props}
          className="mb-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20 p-2 rounded transition-colors"
          onClick={(e) => handleElementClick(e, 'p', children)}
          title="Click to edit paragraph"
        >
          {children}
        </p>
      ),
      li: ({ children, ...props }: any) => (
        <li 
          {...props}
          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20 p-1 rounded transition-colors"
          onClick={(e) => handleElementClick(e, 'li', children)}
          title="Click to edit list item"
        >
          {children}
        </li>
      ),
    };
  }, [isEditing]);

  const handleElementClick = (e: React.MouseEvent, elementType: string, children: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isEditing) return;

    // Get text content
    const textContent = typeof children === 'string' ? children : 
                      Array.isArray(children) ? children.join('') : '';
    
    // Create inline editor
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    // Create input for editing
    const input = document.createElement('input');
    input.type = 'text';
    input.value = textContent;
    input.className = 'w-full p-2 border rounded text-sm bg-white dark:bg-gray-800';
    input.style.position = 'absolute';
    input.style.top = `${rect.top + window.scrollY}px`;
    input.style.left = `${rect.left}px`;
    input.style.width = `${rect.width}px`;
    input.style.zIndex = '1000';
    
    document.body.appendChild(input);
    input.focus();
    input.select();

    const handleSave = () => {
      const newValue = input.value;
      document.body.removeChild(input);
      
      // Update content based on element type
      let updatedContent = currentContent;
      const oldText = textContent;
      
      if (elementType.startsWith('h')) {
        const level = elementType.slice(1);
        const hashPrefix = '#'.repeat(parseInt(level));
        updatedContent = updatedContent.replace(
          new RegExp(`^${hashPrefix}\\s+${escapeRegex(oldText)}`, 'm'),
          `${hashPrefix} ${newValue}`
        );
      } else if (elementType === 'p') {
        updatedContent = updatedContent.replace(
          new RegExp(`^${escapeRegex(oldText)}$`, 'm'),
          newValue
        );
      } else if (elementType === 'li') {
        updatedContent = updatedContent.replace(
          new RegExp(`^[-*+]\\s+${escapeRegex(oldText)}`, 'm'),
          `- ${newValue}`
        );
      }
      
      setCurrentContent(updatedContent);
      onContentChange(updatedContent);
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        document.body.removeChild(input);
      }
    });

    input.addEventListener('blur', handleSave);
  };

  const escapeRegex = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setCommandPosition({
          top: rect.bottom + window.scrollY + 10,
          left: rect.left + window.scrollX
        });
      } else {
        setCommandPosition({ top: 200, left: 200 });
      }
      
      setShowCommandPalette(true);
    }
  }, []);

  useEffect(() => {
    if (isEditing) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEditing, handleKeyDown]);

  const handleInsert = (insertContent: string) => {
    const newContent = currentContent + '\n\n' + insertContent;
    setCurrentContent(newContent);
    onContentChange(newContent);
    setShowCommandPalette(false);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-600" />
              Visual Editor
              {isLocked && lockedBy && (
                <Badge variant="secondary" className="ml-2">
                  Locked by {lockedBy}
                </Badge>
              )}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isLocked}
              className="gap-2"
            >
              {isEditing ? (
                <>
                  <Edit className="h-4 w-4" />
                  Editing
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Preview
                </>
              )}
            </Button>
          </div>
        </div>
        
        {isEditing && (
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            💡 Click on any text element to edit it inline, or press Ctrl+/ to insert new components
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        <div 
          ref={editorRef}
          className={`prose prose-slate dark:prose-invert max-w-none ${
            isEditing ? 'prose-headings:transition-colors prose-p:transition-colors' : ''
          }`}
        >
          <ReactMarkdown
            components={createEditableComponents()}
            remarkPlugins={[remarkGfm, remarkBreaks, remarkFrontmatter]}
            rehypePlugins={[rehypeRaw]}
            skipHtml={false}
          >
            {processedContent}
          </ReactMarkdown>
        </div>
      </CardContent>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onInsert={handleInsert}
        position={commandPosition}
      />
    </Card>
  );
}
