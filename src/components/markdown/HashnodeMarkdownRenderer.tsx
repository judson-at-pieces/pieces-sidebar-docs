import React, { useState } from 'react';
import { Callout } from './Callout';
import { CodeBlock } from './CodeBlock';
import { MarkdownCard } from './MarkdownCard';
import { CardGroup } from './CardGroup';
import { Steps, Step } from './Steps';
import { SecureInlineMarkdown } from './SecureInlineMarkdown';
import { sanitizeText } from '@/utils/secureMarkdownProcessor';
import { X } from 'lucide-react';

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
    
    // Check for mixed content - sections that contain multiple types of elements
    const hasCardGroup = section.includes(CARDGROUP_PATTERN);
    const hasSteps = section.includes(STEPS_PATTERN);
    const hasCallout = section.includes(CALLOUT_PATTERN);
    const hasImage = section.includes(IMAGE_PATTERN);
    const hasCard = section.includes(CARD_PATTERN) && !hasCardGroup;
    
    // Count markdown lines (non-empty lines that aren't special elements)
    const lines = section.split('\n').filter(line => line.trim());
    const specialElementLines = lines.filter(line => 
      line.includes('<CardGroup') || 
      line.includes('<Steps') || 
      line.includes('<Callout') || 
      line.includes('<Image') ||
      line.includes('<Card') ||
      line.includes('</CardGroup>') ||
      line.includes('</Steps>') ||
      line.includes('</Callout>') ||
      line.includes('</Card>')
    );
    const markdownLines = lines.length - specialElementLines.length;
    
    console.log(`🔍 Section ${index} analysis:`, {
      hasCardGroup, hasSteps, hasCallout, hasImage, hasCard,
      totalLines: lines.length,
      specialElementLines: specialElementLines.length,
      markdownLines
    });
    
    // If we have significant markdown content along with special elements, treat as mixed
    if (markdownLines > 5 && (hasCardGroup || hasSteps || hasCallout || hasImage || hasCard)) {
      console.log('🔀 Found mixed content section!');
      return { type: 'mixed', content: section, index };
    }
    
    // Pure special element sections
    if (hasCardGroup && !hasSteps && !hasCallout && markdownLines <= 5) {
      console.log('🃏 Found pure CardGroup section!');
      return { type: 'cardgroup', content: section, index };
    }
    if (hasSteps && !hasCardGroup && !hasCallout && markdownLines <= 5) {
      console.log('👣 Found pure Steps section!');
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
    if (section.startsWith(CARD_PATTERN) && !section.includes(CARDGROUP_PATTERN)) {
      console.log('🎯 Found standalone Card section');
      return { type: 'card', content: section, index };
    }
    if (section.startsWith(CALLOUT_PATTERN) && !hasSteps && !hasCardGroup) {
      console.log('💬 Found pure Callout section');
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

// Parse Steps - Updated to handle the markdown format properly
interface StepData {
  title: string;
  content: string;
}

const parseSteps = (content: string): StepData[] => {
  console.log('👣 Parsing Steps content:', content);
  
  // First, try to find the <Steps> block
  const stepsMatch = content.match(/<Steps>([\s\S]*?)<\/Steps>/);
  if (!stepsMatch) {
    console.log('👣 No <Steps> block found');
    return [];
  }
  
  const stepsContent = stepsMatch[1];
  console.log('👣 Steps inner content:', stepsContent);
  
  // Parse individual <Step> elements
  const stepRegex = /<Step\s+title="([^"]*)"[^>]*>([\s\S]*?)<\/Step>/g;
  const steps: StepData[] = [];
  
  let match: RegExpExecArray | null;
  while ((match = stepRegex.exec(stepsContent)) !== null) {
    const title = match[1];
    const innerContent = match[2].trim();
    
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
  console.log('🔄 processInlineMarkdown: Processing text with secure renderer');
  const sanitizedText = sanitizeText(text);
  return <SecureInlineMarkdown content={sanitizedText} />;
};

const processSimpleMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Use secure inline markdown instead of dangerouslySetInnerHTML
  const sanitizedText = sanitizeText(text);
  return <SecureInlineMarkdown content={sanitizedText} />;
};

// Components
const ImageModal: React.FC<{ src: string; alt: string; isOpen: boolean; onClose: () => void }> = ({ src, alt, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
          aria-label="Close image"
        >
          <X size={24} />
        </button>
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

const ImageSection: React.FC<{ src: string; alt: string; align: string; fullwidth: boolean }> = ({ src, alt, align, fullwidth }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  console.log('🖼️ ImageSection rendering:', { src, alt, align, fullwidth });
  
  const alignmentClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }[align] || 'justify-center';
  
  return (
    <>
      <div className={`flex my-6 ${alignmentClass}`}>
        <img 
          src={src} 
          alt={alt} 
          className={`rounded-lg cursor-pointer transition-transform duration-200 hover:-translate-y-1 ${fullwidth ? 'w-full' : 'max-w-full'} h-auto`}
          onClick={() => setIsModalOpen(true)}
        />
      </div>
      <ImageModal 
        src={src} 
        alt={alt} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
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
      {card.content}
    </MarkdownCard>
  );
};

const CardGroupSection: React.FC<{ cols: number; cards: CardData[] }> = ({ cols, cards }) => {
  console.log('🃏 Rendering CardGroup with:', { cols, cardCount: cards.length });
  
  return (
    <CardGroup cols={cols as 2 | 3 | 4}>
      {cards.map((card, index) => (
        <MarkdownCard key={`card-${index}`} title={card.title} image={card.image}>
          {card.content}
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

// Updated Steps Section to use secure markdown rendering with better link processing
const StepsSection: React.FC<{ steps: StepData[] }> = ({ steps }) => {
  const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null);
  
  console.log('👣 StepsSection rendering:', { stepCount: steps.length });
  
  const handleImageClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      setModalImage({ src: img.src, alt: img.alt || '' });
    }
  };
  
  return (
    <>
      <Steps>
        {steps.map((step, index) => (
          <Step key={index} title={step.title}>
            <div 
              className="[&_img]:rounded-lg [&_img]:my-4 [&_img]:cursor-pointer [&_img]:transition-transform [&_img]:duration-200 [&_img:hover]:-translate-y-1 [&_a]:text-blue-600 [&_a]:hover:text-blue-800 [&_a]:underline [&_a]:underline-offset-4" 
              onClick={handleImageClick}
            >
              <SecureInlineMarkdown content={step.content} />
            </div>
          </Step>
        ))}
      </Steps>
      
      {modalImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setModalImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
              aria-label="Close image"
            >
              <X size={24} />
            </button>
            <img 
              src={modalImage.src} 
              alt={modalImage.alt} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

// Parse mixed content that contains both special elements and markdown
const MixedContentSection: React.FC<{ content: string }> = ({ content }) => {
  console.log('🔀 MixedContentSection: Processing content with length:', content.length);
  
  const elements: React.ReactNode[] = [];
  
  // Find all special elements with their positions
  const cardGroupRegex = /<CardGroup[^>]*>[\s\S]*?<\/CardGroup>/g;
  const imageRegex = /<Image[^>]*\/>/g;
  const calloutRegex = /<Callout[^>]*>[\s\S]*?<\/Callout>/g;
  const standaloneCardRegex = /<Card[^>]*>[\s\S]*?<\/Card>/g;
  const stepsRegex = /<Steps[^>]*>[\s\S]*?<\/Steps>/g;
  
  const allMatches: Array<{ match: RegExpMatchArray; type: string }> = [];
  
  // Find Steps first (so we can exclude images inside them)
  let match;
  while ((match = stepsRegex.exec(content)) !== null) {
    allMatches.push({ match, type: 'steps' });
  }
  
  // Find CardGroups
  stepsRegex.lastIndex = 0;
  while ((match = cardGroupRegex.exec(content)) !== null) {
    allMatches.push({ match, type: 'cardgroup' });
  }
  
  // Find Callouts
  cardGroupRegex.lastIndex = 0;
  while ((match = calloutRegex.exec(content)) !== null) {
    allMatches.push({ match, type: 'callout' });
  }
  
  // Find Images (but exclude ones inside Steps)
  calloutRegex.lastIndex = 0;
  const stepsMatches = allMatches.filter(m => m.type === 'steps');
  while ((match = imageRegex.exec(content)) !== null) {
    // Check if this image is inside a Steps block
    const isInSteps = stepsMatches.some(stepsMatch => {
      const stepsStart = stepsMatch.match.index!;
      const stepsEnd = stepsStart + stepsMatch.match[0].length;
      return match.index! >= stepsStart && match.index! < stepsEnd;
    });
    
    if (!isInSteps) {
      allMatches.push({ match, type: 'image' });
    }
  }
  
  // Find standalone Cards (not inside CardGroups)
  imageRegex.lastIndex = 0;
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
  
  // Sort by position
  allMatches.sort((a, b) => (a.match.index || 0) - (b.match.index || 0));
  
  console.log('🔀 Found special elements:', allMatches.length);
  
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

// Parse Markdown - Updated to handle inline Image tags within markdown content
const MarkdownSection: React.FC<{ content: string }> = ({ content }) => {
  console.log('📝 MarkdownSection: Starting with content length:', content.length);
  
  const processContent = (text: string): React.ReactNode[] => {
    console.log('📝 processContent: Starting with text:', text);
    
    // First, extract any inline Image tags and process them separately
    const imageMatches: Array<{ match: RegExpMatchArray; index: number }> = [];
    const imageRegex = /<Image[^>]*\/>/g;
    let match;
    while ((match = imageRegex.exec(text)) !== null) {
      imageMatches.push({ match, index: match.index! });
    }
    
    if (imageMatches.length > 0) {
      console.log('📝 Found', imageMatches.length, 'inline images in markdown');
      const elements: React.ReactNode[] = [];
      let lastIndex = 0;
      let elementIndex = 0;
      
      // Process text with inline images
      for (const { match, index } of imageMatches) {
        // Add text content before the image
        if (index > lastIndex) {
          const textContent = text.slice(lastIndex, index);
          if (textContent.trim()) {
            const textElements = processTextContent(textContent);
            elements.push(...textElements.map((el, i) => 
              React.cloneElement(el as React.ReactElement, { key: `text-${elementIndex}-${i}` })
            ));
            elementIndex++;
          }
        }
        
        // Add the image
        const imageData = extractImageData(match[0]);
        elements.push(
          <ImageSection key={`image-${elementIndex}`} {...imageData} />
        );
        elementIndex++;
        lastIndex = index + match[0].length;
      }
      
      // Add any remaining text content
      if (lastIndex < text.length) {
        const remainingText = text.slice(lastIndex);
        if (remainingText.trim()) {
          const textElements = processTextContent(remainingText);
          elements.push(...textElements.map((el, i) => 
            React.cloneElement(el as React.ReactElement, { key: `text-final-${i}` })
          ));
        }
      }
      
      return elements;
    }
    
    // No inline images, process as regular markdown
    return processTextContent(text);
  };

  const processTextContent = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    console.log('📝 processTextContent: Split into', lines.length, 'lines');
    
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
                    <SecureInlineMarkdown content={sanitizeText(cell.trim())} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.split('|').filter(cell => cell.trim()).map((cell, cellIndex) => (
                    <td key={cellIndex} className="hn-table-cell">
                      <SecureInlineMarkdown content={sanitizeText(cell.trim())} />
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

      // Code blocks - UPDATED to use CodeBlock component with Go detection
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          console.log(`📝 Starting code block at line ${index}:`, line);
          flushList();
          flushTable();
          inCodeBlock = true;
          codeLanguage = sanitizeText(line.slice(3).trim());
        } else {
          console.log(`📝 Ending code block at line ${index}, language:`, codeLanguage);
          const codeContent = codeBlock.join('\n');
          
          // Use the CodeBlock component with Go detection
          elements.push(
            <CodeBlock 
              key={`code-${index}`} 
              language={codeLanguage || undefined}
              className={codeLanguage ? `language-${codeLanguage}` : undefined}
            >
              {codeContent}
            </CodeBlock>
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
            {sanitizeText(line.slice(2))}
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
            {sanitizeText(line.slice(3))}
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
            {sanitizeText(line.slice(4))}
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
            <SecureInlineMarkdown content={sanitizeText(line.replace(/^\d+\./, '').trim())} />
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
            <SecureInlineMarkdown content={sanitizeText(line.slice(2))} />
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
            <SecureInlineMarkdown content={sanitizeText(line.slice(2))} />
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
            <SecureInlineMarkdown content={sanitizeText(line)} />
          </p>
        );
      } else {
        console.log(`📝 Empty line at ${index}`);
      }
    });

    // Flush any remaining lists or tables
    flushList();
    flushTable();

    console.log('📝 processTextContent: Generated', elements.length, 'elements');
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
        result = <AccordionSection key={section.index} accordion={accordionData} />;
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
        result = <ButtonSection key={section.index} button={buttonData} />;
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
