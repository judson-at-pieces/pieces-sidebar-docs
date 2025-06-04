import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  children: string;
  language?: string;
  showCopyButton?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  language = 'bash',
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

  return (
    <pre className="relative mb-6 overflow-x-auto rounded-lg bg-slate-100 dark:bg-slate-800 p-4 text-sm">
      {showCopyButton && (
        <button
          className="absolute right-2 top-2 rounded-full bg-transparent px-2.5 py-1 font-sans text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:ring focus-visible:ring-blue-600 disabled:opacity-50 transition-colors flex items-center gap-1"
          type="button"
          aria-label="Copy Code Button"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check size={14} />
              <span className="text-xs">Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span className="text-xs">Copy</span>
            </>
          )}
        </button>
      )}
      <code className={`hljs language-${language} text-slate-800 dark:text-slate-200`}>
        {children}
      </code>
    </pre>
  );
};

export default CodeBlock;