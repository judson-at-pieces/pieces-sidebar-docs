
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { CommandPalette } from './CommandPalette';
import { Code2, Palette } from 'lucide-react';

interface CodeEditorProps {
  content: string;
  onChange: (content: string) => void;
  language?: string;
}

export function CodeEditor({ content, onChange, language = 'markdown' }: CodeEditorProps) {
  const [showCommandPalette, setShowCommandPalette] = React.useState(false);
  const [commandPosition, setCommandPosition] = React.useState({ top: 0, left: 0 });
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check for Ctrl+/ or Cmd+/ for command palette
    if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        const scrollTop = textareaRef.current.scrollTop;
        
        setCommandPosition({
          top: rect.top + 40 - scrollTop,
          left: rect.left + 20
        });
        setShowCommandPalette(true);
      }
    } else if (e.key === 'Escape') {
      setShowCommandPalette(false);
    }
  };

  const handleInsert = (insertContent: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newContent = content.slice(0, start) + insertContent + content.slice(end);
      onChange(newContent);
      
      // Set cursor position after the inserted content
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + insertContent.length, start + insertContent.length);
      }, 0);
    }
    setShowCommandPalette(false);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-muted/20 to-background relative">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <Code2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <span className="text-sm font-medium">Code Editor</span>
              <span className="text-xs text-muted-foreground ml-2">({language})</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
            <Palette className="h-3 w-3" />
            <span>Ctrl+/</span>
          </div>
          <span>for components</span>
        </div>
      </div>

      {/* Enhanced Editor */}
      <div className="flex-1 p-4 relative">
        <div className="h-full relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-full w-full font-mono text-sm resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 leading-relaxed"
            placeholder="Start writing your markdown content...

Press Ctrl+/ to insert components and elements quickly.

You can use:
• Headings: ## Your heading
• Lists: - Item or 1. Item  
• Code: ```language or `inline`
• Links: [text](url)
• Images: ![alt](src)
• Callouts: :::info content :::
• And many more..."
            style={{ 
              background: 'transparent',
              minHeight: '100%'
            }}
          />
          
          {/* Subtle background pattern */}
          <div className="absolute inset-0 -z-10 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }} />
          </div>
        </div>
      </div>

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
