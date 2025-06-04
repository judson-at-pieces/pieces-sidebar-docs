
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface CodeEditorProps {
  content: string;
  onChange: (content: string) => void;
  language?: string;
}

export function CodeEditor({ content, onChange, language = 'markdown' }: CodeEditorProps) {
  return (
    <div className="h-full flex flex-col bg-muted/10">
      <div className="flex items-center justify-between p-2 border-b bg-background">
        <span className="text-sm font-medium">Code Editor ({language})</span>
      </div>
      <div className="flex-1 p-4">
        <Textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="h-full w-full font-mono text-sm resize-none border-none focus-visible:ring-0 bg-transparent"
          placeholder="Start typing your markdown content..."
        />
      </div>
    </div>
  );
}
