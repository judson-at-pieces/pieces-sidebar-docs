import React, { useState } from 'react';
import CodeBlock from './CodeBlock';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Constants
const SECTION_DELIMITER = '***';
const FRONTMATTER_PATTERN = '---';
const TITLE_PATTERN = 'title:';
const IMAGE_PATTERN = '<Image';
const CARDGROUP_PATTERN = '<CardGroup';
const CALLOUT_PATTERN = '<Callout';
const ACCORDION_PATTERN = '<Accordion';
const ACCORDIONGROUP_PATTERN = '<AccordionGroup';
const TABS_PATTERN = '<Tabs';
const BUTTON_PATTERN = '<Button';
const STEPS_PATTERN = '<Steps';
const CARD_PATTERN = '<Card';

// Types
type SectionType = 'frontmatter' | 'image' | 'cardgroup' | 'callout' | 'accordion' | 'accordiongroup' | 'tabs' | 'button' | 'steps' | 'card' | 'markdown' | 'mixed';
type ListType = 'ordered' | 'unordered' | null;

interface ParsedSection {
  type: SectionType;
  content: string;
  index: number;
}

interface MarkdownRendererProps {
  content: string;
}

interface CardData {
  title: string;
  image?: string;
  content: string;
  href?: string; // Add href property
}

// Utility functions
const parseSections = (text: string): ParsedSection[] => {
  console.log('🔍 parseSections: Input text length:', text.length);
  
  // If no section delimiters found, treat the entire content as one section
  if (!text.includes(SECTION_DELIMITER)) {
    console.log('🔍 No section delimiters found, treating as single section');
    return [{ type: 'mixed', content: text.trim(), index: 0 }];
  }
  
  // Smart splitting that respects component boundaries
  const sections = smartSplitSections(text);
  console.log('🔍 parseSections: Split into', sections.length, 'sections');
  
  return sections.map((section, index) => {
    console.log(`🔍 Parsing section ${index}:`, section.substring(0, 100));
    
    if (section.startsWith(FRONTMATTER_PATTERN) && section.includes(TITLE_PATTERN)) {
      console.log('📋 Found frontmatter section');
      return { type: 'frontmatter', content: section, index };
    }
    
    // Check for special components
    const hasImage = section.includes(IMAGE_PATTERN);
    const hasCardGroup = section.includes(CARDGROUP_PATTERN);
    const hasSteps = section.includes(STEPS_PATTERN);
    const hasCallout = section.includes(CALLOUT_PATTERN);
    const hasAccordion = section.includes(ACCORDION_PATTERN);
    const hasAccordionGroup = section.includes(ACCORDIONGROUP_PATTERN);
    const hasTabs = section.includes(TABS_PATTERN);
    const hasButton = section.includes(BUTTON_PATTERN);
    const hasCard = section.includes(CARD_PATTERN) && !hasCardGroup;
    
    // Count special components
    const specialComponentCount = [hasImage, hasCardGroup, hasSteps, hasCallout, hasAccordion, hasAccordionGroup, hasTabs, hasButton, hasCard].filter(Boolean).length;
    
    // If multiple special components or has markdown content with special components, treat as mixed
    const markdownLines = section.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && 
             !trimmed.startsWith('<') && 
             !trimmed.startsWith('---') &&
             trimmed !== '***';
    });
    
    if (specialComponentCount > 1 || (specialComponentCount > 0 && markdownLines.length > 0)) {
      console.log('🔀 Found mixed content section!');
      return { type: 'mixed', content: section, index };
    }
    
    // Single special component types
    if (section.startsWith(IMAGE_PATTERN)) {
      console.log('🖼️ Found image section');
      return { type: 'image', content: section, index };
    }
    if (hasCardGroup) {
      console.log('🃏 Found CardGroup section!');
      return { type: 'cardgroup', content: section, index };
    }
    if (hasSteps) {
      console.log('👣 Found Steps section!');
      return { type: 'steps', content: section, index };
    }
    if (section.startsWith(ACCORDIONGROUP_PATTERN)) {
      console.log('📁 Found AccordionGroup section');
      return { type: 'accordiongroup', content: section, index };
    }
    if (section.startsWith(ACCORDION_PATTERN)) {
      console.log('📂 Found Accordion section');
      return { type: 'accordion', content: section, index };
    }
    if (section.startsWith(TABS_PATTERN)) {
      console.log('📑 Found Tabs section');
      return { type: 'tabs', content: section, index };
    }
    if (section.startsWith(BUTTON_PATTERN)) {
      console.log('🔘 Found Button section');
      return { type: 'button', content: section, index };
    }
    if (hasCard) {
      console.log('🎯 Found standalone Card section');
      return { type: 'card', content: section, index };
    }
    if (section.startsWith(CALLOUT_PATTERN)) {
      console.log('💬 Found Callout section');
      return { type: 'callout', content: section, index };
    }
    
    console.log('📝 Found markdown section');
    return { type: 'markdown', content: section, index };
  });
};

// Smart section splitting that respects component boundaries
const smartSplitSections = (text: string): string[] => {
  const sections: string[] = [];
  let currentSection = '';
  let insideComponent = false;
  let componentDepth = 0;
  let componentName = '';
  
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check if we're entering a component
    if (!insideComponent && (
      trimmedLine.includes('<CardGroup') ||
      trimmedLine.includes('<Steps') ||
      trimmedLine.includes('<Callout') ||
      trimmedLine.includes('<Accordion')
    )) {
      insideComponent = true;
      componentDepth = 1;
      if (trimmedLine.includes('<CardGroup')) componentName = 'CardGroup';
      else if (trimmedLine.includes('<Steps')) componentName = 'Steps';
      else if (trimmedLine.includes('<Callout')) componentName = 'Callout';
      else if (trimmedLine.includes('<Accordion')) componentName = 'Accordion';
      
      currentSection += line + '\n';
      continue;
    }
    
    // If inside a component, track depth
    if (insideComponent) {
      // Check for opening tags
      if (trimmedLine.includes(`<${componentName}`) && !trimmedLine.includes('/>')) {
        componentDepth++;
      }
      // Check for closing tags
      if (trimmedLine.includes(`</${componentName}>`)) {
        componentDepth--;
        if (componentDepth === 0) {
          insideComponent = false;
          componentName = '';
        }
      }
      
      currentSection += line + '\n';
      continue;
    }
    
    // If we encounter a section delimiter and we're not inside a component
    if (trimmedLine === '***' && !insideComponent) {
      if (currentSection.trim()) {
        sections.push(currentSection.trim());
        currentSection = '';
      }
      continue;
    }
    
    currentSection += line + '\n';
  }
  
  // Add the final section
  if (currentSection.trim()) {
    sections.push(currentSection.trim());
  }
  
  return sections.filter(Boolean);
};

const extractImageData = (content: string) => {
  const srcMatch = content.match(/src="([^"]+)"/);
  const altMatch = content.match(/alt="([^"]*)"/);
  const alignMatch = content.match(/align="([^"]*)"/);
  const fullwidthMatch = content.match(/fullwidth="([^"]*)"/);
  
  return {
    src: srcMatch?.[1] || '',
    alt: altMatch?.[1] || '',
    align: alignMatch?.[1] || 'center',
    fullwidth: fullwidthMatch?.[1] === 'true'
  };
};

const extractCalloutData = (content: string) => {
  const typeMatch = content.match(/type="([^"]*)"/);
  const contentMatch = content.match(/<Callout[^>]*>([\s\S]*?)<\/Callout>/);
  
  return {
    type: typeMatch?.[1] || 'info',
    content: contentMatch?.[1]?.trim() || ''
  };
};

const parseCard = (content: string): CardData => {
  const titleMatch = content.match(/title="([^"]*)"/);
  const imageMatch = content.match(/image="([^"]*)"/);
  const hrefMatch = content.match(/href="([^"]*)"/);
  const contentMatch = content.match(/<Card[^>]*>([\s\S]*?)<\/Card>/);
  
  return {
    title: titleMatch?.[1] || '',
    image: imageMatch?.[1],
    content: contentMatch?.[1]?.trim() || '',
    href: hrefMatch?.[1] // Extract href from card
  };
};

interface CardGroupData {
  cols?: number;
  cards: CardData[];
}

const parseCardGroup = (content: string): CardGroupData => {
  console.log('🃏 Parsing CardGroup content:', content.substring(0, 200));
  
  const colsMatch = content.match(/<CardGroup[^>]*cols=\{?(\d+)\}?/);
  const cols = colsMatch ? parseInt(colsMatch[1]) : 2;
  
  console.log('🃏 Detected cols:', cols);
  
  const cardRegex = /<Card\s+([^>]*)>([\s\S]*?)<\/Card>/g;
  const cards: CardData[] = [];
  
  let match: RegExpExecArray | null;
  while ((match = cardRegex.exec(content)) !== null) {
    const attributes = match[1];
    const innerContent = match[2].trim();
    
    const titleMatch = attributes.match(/title="([^"]*)"/);
    const title = titleMatch ? titleMatch[1] : '';
    
    const imageMatch = attributes.match(/image="([^"]*)"/);
    const image = imageMatch ? imageMatch[1] : undefined;
    
    const hrefMatch = attributes.match(/href="([^"]*)"/);
    const href = hrefMatch ? hrefMatch[1] : undefined;
    
    console.log('🃏 Parsed card:', { title, image, href, contentLength: innerContent.length });
    
    cards.push({
      title,
      image,
      content: innerContent,
      href // Include href in card data
    });
  }
  
  console.log('🃏 Total cards parsed:', cards.length);
  
  return { cols, cards };
};

interface AccordionData {
  title: string;
  content: string;
}

const parseAccordion = (content: string): AccordionData => {
  const titleMatch = content.match(/title="([^"]*)"/);
  const contentMatch = content.match(/<Accordion[^>]*>([\s\S]*?)<\/Accordion>/);
  
  return {
    title: titleMatch?.[1] || '',
    content: contentMatch?.[1]?.trim() || ''
  };
};

const parseAccordionGroup = (content: string): AccordionData[] => {
  const accordionRegex = /<Accordion\s+([^>]*)>([\s\S]*?)<\/Accordion>/g;
  const accordions: AccordionData[] = [];
  
  let match: RegExpExecArray | null;
  while ((match = accordionRegex.exec(content)) !== null) {
    const attributes = match[1];
    const innerContent = match[2].trim();
    
    const titleMatch = attributes.match(/title="([^"]*)"/);
    const title = titleMatch ? titleMatch[1] : '';
    
    accordions.push({
      title,
      content: innerContent
    });
  }
  
  return accordions;
};

interface TabData {
  title: string;
  content: string;
}

const parseTabs = (content: string): TabData[] => {
  const tabRegex = /<TabItem\s+([^>]*)>([\s\S]*?)<\/TabItem>/g;
  const tabs: TabData[] = [];
  
  let match: RegExpExecArray | null;
  while ((match = tabRegex.exec(content)) !== null) {
    const attributes = match[1];
    const innerContent = match[2].trim();
    
    const titleMatch = attributes.match(/title="([^"]*)"/);
    const title = titleMatch ? titleMatch[1] : '';
    
    tabs.push({
      title,
      content: innerContent
    });
  }
  
  return tabs;
};

interface ButtonData {
  label: string;
  linkHref: string;
  openLinkInNewTab: boolean;
  align: string;
  lightColor?: string;
  darkColor?: string;
}

const parseButton = (content: string): ButtonData => {
  const labelMatch = content.match(/label="([^"]*)"/);
  const linkHrefMatch = content.match(/linkHref="([^"]*)"/);
  const openLinkInNewTabMatch = content.match(/openLinkInNewTab="([^"]*)"/);
  const alignMatch = content.match(/align="([^"]*)"/);
  const lightColorMatch = content.match(/lightColor="([^"]*)"/);
  const darkColorMatch = content.match(/darkColor="([^"]*)"/);
  
  return {
    label: labelMatch?.[1] || '',
    linkHref: linkHrefMatch?.[1] || '#',
    openLinkInNewTab: openLinkInNewTabMatch?.[1] === 'true',
    align: alignMatch?.[1] || 'left',
    lightColor: lightColorMatch?.[1],
    darkColor: darkColorMatch?.[1]
  };
};

interface StepData {
  title: string;
  content: string;
}

const parseSteps = (content: string): StepData[] => {
  console.log('👣 Parsing Steps content:', content.substring(0, 200));
  
  const stepRegex = /<Step\s+([^>]*)>([\s\S]*?)<\/Step>/g;
  const steps: StepData[] = [];
  
  let match: RegExpExecArray | null;
  while ((match = stepRegex.exec(content)) !== null) {
    const attributes = match[1];
    const innerContent = match[2].trim();
    
    const titleMatch = attributes.match(/title="([^"]*)"/);
    const title = titleMatch ? titleMatch[1] : '';
    
    console.log('👣 Parsed step:', { title, contentLength: innerContent.length });
    
    steps.push({
      title,
      content: innerContent
    });
  }
  
  console.log('👣 Total steps parsed:', steps.length);
  
  return steps;
};

const processInlineMarkdown = (text: string): React.ReactNode => {
  console.log('🔄 processInlineMarkdown: Processing text:', text);
  
  // Handle code blocks with language support
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      parts.push(processSimpleMarkdown(beforeText));
    }

    const language = match[1] || 'text';
    const code = match[2].trim();
    
    // Add syntax highlighted code block using CodeBlock component
    parts.push(
      <CodeBlock key={match.index} language={language}>
        {code}
      </CodeBlock>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(processSimpleMarkdown(text.slice(lastIndex)));
  }

  return parts.length > 0 ? <>{parts}</> : processSimpleMarkdown(text);
};

const processSimpleMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Handle inline code
  text = text.replace(/`([^`]+)`/g, '<code class="hn-inline-code bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>');
  
  // Handle bold with **
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Handle italic with *
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Handle links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="hn-link text-primary underline hover:no-underline">$1</a>');
  
  return <span dangerouslySetInnerHTML={{ __html: text }} />;
};

// Components
const ImageSection: React.FC<{ src: string; alt: string; align: string; fullwidth: boolean }> = ({ src, alt, align, fullwidth }) => (
  <div className={`my-6 ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}>
    <img 
      src={src} 
      alt={alt} 
      className={`rounded-lg shadow-md ${fullwidth ? 'w-full' : 'max-w-full'} ${align === 'center' ? 'mx-auto' : ''}`}
    />
  </div>
);

const CalloutSection: React.FC<{ type: string; content: string }> = ({ type, content }) => {
  const getCalloutStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200';
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200';
      case 'tip':
        return 'border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-200';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200';
    }
  };

  return (
    <div className={`border-l-4 p-4 my-4 rounded-r-lg ${getCalloutStyles(type)}`}>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {processInlineMarkdown(content)}
      </div>
    </div>
  );
};

const CardSection: React.FC<{ card: CardData & { href?: string } }> = ({ card }) => {
  console.log('🎯 CardSection rendering card:', { title: card.title, href: card.href, hasHref: !!card.href });
  
  const cardContent = (
    <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow bg-card">
      {card.image && (
        <div className="mb-4">
          <img src={card.image} alt={card.title} className="w-full h-48 object-cover rounded-md" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {processInlineMarkdown(card.content)}
      </div>
    </div>
  );

  // Make card clickable if it has an href
  if (card.href) {
    console.log('🎯 Making CardSection clickable with href:', card.href);
    return (
      <a 
        href={card.href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block no-underline hover:no-underline cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg"
        style={{ 
          textDecoration: 'none !important',
          color: 'inherit !important' 
        }}
        onClick={(e) => {
          console.log('🎯 CardSection clicked! Opening:', card.href);
          window.open(card.href, '_blank', 'noopener,noreferrer');
          e.preventDefault();
        }}
      >
        {cardContent}
      </a>
    );
  }

  console.log('🎯 CardSection non-clickable');
  return cardContent;
};

const CardGroupSection: React.FC<{ cols: number; cards: CardData[] }> = ({ cols = 2, cards }) => (
  <div className={`grid gap-6 my-6 ${cols === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
    {cards.map((card, index) => (
      <CardSection key={index} card={card} />
    ))}
  </div>
);

const AccordionSection: React.FC<AccordionData> = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg my-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left font-medium hover:bg-muted/50 transition-colors flex items-center justify-between"
      >
        <span>{title}</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="pt-3 prose prose-sm dark:prose-invert max-w-none">
            {processInlineMarkdown(content)}
          </div>
        </div>
      )}
    </div>
  );
};

const AccordionGroupSection: React.FC<{ accordions: AccordionData[] }> = ({ accordions }) => (
  <div className="space-y-2 my-6">
    {accordions.map((accordion, index) => (
      <AccordionSection key={index} {...accordion} />
    ))}
  </div>
);

const TabsSection: React.FC<{ tabs: TabData[] }> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="my-6">
      <div className="border-b border-border">
        <div className="flex space-x-8">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === index
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>
      </div>
      <div className="pt-4">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {processInlineMarkdown(tabs[activeTab]?.content || '')}
        </div>
      </div>
    </div>
  );
};

const ButtonSection: React.FC<ButtonData> = ({ label, linkHref, openLinkInNewTab, align, lightColor, darkColor }) => {
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  
  return (
    <div className={`my-4 ${alignClass}`}>
      <a
        href={linkHref}
        target={openLinkInNewTab ? '_blank' : '_self'}
        rel={openLinkInNewTab ? 'noopener noreferrer' : undefined}
        className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
        style={{
          backgroundColor: lightColor,
          color: darkColor
        }}
      >
        {label}
      </a>
    </div>
  );
};

const StepsSection: React.FC<{ steps: StepData[] }> = ({ steps }) => {
  console.log('👣 StepsSection rendering:', { stepCount: steps.length });
  
  return (
    <div className="my-6 [&>.step:last-of-type]:mb-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        
        return (
          <div key={index} className="flex gap-4 step mb-5">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 text-xs font-semibold border rounded-md flex items-center justify-center border-slate-100 bg-slate-50 dark:bg-slate-900 dark:border-slate-800/40 text-slate-700 dark:text-slate-200">
                {index + 1}
              </div>
              {!isLast && (
                <div className="h-[20px] w-[1px] bg-slate-200 dark:bg-slate-800/80"></div>
              )}
            </div>
            <div className="flex-1 w-60">
              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-base text-slate-700 dark:text-slate-200 m-0">
                  {step.title}
                </h3>
                <div className="text-base text-slate-600 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none">
                  {processInlineMarkdown(step.content)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Basic markdown renderer with enhanced code block support
const MarkdownSection: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  // First check for code blocks and handle them specially
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let elementIndex = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add markdown content before code block
    if (match.index > lastIndex) {
      const markdownContent = content.slice(lastIndex, match.index).trim();
      if (markdownContent) {
        parts.push(
          <div key={`markdown-${elementIndex}`}>
            {renderBasicMarkdown(markdownContent)}
          </div>
        );
        elementIndex++;
      }
    }

    const language = match[1] || 'text';
    const code = match[2].trim();
    
    // Add syntax highlighted code block using CodeBlock component
    parts.push(
      <CodeBlock key={`code-${elementIndex}`} language={language}>
        {code}
      </CodeBlock>
    );
    elementIndex++;

    lastIndex = match.index + match[0].length;
  }

  // Add remaining markdown content
  if (lastIndex < content.length) {
    const remainingContent = content.slice(lastIndex).trim();
    if (remainingContent) {
      parts.push(
        <div key={`markdown-final`}>
          {renderBasicMarkdown(remainingContent)}
        </div>
      );
    }
  }

  return parts.length > 0 ? <>{parts}</> : renderBasicMarkdown(content);
};

const renderBasicMarkdown = (content: string): React.ReactNode => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentListItems: string[] = [];
  let currentListType: ListType = null;

  const flushList = () => {
    if (currentListItems.length > 0) {
      const ListComponent = currentListType === 'ordered' ? 'ol' : 'ul';
      elements.push(
        React.createElement(
          ListComponent,
          { key: elements.length, className: 'my-2 ml-6 list-disc space-y-1' },
          currentListItems.map((item, idx) => 
            React.createElement('li', { key: idx }, item.replace(/^[*\-]\s*/, '').replace(/^\d+\.\s*/, ''))
          )
        )
      );
      currentListItems = [];
      currentListType = null;
    }
  };

  lines.forEach((line, index) => {
    line = line.trim();
    
    if (!line) {
      flushList();
      return;
    }

    // Handle lists
    if (line.match(/^[*\-]\s+/)) {
      if (currentListType !== 'unordered') {
        flushList();
        currentListType = 'unordered';
      }
      currentListItems.push(line);
      return;
    }
    
    if (line.match(/^\d+\.\s+/)) {
      if (currentListType !== 'ordered') {
        flushList();
        currentListType = 'ordered';
      }
      currentListItems.push(line);
      return;
    }

    flushList();

    // Handle headers
    if (line.startsWith('### ')) {
      elements.push(React.createElement('h3', { key: index, className: 'text-lg font-semibold mt-4 mb-2' }, line.slice(4)));
    } else if (line.startsWith('## ')) {
      elements.push(React.createElement('h2', { key: index, className: 'text-xl font-semibold mt-6 mb-3' }, line.slice(3)));
    } else if (line.startsWith('# ')) {
      elements.push(React.createElement('h1', { key: index, className: 'text-2xl font-bold mt-8 mb-4' }, line.slice(2)));
    } else {
      // Regular paragraph
      elements.push(React.createElement('p', { key: index, className: 'mb-3 leading-relaxed' }, processSimpleMarkdown(line)));
    }
  });

  flushList();
  return <>{elements}</>;
};

// Parse mixed content that contains both special elements and markdown
const MixedContentSection: React.FC<{ content: string }> = ({ content }) => {
  console.log('🔀 MixedContentSection: Processing content with length:', content.length);
  
  const elements: React.ReactNode[] = [];
  
  // Find all special elements with their positions
  const cardGroupRegex = /<CardGroup[^>]*>[\s\S]*?<\/CardGroup>/g;
  const stepsRegex = /<Steps[^>]*>[\s\S]*?<\/Steps>/g;
  const imageRegex = /<Image[^>]*\/>/g;
  const calloutRegex = /<Callout[^>]*>[\s\S]*?<\/Callout>/g;
  const standaloneCardRegex = /<Card[^>]*>[\s\S]*?<\/Card>/g;
  
  const allMatches: Array<{ match: RegExpMatchArray; type: string }> = [];
  
  // Find CardGroups first
  let match;
  while ((match = cardGroupRegex.exec(content)) !== null) {
    allMatches.push({ match, type: 'cardgroup' });
  }
  
  // Find Steps
  cardGroupRegex.lastIndex = 0;
  while ((match = stepsRegex.exec(content)) !== null) {
    allMatches.push({ match, type: 'steps' });
  }
  
  // Find Callouts
  stepsRegex.lastIndex = 0;
  while ((match = calloutRegex.exec(content)) !== null) {
    allMatches.push({ match, type: 'callout' });
  }
  
  // Find standalone Cards (not inside CardGroups)
  calloutRegex.lastIndex = 0;
  const cardGroupMatches = allMatches.filter(m => m.type === 'cardgroup');
  while ((match = standaloneCardRegex.exec(content)) !== null) {
    // Check if this card is inside a CardGroup
    const isInCardGroup = cardGroupMatches.some(cgMatch => {
      const cgStart = cgMatch.match.index!;
      const cgEnd = cgStart + cgMatch.match[0].length;
      return match.index! >= cgStart && match.index! < cgEnd;
    });
    
    if (!isInCardGroup) {
      allMatches.push({ match, type: 'card' });
    }
  }
  
  // Find Images (but exclude those inside Steps, CardGroups, or other components)
  standaloneCardRegex.lastIndex = 0;
  const stepsMatches = allMatches.filter(m => m.type === 'steps');
  while ((match = imageRegex.exec(content)) !== null) {
    // Check if this image is inside any special component
    const isInsideComponent = allMatches.some(componentMatch => {
      const componentStart = componentMatch.match.index!;
      const componentEnd = componentStart + componentMatch.match[0].length;
      return match.index! >= componentStart && match.index! < componentEnd;
    });
    
    if (!isInsideComponent) {
      console.log('🖼️ Found standalone image at position:', match.index);
      allMatches.push({ match, type: 'image' });
    } else {
      console.log('🖼️ Skipping image inside component at position:', match.index);
    }
  }
  
  // Sort by position
  allMatches.sort((a, b) => (a.match.index || 0) - (b.match.index || 0));
  
  console.log('🔀 Found special elements:', allMatches.length, allMatches.map(m => ({ type: m.type, position: m.match.index })));
  
  let lastIndex = 0;
  let elementIndex = 0;
  
  for (const { match, type } of allMatches) {
    const elementStart = match.index!;
    const elementEnd = elementStart + match[0].length;
    
    // Add markdown content before this element
    if (elementStart > lastIndex) {
      const markdownContent = content.slice(lastIndex, elementStart).trim();
      if (markdownContent) {
        console.log('🔀 Adding markdown content before', type);
        elements.push(
          <div key={`markdown-${elementIndex}`} className="hn-markdown-section">
            <MarkdownSection content={markdownContent} />
          </div>
        );
        elementIndex++;
      }
    }
    
    // Add the special element
    console.log('🔀 Adding special element:', type);
    switch (type) {
      case 'cardgroup': {
        const { cols, cards } = parseCardGroup(match[0]);
        elements.push(
          <CardGroupSection key={`cardgroup-${elementIndex}`} cols={cols || 2} cards={cards} />
        );
        break;
      }
      case 'steps': {
        const steps = parseSteps(match[0]);
        elements.push(
          <StepsSection key={`steps-${elementIndex}`} steps={steps} />
        );
        break;
      }
      case 'image': {
        const imageData = extractImageData(match[0]);
        elements.push(
          <ImageSection key={`image-${elementIndex}`} {...imageData} />
        );
        break;
      }
      case 'callout': {
        const calloutData = extractCalloutData(match[0]);
        elements.push(
          <CalloutSection key={`callout-${elementIndex}`} type={calloutData.type} content={calloutData.content} />
        );
        break;
      }
      case 'card': {
        const cardData = parseCard(match[0]);
        elements.push(
          <CardSection key={`card-${elementIndex}`} card={cardData} />
        );
        break;
      }
    }
    elementIndex++;
    lastIndex = elementEnd;
  }
  
  // Add any remaining markdown content
  if (lastIndex < content.length) {
    const markdownContent = content.slice(lastIndex).trim();
    if (markdownContent) {
      console.log('🔀 Adding final markdown content');
      elements.push(
        <div key={`markdown-final`} className="hn-markdown-section">
          <MarkdownSection content={markdownContent} />
        </div>
      );
    }
  }
  
  console.log('🔀 MixedContentSection: Returning', elements.length, 'elements');
  return <>{elements}</>;
};

// Main component
const HashnodeMarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  console.log('🚀 HashnodeMarkdownRenderer processing content length:', content.length);
  
  const sections = parseSections(content);
  console.log('🚀 Parsed sections:', sections.map(s => ({ type: s.type, index: s.index })));
  
  const renderSection = (section: ParsedSection): React.ReactNode => {
    console.log('🔄 Rendering section:', section.type, 'at index:', section.index);
    
    let result: React.ReactNode = null;
    
    switch (section.type) {
      case 'frontmatter':
        console.log('📋 Skipping frontmatter section');
        result = null;
        break;
        
      case 'image': {
        const imageData = extractImageData(section.content);
        result = <ImageSection key={section.index} {...imageData} />;
        break;
      }
      
      case 'callout': {
        const calloutData = extractCalloutData(section.content);
        result = <CalloutSection key={section.index} type={calloutData.type} content={calloutData.content} />;
        break;
      }
      
      case 'card': {
        const cardData = parseCard(section.content);
        result = <CardSection key={section.index} card={cardData} />;
        break;
      }
      
      case 'cardgroup': {
        const { cols, cards } = parseCardGroup(section.content);
        console.log('🃏 Rendering CardGroupSection with data:', { cols, cardCount: cards.length });
        result = <CardGroupSection key={section.index} cols={cols || 2} cards={cards} />;
        break;
      }
      
      case 'accordion': {
        const accordionData = parseAccordion(section.content);
        result = <AccordionSection key={section.index} {...accordionData} />;
        break;
      }
      
      case 'accordiongroup': {
        const accordionGroupData = parseAccordionGroup(section.content);
        result = <AccordionGroupSection key={section.index} accordions={accordionGroupData} />;
        break;
      }
      
      case 'tabs': {
        const tabsData = parseTabs(section.content);
        result = <TabsSection key={section.index} tabs={tabsData} />;
        break;
      }
      
      case 'button': {
        const buttonData = parseButton(section.content);
        result = <ButtonSection key={section.index} {...buttonData} />;
        break;
      }
      
      case 'steps': {
        const steps = parseSteps(section.content);
        console.log('👣 Rendering StepsSection with data:', { count: steps.length });
        result = <StepsSection key={section.index} steps={steps} />;
        break;
      }
      
      case 'mixed': {
        console.log('🔀 Rendering MixedContentSection');
        result = <MixedContentSection key={section.index} content={section.content} />;
        break;
      }
        
      case 'markdown':
        console.log('📝 Rendering markdown section with content:', section.content.substring(0, 100));
        result = (
          <div key={section.index} className="hn-markdown-section">
            <MarkdownSection content={section.content} />
          </div>
        );
        break;
        
      default:
        console.log('⚠️ Unhandled section type:', section.type);
        result = (
          <div key={section.index} className="hn-markdown-section">
            <MarkdownSection content={section.content} />
          </div>
        );
        break;
    }
    
    console.log('🔄 Rendered section result:', result ? 'Component created' : 'null');
    return result;
  };

  const renderedSections = sections.map(renderSection).filter(Boolean);
  console.log('🚀 HashnodeMarkdownRenderer: Returning', renderedSections.length, 'rendered sections');

  return (
    <div className="hn-markdown-renderer">
      {renderedSections}
    </div>
  );
};

export default HashnodeMarkdownRenderer;
