
import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import HashnodeMarkdownRenderer from '@/components/markdown/HashnodeMarkdownRenderer';
import { Button } from '@/components/ui/button';
import { Wand2, Type, Image, List, Quote, Code } from 'lucide-react';

interface WYSIWYGEditorProps {
  content: string;
  onContentChange: (content: string) => void;
}

export function WYSIWYGEditor({ content, onContentChange }: WYSIWYGEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(content);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditableContent(content);
  }, [content]);

  const handleContentEdit = () => {
    if (containerRef.current) {
      const htmlContent = containerRef.current.innerHTML;
      // This is a simplified conversion - in a real implementation, 
      // you'd want a proper HTML to Markdown converter
      const markdownContent = htmlToMarkdown(htmlContent);
      onContentChange(markdownContent);
    }
  };

  // Simplified HTML to Markdown conversion
  const htmlToMarkdown = (html: string): string => {
    // This is a basic conversion - you might want to use a library like turndown.js
    let markdown = html;
    
    // Convert headings
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    
    // Convert paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    
    // Convert strong/bold
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    
    // Convert emphasis/italic
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    
    // Convert links
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    
    // Remove other HTML tags
    markdown = markdown.replace(/<[^>]*>/g, '');
    
    // Clean up extra whitespace
    markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return markdown.trim();
  };

  const insertText = (text: string) => {
    const newContent = editableContent + '\n\n' + text;
    setEditableContent(newContent);
    onContentChange(newContent);
  };

  const toolbarItems = [
    { icon: Type, label: 'Heading', action: () => insertText('## New Heading') },
    { icon: List, label: 'List', action: () => insertText('- List item\n- Another item') },
    { icon: Quote, label: 'Quote', action: () => insertText('> This is a quote') },
    { icon: Code, label: 'Code', action: () => insertText('```\ncode here\n```') },
    { icon: Image, label: 'Image', action: () => insertText('![Alt text](image-url)') },
  ];

  return (
    <div className="h-full flex flex-col bg-background">
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
              onBlur={handleContentEdit}
              className="min-h-[400px] outline-none prose prose-slate max-w-none dark:prose-invert focus:ring-2 focus:ring-primary/20 rounded-lg p-4 border border-dashed border-muted-foreground/30"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              <HashnodeMarkdownRenderer content={editableContent} />
            </div>
          ) : (
            <div className="prose prose-slate max-w-none dark:prose-invert">
              <HashnodeMarkdownRenderer content={content} />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
