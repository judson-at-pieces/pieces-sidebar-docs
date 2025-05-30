
import React from 'react';
import { Callout } from '@/components/markdown/Callout';
import { Card } from '@/components/markdown/Card';
import { CardGroup } from '@/components/markdown/CardGroup';
import { Steps, Step } from '@/components/markdown/Steps';
import { ExpandableImage } from '@/components/markdown/ExpandableImage';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface TSXRendererProps {
  content: string;
}

export function TSXRenderer({ content }: TSXRendererProps) {
  const renderContent = () => {
    try {
      // Remove frontmatter if present
      const cleanContent = content.replace(/^---[\s\S]*?---\s*/, '');
      
      // Check if content contains TSX-like syntax (custom components)
      const hasTSXComponents = /<(Callout|Card|CardGroup|Steps|Step|ExpandableImage)/.test(cleanContent);
      
      if (hasTSXComponents) {
        // Parse and render TSX components
        return renderTSXComponents(cleanContent);
      } else {
        // Fall back to markdown rendering for regular markdown content
        return <MarkdownRenderer content={cleanContent} />;
      }
    } catch (error) {
      console.error('Error rendering content:', error);
      return (
        <div className="text-red-500 p-4 border border-red-300 rounded">
          <h3 className="font-bold mb-2">Rendering Error</h3>
          <p>There was an error rendering the content. Please check your syntax.</p>
          <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
        </div>
      );
    }
  };

  const renderTSXComponents = (cleanContent: string) => {
    const lines = cleanContent.split('\n');
    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim() === '') {
        elements.push(<br key={i} />);
        continue;
      }
      
      // Handle Callout components
      if (line.includes('<Callout')) {
        const typeMatch = line.match(/type="([^"]+)"/);
        const type = typeMatch ? typeMatch[1] as any : 'info';
        const contentMatch = line.match(/>([^<]+)</);
        const calloutContent = contentMatch ? contentMatch[1].trim() : 'Callout content';
        elements.push(<Callout key={i} type={type}>{calloutContent}</Callout>);
        continue;
      }
      
      // Handle Card components
      if (line.includes('<Card')) {
        const titleMatch = line.match(/title="([^"]+)"/);
        const hrefMatch = line.match(/href="([^"]+)"/);
        
        elements.push(
          <Card 
            key={i}
            title={titleMatch ? titleMatch[1] : 'Card Title'}
            href={hrefMatch ? hrefMatch[1] : '#'}
            className="mb-4"
          >
            Card description goes here
          </Card>
        );
        continue;
      }
      
      // Handle Steps components
      if (line.includes('<Steps')) {
        // Look ahead for Step components
        const stepsContent: React.ReactNode[] = [];
        let j = i + 1;
        let stepNumber = 1;
        while (j < lines.length && !lines[j].includes('</Steps>')) {
          const stepLine = lines[j];
          if (stepLine.includes('<Step')) {
            const titleMatch = stepLine.match(/title="([^"]+)"/);
            const contentMatch = stepLine.match(/>([^<]+)</);
            stepsContent.push(
              <Step 
                key={j} 
                number={stepNumber}
                title={titleMatch ? titleMatch[1] : 'Step'}
              >
                {contentMatch ? contentMatch[1].trim() : 'Step content'}
              </Step>
            );
            stepNumber++;
          }
          j++;
        }
        elements.push(
          <Steps key={i} className="mb-6">
            {stepsContent}
          </Steps>
        );
        i = j; // Skip ahead
        continue;
      }
      
      // Handle ExpandableImage
      if (line.includes('<ExpandableImage')) {
        const srcMatch = line.match(/src="([^"]+)"/);
        const altMatch = line.match(/alt="([^"]+)"/);
        elements.push(
          <ExpandableImage 
            key={i}
            src={srcMatch ? srcMatch[1] : '/placeholder.svg'}
            alt={altMatch ? altMatch[1] : 'Image'}
            className="mb-4"
          />
        );
        continue;
      }
      
      // Handle basic HTML elements
      if (line.includes('<h1')) {
        const content = line.replace(/<h1[^>]*>/, '').replace(/<\/h1>/, '').trim();
        elements.push(<h1 key={i} className="text-4xl font-bold mb-6">{content}</h1>);
        continue;
      }
      
      if (line.includes('<h2')) {
        const content = line.replace(/<h2[^>]*>/, '').replace(/<\/h2>/, '').trim();
        elements.push(<h2 key={i} className="text-2xl font-bold mb-4">{content}</h2>);
        continue;
      }
      
      if (line.includes('<h3')) {
        const content = line.replace(/<h3[^>]*>/, '').replace(/<\/h3>/, '').trim();
        elements.push(<h3 key={i} className="text-xl font-semibold mb-3">{content}</h3>);
        continue;
      }
      
      if (line.includes('<p')) {
        const content = line.replace(/<p[^>]*>/, '').replace(/<\/p>/, '').trim();
        elements.push(<p key={i} className="mb-4">{content}</p>);
        continue;
      }
      
      // Handle code blocks
      if (line.includes('<pre')) {
        const codeMatch = cleanContent.match(/<code[^>]*>([\s\S]*?)<\/code>/);
        const codeContent = codeMatch ? codeMatch[1] : 'console.log("Hello World");';
        elements.push(
          <pre key={i} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">
            <code className="text-sm">{codeContent}</code>
          </pre>
        );
        continue;
      }
      
      // Default: render as plain text if no special syntax detected
      if (!line.includes('<') && line.trim()) {
        elements.push(<p key={i} className="mb-2">{line}</p>);
      }
    }
    
    return <div className="tsx-content">{elements}</div>;
  };

  return (
    <div className="tsx-renderer prose prose-gray dark:prose-invert max-w-none">
      {renderContent()}
    </div>
  );
}
