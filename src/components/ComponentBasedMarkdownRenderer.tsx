import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Accordion from './Accordion';
import AccordionGroup from './AccordionGroup';
import Tabs from './Tabs';
import Button from './Button';
import { Card } from './Card';
import { CardGroup } from './CardGroup';
import { Callout } from './Callout';
import Table from './Table';
import Typography from './Typography';

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
type SectionType = 'frontmatter' | 'image' | 'cardgroup' | 'callout' | 'accordion' | 'accordiongroup' | 'tabs' | 'button' | 'steps' | 'card' | 'markdown';

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
    if (section.startsWith(IMAGE_PATTERN)) {
      return { type: 'image', content: section, index };
    }
    if (section.startsWith(CARDGROUP_PATTERN)) {
      return { type: 'cardgroup', content: section, index };
    }
    if (section.startsWith(ACCORDIONGROUP_PATTERN)) {
      return { type: 'accordiongroup', content: section, index };
    }
    if (section.startsWith(ACCORDION_PATTERN)) {
      return { type: 'accordion', content: section, index };
    }
    if (section.startsWith(TABS_PATTERN)) {
      return { type: 'tabs', content: section, index };
    }
    if (section.startsWith(BUTTON_PATTERN)) {
      return { type: 'button', content: section, index };
    }
    if (section.startsWith(STEPS_PATTERN)) {
      return { type: 'steps', content: section, index };
    }
    if (section.startsWith(CARD_PATTERN)) {
      return { type: 'card', content: section, index };
    }
    if (section.startsWith(CALLOUT_PATTERN)) {
      return { type: 'callout', content: section, index };
    }
    return { type: 'markdown', content: section, index };
  });
};

// Parser functions
const extractImageData = (content: string) => {
  const srcMatch = content.match(/src="([^"]+)"/);
  const altMatch = content.match(/alt="([^"]*)"/);
  const alignMatch = content.match(/align="([^"]*)"/);
  const fullwidthMatch = content.match(/fullwidth="([^"]*)"/);
  
  return {
    src: srcMatch?.[1] || '',
    alt: altMatch?.[1] || '',
    align: alignMatch?.[1] as 'left' | 'center' | 'right' || 'center',
    fullwidth: fullwidthMatch?.[1] === 'true'
  };
};

const extractCalloutData = (content: string) => {
  const typeMatch = content.match(/type="([^"]*)"/);
  const contentMatch = content.match(/<Callout[^>]*>([\s\S]*?)<\/Callout>/);
  
  return {
    type: typeMatch?.[1] as 'info' | 'tip' | 'alert' || 'info',
    content: contentMatch?.[1]?.trim() || ''
  };
};

const parseCard = (content: string) => {
  const titleMatch = content.match(/title="([^"]*)"/);
  const imageMatch = content.match(/image="([^"]*)"/);
  const contentMatch = content.match(/<Card[^>]*>([\s\S]*?)<\/Card>/);
  
  return {
    title: titleMatch?.[1] || '',
    image: imageMatch?.[1],
    content: contentMatch?.[1]?.trim() || ''
  };
};

const parseCardGroup = (content: string) => {
  const colsMatch = content.match(/<CardGroup[^>]*cols={(\d+)}/);
  const cols = colsMatch ? parseInt(colsMatch[1]) as 2 | 3 | 4 : 2;
  
  const cardRegex = /<Card\s+([^>]*)>([\s\S]*?)<\/Card>/g;
  const cards: Array<{ title: string; image?: string; content: string }> = [];
  
  let match: RegExpExecArray | null;
  while ((match = cardRegex.exec(content)) !== null) {
    const attributes = match[1];
    const innerContent = match[2].trim();
    
    const titleMatch = attributes.match(/title="([^"]*)"/);
    const title = titleMatch ? titleMatch[1] : '';
    
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

const parseAccordion = (content: string) => {
  const titleMatch = content.match(/title="([^"]*)"/);
  const contentMatch = content.match(/<Accordion[^>]*>([\s\S]*?)<\/Accordion>/);
  
  return {
    title: titleMatch?.[1] || '',
    content: contentMatch?.[1]?.trim() || ''
  };
};

const parseAccordionGroup = (content: string) => {
  const accordionRegex = /<Accordion\s+([^>]*)>([\s\S]*?)<\/Accordion>/g;
  const accordions: Array<{ title: string; content: string }> = [];
  
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

const parseTabs = (content: string) => {
  const tabRegex = /<TabItem\s+([^>]*)>([\s\S]*?)<\/TabItem>/g;
  const tabs: Array<{ title: string; content: string }> = [];
  
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

const parseButton = (content: string) => {
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
    align: alignMatch?.[1] as 'left' | 'center' | 'right' || 'center',
    lightColor: lightColorMatch?.[1],
    darkColor: darkColorMatch?.[1]
  };
};

const parseSteps = (content: string) => {
  const stepRegex = /<Step\s+([^>]*)>([\s\S]*?)<\/Step>/g;
  const steps: Array<{ title: string; content: string }> = [];
  
  let match: RegExpExecArray | null;
  while ((match = stepRegex.exec(content)) !== null) {
    const attributes = match[1];
    const innerContent = match[2].trim();
    
    const titleMatch = attributes.match(/title="([^"]*)"/);
    const title = titleMatch ? titleMatch[1] : '';
    
    steps.push({
      title,
      content: innerContent
    });
  }
  
  return steps;
};

const processInlineMarkdown = (text: string): React.ReactNode => {
  // Handle inline code
  text = text.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
  
  // Handle bold with **
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Handle italic with *
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Handle links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline dark:text-blue-400" target="_blank" rel="noopener noreferrer">$1</a>');
  
  return <span dangerouslySetInnerHTML={{ __html: text }} />;
};

// Markdown section component
const MarkdownSection: React.FC<{ content: string }> = ({ content }) => {
  const processContent = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    let listType: 'ordered' | 'unordered' | null = null;
    let codeBlock: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let tableRows: string[] = [];
    let inTable = false;

    const flushList = () => {
      if (currentList.length > 0) {
        if (listType === 'ordered') {
          elements.push(
            <Typography.OrderedList key={`list-${elements.length}`}>
              {currentList}
            </Typography.OrderedList>
          );
        } else if (listType === 'unordered') {
          elements.push(
            <Typography.UnorderedList key={`list-${elements.length}`}>
              {currentList}
            </Typography.UnorderedList>
          );
        }
        currentList = [];
        listType = null;
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        const headerRow = tableRows[0].split('|').filter(cell => cell.trim());
        const dataRows = tableRows.slice(2); // Skip alignment row

        const rows = dataRows.map(row => 
          row.split('|').filter(cell => cell.trim()).map(cell => cell.trim())
        );

        elements.push(
          <Table key={`table-${elements.length}`} headers={headerRow.map(h => h.trim())} rows={rows} />
        );
        tableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, index) => {
      line = line.trim();
      
      // Skip empty lines
      if (!line) return;

      // Code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          flushList();
          flushTable();
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
        } else {
          elements.push(
            <CodeBlock key={`code-${index}`} language={codeLanguage}>
              {codeBlock.join('\n')}
            </CodeBlock>
          );
          codeBlock = [];
          inCodeBlock = false;
          codeLanguage = '';
        }
        return;
      }

      if (inCodeBlock) {
        codeBlock.push(line);
        return;
      }

      // Tables
      if (line.includes('|') && line.trim().startsWith('|')) {
        if (!inTable) {
          flushList();
          inTable = true;
        }
        tableRows.push(line);
        return;
      } else if (inTable) {
        flushTable();
      }

      // Headers
      if (line.startsWith('# ')) {
        flushList();
        flushTable();
        elements.push(
          <Typography.H1 key={`h1-${index}`}>
            {line.slice(2)}
          </Typography.H1>
        );
        return;
      }
      if (line.startsWith('## ')) {
        flushList();
        flushTable();
        elements.push(
          <Typography.H2 key={`h2-${index}`}>
            {line.slice(3)}
          </Typography.H2>
        );
        return;
      }
      if (line.startsWith('### ')) {
        flushList();
        flushTable();
        elements.push(
          <Typography.H3 key={`h3-${index}`}>
            {line.slice(4)}
          </Typography.H3>
        );
        return;
      }

      // Lists
      if (line.match(/^\d+\./)) {
        if (listType !== 'ordered') {
          flushList();
          flushTable();
          listType = 'ordered';
        }
        currentList.push(
          <Typography.ListItem key={`li-${index}`}>
            {processInlineMarkdown(line.replace(/^\d+\./, '').trim())}
          </Typography.ListItem>
        );
        return;
      }

      if (line.startsWith('* ')) {
        if (listType !== 'unordered') {
          flushList();
          flushTable();
          listType = 'unordered';
        }
        currentList.push(
          <Typography.ListItem key={`li-${index}`}>
            {processInlineMarkdown(line.slice(2))}
          </Typography.ListItem>
        );
        return;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        flushList();
        flushTable();
        elements.push(
          <Typography.Blockquote key={`quote-${index}`}>
            {processInlineMarkdown(line.slice(2))}
          </Typography.Blockquote>
        );
        return;
      }

      // Inline elements (handle separately)
      if (line.includes('<Callout') || line.includes('<Card') || line.includes('<Accordion')) {
        // These will be handled by the main renderer
        return;
      }

      // Regular paragraphs
      if (line.trim()) {
        flushList();
        flushTable();
        elements.push(
          <Typography.Paragraph key={`p-${index}`}>
            {processInlineMarkdown(line)}
          </Typography.Paragraph>
        );
      }
    });

    // Flush any remaining lists or tables
    flushList();
    flushTable();

    return elements;
  };

  return <>{processContent(content)}</>;
};

// Main component
const ComponentBasedMarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const sections = parseSections(content);
  
  const renderSection = (section: ParsedSection): React.ReactNode => {
    switch (section.type) {
      case 'frontmatter':
        return null;
        
      case 'image': {
        const data = extractImageData(section.content);
        return <Image key={section.index} {...data} />;
      }
      
      case 'card': {
        const card = parseCard(section.content);
        return (
          <Card key={section.index} title={card.title} image={card.image}>
            {processInlineMarkdown(card.content)}
          </Card>
        );
      }
      
      case 'cardgroup': {
        const { cols, cards } = parseCardGroup(section.content);
        return (
          <CardGroup key={section.index} cols={cols}>
            {cards.map((card, cardIndex) => (
              <Card key={cardIndex} title={card.title} image={card.image}>
                {processInlineMarkdown(card.content)}
              </Card>
            ))}
          </CardGroup>
        );
      }
        
      case 'callout': {
        const data = extractCalloutData(section.content);
        return (
          <Callout key={section.index} type={data.type}>
            {processInlineMarkdown(data.content)}
          </Callout>
        );
      }
      
      case 'accordion': {
        const accordion = parseAccordion(section.content);
        return (
          <Accordion key={section.index} title={accordion.title}>
            {processInlineMarkdown(accordion.content)}
          </Accordion>
        );
      }
      
      case 'accordiongroup': {
        const accordions = parseAccordionGroup(section.content);
        return (
          <AccordionGroup key={section.index}>
            {accordions.map((accordion, accordionIndex) => (
              <Accordion key={accordionIndex} title={accordion.title}>
                {processInlineMarkdown(accordion.content)}
              </Accordion>
            ))}
          </AccordionGroup>
        );
      }
      
      case 'tabs': {
        const tabs = parseTabs(section.content);
        return (
          <Tabs key={section.index}>
            {tabs.map((tab, tabIndex) => (
              <TabItem key={tabIndex} title={tab.title}>
                {processInlineMarkdown(tab.content)}
              </TabItem>
            ))}
          </Tabs>
        );
      }
      
      case 'button': {
        const button = parseButton(section.content);
        return (
          <Button key={section.index} {...button} />
        );
      }
      
      case 'steps': {
        const steps = parseSteps(section.content);
        return (
          <Steps key={section.index}>
            {steps.map((step, stepIndex) => (
              <Step key={stepIndex} title={step.title}>
                {processInlineMarkdown(step.content)}
              </Step>
            ))}
          </Steps>
        );
      }
      
      case 'markdown':
        return (
          <div key={section.index}>
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

export default ComponentBasedMarkdownRenderer;
