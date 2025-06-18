
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  language?: string;
}

// Map common language variations to syntax highlighter language names
const languageMap: Record<string, string> = {
  'c': 'c',
  'C': 'c',
  'cpp': 'cpp',
  'c++': 'cpp',
  'C++': 'cpp',
  'csharp': 'csharp',
  'c#': 'csharp',
  'C#': 'csharp',
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'sh': 'bash',
  'shell': 'bash',
  'yml': 'yaml',
  'json': 'json',
  'xml': 'xml',
  'html': 'markup',
  'css': 'css',
  'sql': 'sql',
  'php': 'php',
  'java': 'java',
  'kotlin': 'kotlin',
  'swift': 'swift',
  'go': 'go',
  'rust': 'rust',
  'dart': 'dart',
  'scala': 'scala',
  'r': 'r',
  'matlab': 'matlab',
  'powershell': 'powershell',
  'batch': 'batch',
  'dockerfile': 'docker',
  'makefile': 'makefile',
  'ini': 'ini',
  'toml': 'toml',
  'markdown': 'markdown',
  'md': 'markdown'
};

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

  // Extract and normalize language
  let detectedLanguage = language || (className ? className.replace(/^language-/, '') : '');
  
  // Normalize language using the mapping
  if (detectedLanguage) {
    detectedLanguage = languageMap[detectedLanguage.toLowerCase()] || detectedLanguage.toLowerCase();
  }

  const codeContent = extractCodeContent(children);

  console.log('🔍 MARKDOWN CodeBlock render:', { 
    className, 
    language, 
    detectedLanguage, 
    codeContent: codeContent.substring(0, 100) + '...',
    hasLanguage: !!detectedLanguage,
    component: 'MARKDOWN CodeBlock (new)'
  });

  // Use syntax highlighting with the normalized language
  return (
    <div className="relative group my-4">
      <SyntaxHighlighter
        language={detectedLanguage || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          paddingTop: '2.5rem',
          paddingRight: '1rem',
          paddingBottom: '1rem',
          paddingLeft: '1rem',
          background: '#282c34'
        }}
        showLineNumbers={codeContent.split('\n').length > 5}
        wrapLines={true}
        wrapLongLines={true}
      >
        {codeContent}
      </SyntaxHighlighter>
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
