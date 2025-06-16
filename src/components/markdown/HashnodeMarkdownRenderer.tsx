import React, { useState } from 'react';
import { Callout } from './Callout';
import { MarkdownCard } from './MarkdownCard';
import { CardGroup } from './CardGroup';
import { Steps, Step } from './Steps';
import { SecureInlineMarkdown } from './SecureInlineMarkdown';
import { sanitizeText } from '@/utils/secureMarkdownProcessor';
import { processCustomSyntax } from './customSyntaxProcessor';
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
const YOUTUBE_PATTERN = 'youtube.com';
const YOUTU_BE_PATTERN = 'youtu.be';

// Types
type SectionType = 'frontmatter' | 'image' | 'cardgroup' | 'callout' | 'accordion' | 'accordiongroup' | 'tabs' | 'button' | 'steps' | 'card' | 'youtube' | 'markdown' | 'mixed';
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
  
  const sections = text.split(SECTION_DELIMITER).map(section => section.trim()).filter(Boolean);
  console.log('🔍 parseSections: Split into', sections.length, 'sections');
  
  return sections.map((section, index) => {
    console.log(`🔍 Parsing section ${index}:`, section.substring(0, 100));
    
    if (section.startsWith(FRONTMATTER_PATTERN) && section.includes(TITLE_PATTERN)) {
      console.log('📋 Found frontmatter section');
      return { type: 'frontmatter', content: section, index };
    }
    if (section.startsWith(IMAGE_PATTERN)) {
      console.log('🖼️ Found image section');
      return { type: 'image', content: section, index };
    }
    
    // Check for YouTube embeds
    const hasYoutube = section.includes(YOUTUBE_PATTERN) || section.includes(YOUTU_BE_PATTERN);
    
    // Check for Card components more reliably
    const hasCard = section.includes(CARD_PATTERN) && !section.includes(CARDGROUP_PATTERN);
    const hasCardGroup = section.includes(CARDGROUP_PATTERN);
    const hasSteps = section.includes(STEPS_PATTERN);
    const hasCallout = section.includes(CALLOUT_PATTERN);
    const hasImage = section.includes(IMAGE_PATTERN) || section.includes('<img');
    
    // Count markdown lines (non-empty lines that aren't special elements)
    const lines = section.split('\n').filter(line => line.trim());
    const specialElementLines = lines.filter(line => 
      line.includes('<CardGroup') || 
      line.includes('<Steps') || 
      line.includes('<Callout') || 
      line.includes('<Image') ||
      line.includes('<Card') ||
      line.includes('<img') ||
      line.includes('youtube.com') ||
      line.includes('youtu.be') ||
      line.includes('</CardGroup>') ||
      line.includes('</Steps>') ||
      line.includes('</Callout>') ||
      line.includes('</Card>')
    );
    const markdownLines = lines.length - specialElementLines.length;
    
    console.log(`🔍 Section ${index} analysis:`, {
      hasCardGroup, hasSteps, hasCallout, hasImage, hasCard, hasYoutube,
      totalLines: lines.length,
      specialElementLines: specialElementLines.length,
      markdownLines
    });
    
    // If we have significant markdown content along with special elements, treat as mixed
    if (markdownLines > 3 && (hasCardGroup || hasSteps || hasCallout || hasImage || hasCard || hasYoutube)) {
      console.log('🔀 Found mixed content section!');
      return { type: 'mixed', content: section, index };
    }
    
    // Pure special element sections
    if (hasCardGroup && markdownLines <= 3) {
      console.log('🃏 Found pure CardGroup section!');
      return { type: 'cardgroup', content: section, index };
    }
    if (hasSteps && markdownLines <= 3) {
      console.log('👣 Found pure Steps section!');
      return { type: 'steps', content: section, index };
    }
    if (section.startsWith(CALLOUT_PATTERN)) {
      console.log('💬 Found pure Callout section');
      return { type: 'callout', content: section, index };
    }
    if (hasCard && markdownLines <= 3) {
      console.log('🎯 Found standalone Card section');
      return { type: 'card', content: section, index };
    }
    if (hasYoutube && markdownLines <= 3) {
      console.log('📺 Found YouTube embed section');
      return { type: 'youtube', content: section, index };
    }
    
    console.log('📝 Found markdown section');
    return { type: 'markdown', content: section, index };
  });
};

// YouTube embed component
const YouTubeEmbed: React.FC<{ url: string; title?: string }> = ({ url, title }) => {
  console.log('📺 YouTubeEmbed rendering:', { url, title });
  
  // Extract video ID from various YouTube URL formats
  const getVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };
  
  const videoId = getVideoId(url);
  if (!videoId) {
    console.warn('Invalid YouTube URL:', url);
    return <p className="text-red-500">Invalid YouTube URL: {url}</p>;
  }
  
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  
  return (
    <div className="my-6">
      <div className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden bg-muted">
        <iframe
          src={embedUrl}
          title={title || 'YouTube video'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
      {title && (
        <p className="text-sm text-muted-foreground mt-2 text-center">{title}</p>
      )}
    </div>
  );
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

interface StepData {
  title: string;
  content: string;
}

const parseSteps = (content: string): StepData[] => {
  console.log('👣 Parsing Steps content:', content);
  
  const stepsMatch = content.match(/<Steps>([\s\S]*?)<\/Steps>/);
  if (!stepsMatch) {
    console.log('👣 No <Steps> block found');
    return [];
  }
  
  const stepsContent = stepsMatch[1];
  console.log('👣 Steps inner content:', stepsContent);
  
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
          <Step key={`step-${index}`} title={step.title}>
            <div 
              className="[&_img]:rounded-lg [&_img]:my-4 [&_img]:cursor-pointer [&_img]:transition-transform [&_img]:duration-200 [&_img:hover]:-translate-y-1" 
              onClick={handleImageClick}
            >
              {processInlineMarkdown(step.content)}
            </div>
          </Step>
        ))}
      </Steps>
      
      {modalImage && (
        <ImageModal 
          src={modalImage.src} 
          alt={modalImage.alt} 
          isOpen={true} 
          onClose={() => setModalImage(null)} 
        />
      )}
    </>
  );
};

// Parse mixed content that contains both special elements and markdown
const MixedContentSection: React.FC<{ content: string }> = ({ content }) => {
  console.log('🔀 MixedContentSection: Processing content with length:', content.length);
  
  // Apply custom syntax processing first to normalize HTML elements
  const processedContent = processCustomSyntax(content);
  console.log('🔀 MixedContentSection: Applied custom syntax processing');
  
  const elements: React.ReactNode[] = [];
  
  // Find all special elements with their positions
  const cardGroupRegex = /<CardGroup[^>]*>[\s\S]*?<\/CardGroup>/g;
  const imageRegex = /<Image[^>]*\/>/g;
  const imgRegex = /<img[^>]*\/?>/g;
  const calloutRegex = /<Callout[^>]*>[\s\S]*?<\/Callout>/g;
  const standaloneCardRegex = /<Card[^>]*>[\s\S]*?<\/Card>/g;
  const stepsRegex = /<Steps[^>]*>[\s\S]*?<\/Steps>/g;
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#\s]+)/g;
  
  const allMatches: Array<{ match: RegExpMatchArray; type: string }> = [];
  
  // Find all matches
  [
    { regex: stepsRegex, type: 'steps' },
    { regex: cardGroupRegex, type: 'cardgroup' },
    { regex: calloutRegex, type: 'callout' },
    { regex: imageRegex, type: 'image' },
    { regex: imgRegex, type: 'img' },
    { regex: standaloneCardRegex, type: 'card' },
    { regex: youtubeRegex, type: 'youtube' }
  ].forEach(({ regex, type }) => {
    let match;
    while ((match = regex.exec(processedContent)) !== null) {
      // Don't include cards that are inside CardGroups
      if (type === 'card') {
        const isInCardGroup = allMatches.some(m => {
          if (m.type !== 'cardgroup') return false;
          const cgStart = m.match.index!;
          const cgEnd = cgStart + m.match[0].length;
          return match.index! >= cgStart && match.index! < cgEnd;
        });
        if (isInCardGroup) continue;
      }
      
      allMatches.push({ match, type });
    }
  });
  
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
      const markdownContent = processedContent.slice(lastIndex, elementStart).trim();
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
      case 'img': {
        const srcMatch = match[0].match(/src="([^"]*)"/);
        const altMatch = match[0].match(/alt="([^"]*)"/);
        const alignMatch = match[0].match(/data-align="([^"]*)"/);
        const fullwidthMatch = match[0].match(/data-fullwidth="([^"]*)"/);
        
        const imageData = {
          src: srcMatch?.[1] || '',
          alt: altMatch?.[1] || '',
          align: alignMatch?.[1] || 'center',
          fullwidth: fullwidthMatch?.[1] === 'true'
        };
        
        elements.push(
          <ImageSection key={`img-${elementIndex}`} {...imageData} />
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
      case 'youtube': {
        const url = match[0];
        elements.push(
          <YouTubeEmbed key={`youtube-${elementIndex}`} url={url} />
        );
        break;
      }
    }
    elementIndex++;
    lastIndex = elementEnd;
  }
  
  // Add any remaining markdown content
  if (lastIndex < processedContent.length) {
    const markdownContent = processedContent.slice(lastIndex).trim();
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

// Parse Markdown
const MarkdownSection: React.FC<{ content: string }> = ({ content }) => {
  console.log('📝 MarkdownSection: Starting with content length:', content.length);
  
  // Apply custom syntax processing to the markdown content
  const processedContent = processCustomSyntax(content);
  console.log('📝 MarkdownSection: Applied custom syntax processing');
  
  const processContent = (text: string): React.ReactNode[] => {
    console.log('📝 processContent: Starting with text:', text.substring(0, 100));
    
    const lines = text.split('\n');
    console.log('📝 processContent: Split into', lines.length, 'lines');
    
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    let listType: ListType = null;
    let codeBlock: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';

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

    lines.forEach((line, index) => {
      console.log(`📝 Processing line ${index}:`, line.substring(0, 50));

      // Code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          console.log(`📝 Starting code block at line ${index}`);
          flushList();
          inCodeBlock = true;
          codeLanguage = sanitizeText(line.slice(3).trim());
        } else {
          console.log(`📝 Ending code block at line ${index}`);
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
        codeBlock.push(line);
        return;
      }

      // Headers
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={`h1-${index}`} className="hn-h1">
            {sanitizeText(line.slice(2))}
          </h1>
        );
        return;
      }
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={`h2-${index}`} className="hn-h2">
            {sanitizeText(line.slice(3))}
          </h2>
        );
        return;
      }
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={`h3-${index}`} className="hn-h3">
            {sanitizeText(line.slice(4))}
          </h3>
        );
        return;
      }

      // Lists
      if (line.match(/^\d+\./)) {
        if (listType !== 'ordered') {
          flushList();
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
        if (listType !== 'unordered') {
          flushList();
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
        flushList();
        elements.push(
          <blockquote key={`quote-${index}`} className="hn-blockquote">
            <SecureInlineMarkdown content={sanitizeText(line.slice(2))} />
          </blockquote>
        );
        return;
      }

      // Regular paragraphs
      if (line.trim()) {
        flushList();
        elements.push(
          <p key={`p-${index}`} className="hn-paragraph">
            <SecureInlineMarkdown content={sanitizeText(line)} />
          </p>
        );
      }
    });

    flushList();
    
    console.log('📝 processContent: Generated', elements.length, 'elements');
    return elements;
  };

  const result = processContent(processedContent);
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
    
    switch (section.type) {
      case 'frontmatter':
        return null;
        
      case 'image': {
        const imageData = extractImageData(section.content);
        return <ImageSection key={`image-${section.index}`} {...imageData} />;
      }
      
      case 'callout': {
        const calloutData = extractCalloutData(section.content);
        return <CalloutSection key={`callout-${section.index}`} type={calloutData.type} content={calloutData.content} />;
      }
      
      case 'card': {
        const cardData = parseCard(section.content);
        return <CardSection key={`card-${section.index}`} card={cardData} />;
      }
      
      case 'cardgroup': {
        const { cols, cards } = parseCardGroup(section.content);
        console.log('🃏 Rendering CardGroupSection with data:', { cols, cardCount: cards.length });
        return <CardGroupSection key={`cardgroup-${section.index}`} cols={cols || 2} cards={cards} />;
      }
      
      case 'steps': {
        const steps = parseSteps(section.content);
        console.log('👣 Rendering StepsSection with data:', { count: steps.length });
        return <StepsSection key={`steps-${section.index}`} steps={steps} />;
      }
      
      case 'youtube': {
        // Extract YouTube URL from content
        const urlMatch = section.content.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#\s]+)/);
        if (urlMatch) {
          return <YouTubeEmbed key={`youtube-${section.index}`} url={urlMatch[0]} />;
        }
        return null;
      }
      
      case 'mixed': {
        console.log('🔀 Rendering MixedContentSection');
        return <MixedContentSection key={`mixed-${section.index}`} content={section.content} />;
      }
        
      case 'markdown':
        console.log('📝 Rendering markdown section');
        return (
          <div key={`markdown-${section.index}`} className="hn-markdown-section">
            <MarkdownSection content={section.content} />
          </div>
        );
        
      default:
        console.log('⚠️ Unhandled section type:', section.type);
        return (
          <div key={`default-${section.index}`} className="hn-markdown-section">
            <MarkdownSection content={section.content} />
          </div>
        );
    }
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
