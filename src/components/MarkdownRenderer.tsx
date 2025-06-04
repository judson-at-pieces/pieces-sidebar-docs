import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Constants
const SECTION_DELIMITER = '***';
const FRONTMATTER_PATTERN = '---';
const TITLE_PATTERN = 'title:';
const IMAGE_PATTERN = '<Image';
const CARDGROUP_PATTERN = '<CardGroup';
const CALLOUT_PATTERN = '<Callout';

// Types
type SectionType = 'frontmatter' | 'image' | 'cardgroup' | 'callout' | 'markdown';
type ListType = 'ordered' | 'unordered' | null;

interface ParsedSection {
  type: SectionType;
  content: string;
  index: number;
}

interface MarkdownRendererProps {
  content: string;
}

// Utility functions
const parseSections = (text: string): ParsedSection[] => {
  const sections = text.split(SECTION_DELIMITER).map(section => section.trim()).filter(Boolean);
  
  return sections.map((section, index) => {
    if (section.startsWith(FRONTMATTER_PATTERN) && section.includes(TITLE_PATTERN)) {
      return { type: 'frontmatter', content: section, index };
    }
    // Check if section is primarily an image tag
    if (section.startsWith(IMAGE_PATTERN)) {
      return { type: 'image', content: section, index };
    }
    // Check if section is primarily a card group
    if (section.startsWith(CARDGROUP_PATTERN)) {
      return { type: 'cardgroup', content: section, index };
    }
    // Check if section is primarily a callout
    if (section.startsWith(CALLOUT_PATTERN)) {
      return { type: 'callout', content: section, index };
    }
    return { type: 'markdown', content: section, index };
  });
};

const extractImageData = (content: string) => {
  const srcMatch = content.match(/src="([^"]+)"/);
  const altMatch = content.match(/alt="([^"]*)"/);
  return {
    src: srcMatch?.[1] || '',
    alt: altMatch?.[1] || ''
  };
};

const extractCalloutContent = (content: string): string => {
  return content
    .replace(/<Callout[^>]*>/, '')
    .replace(/<\/Callout>/, '')
    .trim();
};

// Parse CardGroup and Card elements from content
interface CardData {
  title: string;
  image?: string;
  content: string;
}

interface CardGroupData {
  cols?: number;
  cards: CardData[];
}

const parseCardGroup = (content: string): CardGroupData => {
  // Extract cols attribute
  const colsMatch = content.match(/<CardGroup[^>]*cols={(\d+)}/);
  const cols = colsMatch ? parseInt(colsMatch[1]) : 2;
  
  // Extract all Card elements - be more specific to avoid nested matches
  const cardRegex = /<Card\s+([^>]*)>([\s\S]*?)<\/Card>/g;
  const cards: CardData[] = [];
  
  let match: RegExpExecArray | null;
  while ((match = cardRegex.exec(content)) !== null) {
    const attributes = match[1];
    const innerContent = match[2].trim();
    
    // Extract title attribute
    const titleMatch = attributes.match(/title="([^"]*)"/);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Extract image attribute
    const imageMatch = attributes.match(/image="([^"]*)"/);
    const image = imageMatch ? imageMatch[1] : undefined;
    
    cards.push({
      title,
      image,
      content: innerContent
    });
  }
  
  
  return { cols, cards };
};

const processInlineMarkdown = (text: string): React.ReactNode => {
  // Handle bold with **
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  
  // Handle mark tags and convert to highlighted text
  text = text.replace(/<mark>(.*?)<\/mark>/g, '<span class="bg-yellow-200 px-1 py-0.5 rounded text-sm font-medium">$1</span>');
  
  // Handle italic with *
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>');
  
  // Handle links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">$1</a>');
  
  return <span dangerouslySetInnerHTML={{ __html: text }} />;
};

const processInlineCallouts = (content: string): string => {
  // Replace inline callouts with a placeholder that will be rendered as a callout component
  const calloutRegex = /<Callout[^>]*>([\s\S]*?)<\/Callout>/g;
  
  return content.replace(calloutRegex, (_match, calloutContent) => {
    // Create a unique marker for this callout
    return `\n[CALLOUT_START]\n${calloutContent.trim()}\n[CALLOUT_END]\n`;
  });
};

// Sub-components
const ImageSection: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <div className="my-8 text-center">
    <img 
      src={src} 
      alt={alt} 
      className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
    />
  </div>
);

const CardGroupSection: React.FC<{ content: string }> = ({ content }) => {
  const { cols, cards } = parseCardGroup(content);
  
  const gridCols = cols === 3 ? 'md:grid-cols-3' : cols === 4 ? 'md:grid-cols-4' : 'md:grid-cols-2';
  
  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-6 my-8`}>
      {cards.map((card, index) => (
        <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              {card.image && (
                <img 
                  src={card.image} 
                  alt="" 
                  className="w-8 h-8"
                />
              )}
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600 text-sm leading-relaxed">
              {processInlineMarkdown(card.content)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const CalloutSection: React.FC<{ content: string }> = ({ content }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
    <div className="flex items-start">
      <div className="flex-shrink-0 mr-3">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">i</span>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-blue-800 text-sm leading-relaxed">
          {processInlineMarkdown(content)}
        </p>
      </div>
    </div>
  </div>
);

const MarkdownSection: React.FC<{ content: string }> = ({ content }) => {
  // First, handle any inline callouts
  const processedContent = processInlineCallouts(content);
  
  const lines = processedContent.split('\n').filter(line => line.trim());
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let listType: ListType = null;

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ordered') {
        elements.push(
          <ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-2 my-4 ml-4">
            {currentList}
          </ol>
        );
      } else if (listType === 'unordered') {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-2 my-4 ml-4">
            {currentList}
          </ul>
        );
      }
      currentList = [];
      listType = null;
    }
  };
  
  let isInCallout = false;
  let calloutContent: string[] = [];
  
  lines.forEach((line, index) => {
    line = line.trim();
    
    // Skip empty lines and frontmatter markers
    if (!line || line.startsWith('---')) return;
    
    // Handle callout markers
    if (line === '[CALLOUT_START]') {
      flushList();
      isInCallout = true;
      calloutContent = [];
      return;
    }
    
    if (line === '[CALLOUT_END]') {
      isInCallout = false;
      elements.push(
        <div key={`callout-${index}`} className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">i</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-blue-800 text-sm leading-relaxed">
                {processInlineMarkdown(calloutContent.join(' '))}
              </p>
            </div>
          </div>
        </div>
      );
      return;
    }
    
    if (isInCallout) {
      calloutContent.push(line);
      return;
    }
    
    // Headers
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${index}`} className="text-3xl font-bold text-gray-900 mt-12 mb-6 border-b border-gray-200 pb-2">
          {line.slice(3)}
        </h2>
      );
      return;
    }
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${index}`} className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
          {line.slice(4)}
        </h3>
      );
      return;
    }
    
    // Ordered lists
    if (line.match(/^\d+\./)) {
      if (listType !== 'ordered') {
        flushList();
        listType = 'ordered';
      }
      currentList.push(
        <li key={`li-${index}`} className="text-gray-700 leading-relaxed">
          {processInlineMarkdown(line.replace(/^\d+\./, '').trim())}
        </li>
      );
      return;
    }
    
    // Unordered lists
    if (line.startsWith('* ')) {
      if (listType !== 'unordered') {
        flushList();
        listType = 'unordered';
      }
      currentList.push(
        <li key={`li-${index}`} className="text-gray-700 leading-relaxed">
          {processInlineMarkdown(line.slice(2))}
        </li>
      );
      return;
    }
    
    // Blockquotes
    if (line.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={`quote-${index}`} className="border-l-4 border-gray-300 pl-6 italic text-gray-600 my-6 bg-gray-50 py-4 rounded-r-lg">
          {line.slice(2)}
        </blockquote>
      );
      return;
    }
    
    // Regular paragraphs
    flushList();
    elements.push(
      <p key={`p-${index}`} className="text-gray-700 leading-relaxed mb-4 text-base">
        {processInlineMarkdown(line)}
      </p>
    );
  });

  // Flush any remaining list items
  flushList();
  
  return <>{elements}</>;
};

// Main component
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const sections = parseSections(content);
  
  const renderSection = (section: ParsedSection): React.ReactNode => {
    switch (section.type) {
      case 'frontmatter':
        return null;
        
      case 'image': {
        const { src, alt } = extractImageData(section.content);
        return src ? <ImageSection key={section.index} src={src} alt={alt} /> : null;
      }
      
      case 'cardgroup':
        return <CardGroupSection key={section.index} content={section.content} />;
        
      case 'callout': {
        const calloutContent = extractCalloutContent(section.content);
        return <CalloutSection key={section.index} content={calloutContent} />;
      }
      
      case 'markdown':
        return (
          <div key={section.index} className="my-6">
            <MarkdownSection content={section.content} />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <div className="prose prose-lg max-w-none">
        {sections.map(renderSection)}
      </div>
    </div>
  );
};

export default MarkdownRenderer;