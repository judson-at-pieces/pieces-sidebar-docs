
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  language?: string;
}

export function CodeBlock({ children, className, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const extractCodeContent = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractCodeContent).join('');
    if (React.isValidElement(node)) {
      if (node.props && typeof node.props === 'object' && 'children' in node.props) {
        return extractCodeContent(node.props.children);
      }
    }
    return '';
  };

  const handleCopy = async () => {
    const codeContent = extractCodeContent(children);
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative group my-4">
      <pre className={`rounded-lg border bg-muted/50 dark:bg-muted/20 p-4 text-sm overflow-x-auto max-w-full font-mono leading-relaxed pb-6 ${className || ''}`}>
        <code>{children}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 bg-background/80 hover:bg-background border border-border"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
