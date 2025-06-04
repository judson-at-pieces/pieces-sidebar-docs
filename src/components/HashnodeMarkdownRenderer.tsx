
import React, { useState } from 'react';

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
  const colsMatch = content.match(/<CardGroup[^>]*cols={(\d+)}/);
  const cols = colsMatch ? parseInt(colsMatch[1]) : 2;
  
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
    
    cards.push({
      title,
      image,
      content: innerContent
    });
  }
  
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

// Parse Steps - Updated to properly handle Steps/Step pattern
interface StepData {
  title: string;
  content: string;
}

const parseSteps = (content: string): StepData[] => {
  console.log('🔧 Parsing Steps content:', content.substring(0, 200) + '...');
  
  // Handle both <Step> tags and markdown-style Steps
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
  
  // If no <Step> tags found, try to parse markdown-style steps
  if (steps.length === 0) {
    const lines = content.split('\n');
    let currentStep: StepData | null = null;
    
    for (const line of lines) {
      const stepMatch = line.match(/^\s*<Step\s+title="([^"]*)">/);
      if (stepMatch) {
        if (currentStep) {
          steps.push(currentStep);
        }
        currentStep = {
          title: stepMatch[1],
          content: ''
        };
      } else if (line.trim() === '</Step>') {
        if (currentStep) {
          steps.push(currentStep);
          currentStep = null;
        }
      } else if (currentStep && line.trim()) {
        currentStep.content += (currentStep.content ? '\n' : '') + line.trim();
      }
    }
    
    if (currentStep) {
      steps.push(currentStep);
    }
  }
  
  console.log('🔧 Parsed Steps:', steps.length, 'steps found');
  return steps;
};

// Components
const Image: React.FC<{ src: string; alt: string; align: string; fullwidth: boolean }> = ({ src, alt, align, fullwidth }) => (
  <div className={`my-6 ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}>
    <img 
      src={src} 
      alt={alt} 
      className={`rounded-lg shadow-md ${fullwidth ? 'w-full' : 'max-w-full'} ${align === 'center' ? 'mx-auto' : ''}`}
    />
  </div>
);

const Callout: React.FC<{ type: string; content: string }> = ({ type, content }) => {
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
      case 'alert':
        return 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200';
    }
  };

  return (
    <div className={`border-l-4 p-4 my-4 rounded-r-lg ${getCalloutStyles(type)}`}>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {renderMarkdown(content)}
      </div>
    </div>
  );
};

const Card: React.FC<CardData> = ({ title, image, content }) => (
  <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow bg-card">
    {image && (
      <div className="mb-4">
        <img src={image} alt={title} className="w-full h-48 object-cover rounded-md" />
      </div>
    )}
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {renderMarkdown(content)}
    </div>
  </div>
);

const CardGroup: React.FC<CardGroupData> = ({ cols = 2, cards }) => (
  <div className={`grid gap-6 my-6 ${cols === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
    {cards.map((card, index) => (
      <Card key={index} {...card} />
    ))}
  </div>
);

const Accordion: React.FC<AccordionData> = ({ title, content }) => {
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
            {renderMarkdown(content)}
          </div>
        </div>
      )}
    </div>
  );
};

const AccordionGroup: React.FC<{ accordions: AccordionData[] }> = ({ accordions }) => (
  <div className="space-y-2 my-6">
    {accordions.map((accordion, index) => (
      <Accordion key={index} {...accordion} />
    ))}
  </div>
);

const Tabs: React.FC<{ tabs: TabData[] }> = ({ tabs }) => {
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
          {renderMarkdown(tabs[activeTab]?.content || '')}
        </div>
      </div>
    </div>
  );
};

const Button: React.FC<ButtonData> = ({ label, linkHref, openLinkInNewTab, align, lightColor, darkColor }) => {
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

const Steps: React.FC<{ steps: StepData[] }> = ({ steps }) => {
  console.log('🔧 Rendering Steps component with', steps.length, 'steps');
  
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
                <h3 className="font-medium text-base text-slate-700 dark:text-slate-200 m-0">
                  {step.title}
                </h3>
                <div className="text-base text-slate-600 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none">
                  {renderMarkdown(step.content)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Basic markdown renderer
const renderMarkdown = (content: string): React.ReactNode => {
  if (!content) return null;

  // Simple markdown parsing for basic elements
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
      // Regular paragraph - handle HTML content
      elements.push(React.createElement('p', { 
        key: index, 
        className: 'mb-3 leading-relaxed',
        dangerouslySetInnerHTML: { __html: line }
      }));
    }
  });

  flushList();
  return elements;
};

// Main component
const HashnodeMarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const sections = parseSections(content);
  console.log('🔧 HashnodeMarkdownRenderer: Processing', sections.length, 'sections');

  return (
    <div className="markdown-content">
      {sections.map((section) => {
        console.log('🔧 Rendering section type:', section.type);
        
        switch (section.type) {
          case 'image': {
            const imageData = extractImageData(section.content);
            return <Image key={section.index} {...imageData} />;
          }
          case 'callout': {
            const calloutData = extractCalloutData(section.content);
            return <Callout key={section.index} {...calloutData} />;
          }
          case 'card': {
            const cardData = parseCard(section.content);
            return <Card key={section.index} {...cardData} />;
          }
          case 'cardgroup': {
            const cardGroupData = parseCardGroup(section.content);
            console.log('🔧 Rendering CardGroup with', cardGroupData.cards.length, 'cards');
            return <CardGroup key={section.index} {...cardGroupData} />;
          }
          case 'accordion': {
            const accordionData = parseAccordion(section.content);
            return <Accordion key={section.index} {...accordionData} />;
          }
          case 'accordiongroup': {
            const accordionGroupData = parseAccordionGroup(section.content);
            return <AccordionGroup key={section.index} accordions={accordionGroupData} />;
          }
          case 'tabs': {
            const tabsData = parseTabs(section.content);
            return <Tabs key={section.index} tabs={tabsData} />;
          }
          case 'button': {
            const buttonData = parseButton(section.content);
            return <Button key={section.index} {...buttonData} />;
          }
          case 'steps': {
            const stepsData = parseSteps(section.content);
            console.log('🔧 Rendering Steps with', stepsData.length, 'steps');
            return <Steps key={section.index} steps={stepsData} />;
          }
          case 'markdown': {
            return (
              <div key={section.index} className="prose prose-sm dark:prose-invert max-w-none">
                {renderMarkdown(section.content)}
              </div>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
};

export default HashnodeMarkdownRenderer;
