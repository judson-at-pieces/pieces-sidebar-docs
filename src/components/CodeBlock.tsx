
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';

interface CodeBlockProps {
  children: string;
  language?: string;
  showCopyButton?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  language = 'text',
  showCopyButton = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  console.log('🔍 ORIGINAL CodeBlock render:', { 
    language, 
    children: children.substring(0, 100) + '...',
    component: 'ORIGINAL CodeBlock'
  });

  return (
    <div className="relative group my-4">
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          paddingTop: showCopyButton ? '2.5rem' : '1rem',
          paddingRight: '1rem',
          paddingBottom: '1rem',
          paddingLeft: '1rem'
        }}
        showLineNumbers={children.split('\n').length > 5}
      >
        {children}
      </SyntaxHighlighter>
      {showCopyButton && (
        <button
          className="absolute right-2 top-2 rounded-full bg-background/80 px-2.5 py-1 text-xs text-muted-foreground hover:bg-background hover:text-foreground focus-visible:ring focus-visible:ring-primary disabled:opacity-50 transition-colors flex items-center gap-1 border border-border opacity-0 group-hover:opacity-100"
          type="button"
          aria-label="Copy Code Button"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default CodeBlock;
