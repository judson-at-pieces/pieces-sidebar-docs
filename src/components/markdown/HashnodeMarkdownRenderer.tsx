import React, { useState } from 'react';
import CodeBlock from './CodeBlock';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CustomTable } from './CustomTable';

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
}

// Utility functions
const parseSections = (text: string): ParsedSection[] => {
  console.log('🔍 parseSections: Input text length:', text.length);
  
  // If no section delimiters found, treat the entire content as one section
  if (!text.includes(SECTION_DELIMITER)) {
    console.log('🔍 No section delimiters found, treating as single section');
    return [{ type: 'mixed', content: text.trim(), index: 0 }];
  }
  
  const sections = text.split(SECTION_DELIMITER).map(section => section.trim()).filter(Boolean);
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
  const contentMatch = content.match(/<Card[^>]*>([\s\S]*?)<\/Card>/);
  
  return {
    title: titleMatch?.[1] || '',
    image: imageMatch?.[1],
    content: contentMatch?.[1]?.trim() || ''
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
    
    console.log('🃏 Parsed card:', { title, image, contentLength: innerContent.length });
    
    cards.push({
      title,
      image,
      content: innerContent
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
  let tableRows: string[] = [];
  let inTable = false;

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

  const flushTable = () => {
    if (tableRows.length > 0) {
      console.log('📝 Flushing table with', tableRows.length, 'rows');
      
      // Parse table rows properly
      const headerRow = tableRows[0]?.split('|').map(cell => cell.trim()).filter(Boolean) || [];
      const separatorRow = tableRows[1]?.split('|').map(cell => cell.trim()).filter(Boolean) || [];
      const dataRows = tableRows.slice(2).filter(row => row.trim());

      if (headerRow.length > 0) {
        elements.push(
          <CustomTable key={`table-${elements.length}`}>
            <thead>
              <tr>
                {headerRow.map((cell, i) => (
                  <th key={i} className="px-4 py-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <p className="!m-0 min-h-6">
                      <strong>
                        <span dangerouslySetInnerHTML={{ __html: cell }} />
                      </strong>
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {dataRows.map((row, rowIndex) => {
                const cells = row.split('|').map(cell => cell.trim()).filter(Boolean);
                return (
                  <tr key={rowIndex}>
                    {cells.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300">
                        <span dangerouslySetInnerHTML={{ __html: cell }} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </CustomTable>
        );
      }
      
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, index) => {
    line = line.trim();
    
    if (!line) {
      flushList();
      flushTable();
      return;
    }

    // Tables - improved detection
    if (line.includes('|') && (line.trim().startsWith('|') || line.match(/\|.*\|/))) {
      if (!inTable) {
        console.log(`📝 Starting table at line ${index}:`, line);
        flushList();
        inTable = true;
      }
      tableRows.push(line);
      return;
    } else if (inTable) {
      flushTable();
    }

    // Handle lists
    if (line.match(/^[*\-]\s+/)) {
      if (currentListType !== 'unordered') {
        flushList();
        flushTable();
        currentListType = 'unordered';
      }
      currentListItems.push(line);
      return;
    }
    
    if (line.match(/^\d+\.\s+/)) {
      if (currentListType !== 'ordered') {
        flushList();
        flushTable();
        currentListType = 'ordered';
      }
      currentListItems.push(line);
      return;
    }

    flushList();
    flushTable();

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
  flushTable();
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
