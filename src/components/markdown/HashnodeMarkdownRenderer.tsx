import React, { useState } from 'react';
import { Callout } from './Callout';
import { MarkdownCard } from './MarkdownCard';
import { CardGroup } from './CardGroup';

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
  console.log('🔍 parseSections: Input text length:', text.length);
  console.log('🔍 parseSections: Full input text:', text);
  
  const sections = text.split(SECTION_DELIMITER).map(section => section.trim()).filter(Boolean);
  console.log('🔍 parseSections: Split into', sections.length, 'sections');
  
  return sections.map((section, index) => {
    console.log(`🔍 Parsing section ${index}:`, section.substring(0, 100));
    console.log(`🔍 Full section ${index} content:`, section);
    
    if (section.startsWith(FRONTMATTER_PATTERN) && section.includes(TITLE_PATTERN)) {
      console.log('📋 Found frontmatter section');
      return { type: 'frontmatter', content: section, index };
    }
    if (section.startsWith(IMAGE_PATTERN)) {
      console.log('🖼️ Found image section');
      return { type: 'image', content: section, index };
    }
    if (section.includes(CARDGROUP_PATTERN)) {
      console.log('🃏 Found CardGroup section!');
      return { type: 'cardgroup', content: section, index };
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
    if (section.startsWith(STEPS_PATTERN)) {
      console.log('👣 Found Steps section');
      return { type: 'steps', content: section, index };
    }
    if (section.startsWith(CARD_PATTERN) && !section.includes(CARDGROUP_PATTERN)) {
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

// Parse Card element
interface CardData {
  title: string;
  image?: string;
  content: string;
}

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

// Parse CardGroup
interface CardGroupData {
  cols?: number;
  cards: CardData[];
}

const parseCardGroup = (content: string): CardGroupData => {
  console.log('🃏 Parsing CardGroup content:', content.substring(0, 200));
  
  // Updated regex to handle both {2} and 2 formats
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

// Parse Accordion
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

// Parse AccordionGroup
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

// Parse Tabs
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

// Parse Button
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

// Parse Steps
interface StepData {
  title: string;
  content: string;
}

const parseSteps = (content: string): StepData[] => {
  const stepRegex = /<Step\s+([^>]*)>([\s\S]*?)<\/Step>/g;
  const steps: StepData[] = [];
  
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
  console.log('🔄 processInlineMarkdown: Processing text:', text);
  
  // Handle inline code
  text = text.replace(/`([^`]+)`/g, '<code class="hn-inline-code">$1</code>');
  
  // Handle bold with **
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Handle italic with *
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Handle links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="hn-link">$1</a>');
  
  console.log('🔄 processInlineMarkdown: Result:', text);
  return <span dangerouslySetInnerHTML={{ __html: text }} />;
};

// Components
const ImageSection: React.FC<{ src: string; alt: string; align: string; fullwidth: boolean }> = ({ src, alt, align, fullwidth }) => {
  console.log('🖼️ ImageSection rendering:', { src, alt, align, fullwidth });
  return (
    <div className={`hn-image-container ${align} ${fullwidth ? 'fullwidth' : ''}`}>
      <img src={src} alt={alt} className="hn-image" />
    </div>
  );
};

const CalloutSection: React.FC<{ type: string; content: string }> = ({ type, content }) => {
  console.log('💬 CalloutSection rendering:', { type, content });
  return (
    <Callout type={type as 'info' | 'tip' | 'alert'}>
      {processInlineMarkdown(content)}
    </Callout>
  );
};

const CardSection: React.FC<{ card: CardData }> = ({ card }) => {
  console.log('🎯 Rendering individual Card:', { title: card.title, image: card.image });
  
  return (
    <MarkdownCard title={card.title} image={card.image}>
      {processInlineMarkdown(card.content)}
    </MarkdownCard>
  );
};

const CardGroupSection: React.FC<{ cols: number; cards: CardData[] }> = ({ cols, cards }) => {
  console.log('🃏 Rendering CardGroup with:', { cols, cardCount: cards.length });
  
  return (
    <CardGroup cols={cols as 2 | 3 | 4}>
      {cards.map((card, index) => (
        <MarkdownCard key={`card-${index}`} title={card.title} image={card.image}>
          {processInlineMarkdown(card.content)}
        </MarkdownCard>
      ))}
    </CardGroup>
  );
};

// Parse Accordion
const AccordionSection: React.FC<{ accordion: AccordionData }> = ({ accordion }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  console.log('📂 AccordionSection rendering:', { title: accordion.title, content: accordion.content });
  
  return (
    <div className="hn-accordion">
      <button 
        className="hn-accordion-trigger" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {accordion.title}
        <span className={`hn-accordion-icon ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="hn-accordion-content">
          {processInlineMarkdown(accordion.content)}
        </div>
      )}
    </div>
  );
};

// Parse AccordionGroup
const AccordionGroupSection: React.FC<{ accordions: AccordionData[] }> = ({ accordions }) => {
  console.log('📁 AccordionGroupSection rendering:', { count: accordions.length });
  return (
    <div className="hn-accordion-group">
      {accordions.map((accordion, index) => (
        <AccordionSection key={index} accordion={accordion} />
      ))}
    </div>
  );
};

// Parse Tabs
const TabsSection: React.FC<{ tabs: TabData[] }> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  console.log('📑 TabsSection rendering:', { tabCount: tabs.length });
  
  return (
    <div className="hn-tabs">
      <div className="hn-tabs-list">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`hn-tab-trigger ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="hn-tab-content">
        {processInlineMarkdown(tabs[activeTab]?.content || '')}
      </div>
    </div>
  );
};

// Parse Button
const ButtonSection: React.FC<{ button: ButtonData }> = ({ button }) => {
  console.log('🔘 ButtonSection rendering:', button);
  return (
    <div className={`hn-button-container ${button.align}`}>
      <a
        href={button.linkHref}
        target={button.openLinkInNewTab ? '_blank' : '_self'}
        rel={button.openLinkInNewTab ? 'noopener noreferrer' : undefined}
        className="hn-button"
        style={({
          backgroundColor: button.lightColor,
          '--dark-color': button.darkColor
        } as React.CSSProperties)}
      >
        {button.label}
      </a>
    </div>
  );
};

// Parse Steps
const StepsSection: React.FC<{ steps: StepData[] }> = ({ steps }) => {
  console.log('👣 StepsSection rendering:', { stepCount: steps.length });
  return (
    <div className="hn-steps">
      {steps.map((step, index) => (
        <div key={index} className="hn-step">
          <div className="hn-step-number">{index + 1}</div>
          <div className="hn-step-content">
            <h4 className="hn-step-title">{step.title}</h4>
            <div className="hn-step-description">
              {processInlineMarkdown(step.content)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Parse Markdown
const MarkdownSection: React.FC<{ content: string }> = ({ content }) => {
  console.log('📝 MarkdownSection: Starting with content length:', content.length);
  console.log('📝 MarkdownSection: Full content:', content);
  
  const processContent = (text: string): React.ReactNode[] => {
    console.log('📝 processContent: Starting with text:', text);
    
    const lines = text.split('\n');
    console.log('📝 processContent: Split into', lines.length, 'lines');
    
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    let listType: ListType = null;
    let codeBlock: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let tableRows: string[] = [];
    let inTable = false;

    const flushList = () => {
      if (currentList.length > 0) {
        console.log('📝 Flushing list with', currentList.length, 'items, type:', listType);
        if (listType === 'ordered') {
          elements.push(
            <ol key={`list-${elements.length}`} className="hn-ordered-list">
              {currentList}
            </ol>
          );
        } else if (listType === 'unordered') {
          elements.push(
            <ul key={`list-${elements.length}`} className="hn-unordered-list">
              {currentList}
            </ul>
          );
        }
        currentList = [];
        listType = null;
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        console.log('📝 Flushing table with', tableRows.length, 'rows');
        const headerRow = tableRows[0].split('|').filter(cell => cell.trim());
        const alignmentRow = tableRows[1]?.split('|').filter(cell => cell.trim());
        const dataRows = tableRows.slice(2);

        elements.push(
          <table key={`table-${elements.length}`} className="hn-table">
            <thead>
              <tr>
                {headerRow.map((cell, i) => (
                  <th key={i} className="hn-table-header">
                    {processInlineMarkdown(cell.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.split('|').filter(cell => cell.trim()).map((cell, cellIndex) => (
                    <td key={cellIndex} className="hn-table-cell">
                      {processInlineMarkdown(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
        tableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, index) => {
      console.log(`📝 Processing line ${index}:`, line);
      
      // Skip lines that are part of special elements - they'll be handled by section parsing
      if (line.includes('<CardGroup') || line.includes('</CardGroup>') || 
          line.includes('<Card') || line.includes('</Card>') ||
          line.includes('<Callout') || line.includes('</Callout>') ||
          line.includes('<Image')) {
        console.log(`📝 Skipping special element line ${index}:`, line);
        return;
      }

      // Code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          console.log(`📝 Starting code block at line ${index}:`, line);
          flushList();
          flushTable();
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
        } else {
          console.log(`📝 Ending code block at line ${index}, language:`, codeLanguage);
          elements.push(
            <pre key={`code-${index}`} className="hn-code-block">
              <code className={`language-${codeLanguage}`}>
                {codeBlock.join('\n')}
              </code>
            </pre>
          );
          codeBlock = [];
          inCodeBlock = false;
          codeLanguage = '';
        }
        return;
      }

      if (inCodeBlock) {
        console.log(`📝 Adding to code block at line ${index}:`, line);
        codeBlock.push(line);
        return;
      }

      // Tables
      if (line.includes('|') && line.trim().startsWith('|')) {
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

      // Headers
      if (line.startsWith('# ')) {
        console.log(`📝 Found H1 at line ${index}:`, line);
        flushList();
        flushTable();
        elements.push(
          <h1 key={`h1-${index}`} className="hn-h1">
            {line.slice(2)}
          </h1>
        );
        return;
      }
      if (line.startsWith('## ')) {
        console.log(`📝 Found H2 at line ${index}:`, line);
        flushList();
        flushTable();
        elements.push(
          <h2 key={`h2-${index}`} className="hn-h2">
            {line.slice(3)}
          </h2>
        );
        return;
      }
      if (line.startsWith('### ')) {
        console.log(`📝 Found H3 at line ${index}:`, line);
        flushList();
        flushTable();
        elements.push(
          <h3 key={`h3-${index}`} className="hn-h3">
            {line.slice(4)}
          </h3>
        );
        return;
      }

      // Lists
      if (line.match(/^\d+\./)) {
        console.log(`📝 Found ordered list item at line ${index}:`, line);
        if (listType !== 'ordered') {
          flushList();
          flushTable();
          listType = 'ordered';
        }
        currentList.push(
          <li key={`li-${index}`} className="hn-list-item">
            {processInlineMarkdown(line.replace(/^\d+\./, '').trim())}
          </li>
        );
        return;
      }

      if (line.startsWith('* ')) {
        console.log(`📝 Found unordered list item at line ${index}:`, line);
        if (listType !== 'unordered') {
          flushList();
          flushTable();
          listType = 'unordered';
        }
        currentList.push(
          <li key={`li-${index}`} className="hn-list-item">
            {processInlineMarkdown(line.slice(2))}
          </li>
        );
        return;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        console.log(`📝 Found blockquote at line ${index}:`, line);
        flushList();
        flushTable();
        elements.push(
          <blockquote key={`quote-${index}`} className="hn-blockquote">
            {processInlineMarkdown(line.slice(2))}
          </blockquote>
        );
        return;
      }

      // Regular paragraphs
      if (line.trim()) {
        console.log(`📝 Found paragraph at line ${index}:`, line);
        flushList();
        flushTable();
        elements.push(
          <p key={`p-${index}`} className="hn-paragraph">
            {processInlineMarkdown(line)}
          </p>
        );
      } else {
        console.log(`📝 Empty line at ${index}`);
      }
    });

    // Flush any remaining lists or tables
    flushList();
    flushTable();

    console.log('📝 processContent: Generated', elements.length, 'elements');
    return elements;
  };

  const result = processContent(content);
  console.log('📝 MarkdownSection: Returning', result.length, 'elements');
  return <>{result}</>;
};

// Main component
const HashnodeMarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  console.log('🚀 HashnodeMarkdownRenderer processing content length:', content.length);
  
  const sections = parseSections(content);
  console.log('🚀 Parsed sections:', sections.map(s => ({ type: s.type, index: s.index })));
  
  const renderSection = (section: ParsedSection): React.ReactNode => {
    console.log('🔄 Rendering section:', section.type, 'at index:', section.index);
    console.log('🔄 Section content preview:', section.content.substring(0, 100));
    
    let result: React.ReactNode = null;
    
    switch (section.type) {
      case 'frontmatter':
        console.log('📋 Skipping frontmatter section');
        result = null;
        break;
        
      case 'image': {
        const data = extractImageData(section.content);
        console.log('🖼️ Rendering ImageSection with data:', data);
        result = <ImageSection key={section.index} {...data} />;
        break;
      }
      
      case 'card': {
        const card = parseCard(section.content);
        console.log('🎯 Rendering CardSection with data:', card);
        result = <CardSection key={section.index} card={card} />;
        break;
      }
      
      case 'cardgroup': {
        const { cols, cards } = parseCardGroup(section.content);
        console.log('🃏 Rendering CardGroupSection with data:', { cols, cardCount: cards.length });
        result = <CardGroupSection key={section.index} cols={cols || 2} cards={cards} />;
        break;
      }
        
      case 'callout': {
        const data = extractCalloutData(section.content);
        console.log('💬 Rendering CalloutSection with data:', data);
        result = <CalloutSection key={section.index} type={data.type} content={data.content} />;
        break;
      }
      
      case 'accordion': {
        const accordion = parseAccordion(section.content);
        console.log('📂 Rendering AccordionSection with data:', accordion);
        result = <AccordionSection key={section.index} accordion={accordion} />;
        break;
      }
      
      case 'accordiongroup': {
        const accordions = parseAccordionGroup(section.content);
        console.log('📁 Rendering AccordionGroupSection with data:', { count: accordions.length });
        result = <AccordionGroupSection key={section.index} accordions={accordions} />;
        break;
      }
      
      case 'tabs': {
        const tabs = parseTabs(section.content);
        console.log('📑 Rendering TabsSection with data:', { count: tabs.length });
        result = <TabsSection key={section.index} tabs={tabs} />;
        break;
      }
      
      case 'button': {
        const button = parseButton(section.content);
        console.log('🔘 Rendering ButtonSection with data:', button);
        result = <ButtonSection key={section.index} button={button} />;
        break;
      }
      
      case 'steps': {
        const steps = parseSteps(section.content);
        console.log('👣 Rendering StepsSection with data:', { count: steps.length });
        result = <StepsSection key={section.index} steps={steps} />;
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
