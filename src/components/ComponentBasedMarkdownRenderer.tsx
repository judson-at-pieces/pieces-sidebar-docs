import React from 'react';
// Import all the individual components
import { Callout } from './markdown/Callout';
import { MarkdownCard as Card } from './markdown/MarkdownCard';
import { CardGroup } from './markdown/CardGroup';
import Accordion from './Accordion';
import AccordionGroup from './AccordionGroup';
import Tabs, { TabItem } from './markdown/Tabs';
import Button from './Button';
import { Steps, Step } from './markdown/Steps';
import { CodeBlock } from './markdown/CodeBlock';
import Table from './Table';
import Typography from './Typography';
import { Image } from './markdown/Image';

// Constants
const SECTION_DELIMITER    = '***';
const FRONTMATTER_PATTERN  = '---';
const TITLE_PATTERN        = 'title:';
const IMAGE_PATTERN        = '<Image';
const CARDGROUP_PATTERN    = '<CardGroup';
const CALLOUT_PATTERN      = '<Callout';
const ACCORDION_PATTERN    = '<Accordion';
const ACCORDIONGROUP_PATTERN = '<AccordionGroup';
const TABS_PATTERN         = '<Tabs';
const BUTTON_PATTERN       = '<Button';
const STEPS_PATTERN        = '<Steps';
const CARD_PATTERN         = '<Card';

// Types
type SectionType =
  | 'frontmatter'
  | 'image'
  | 'cardgroup'
  | 'callout'
  | 'accordion'
  | 'accordiongroup'
  | 'tabs'
  | 'button'
  | 'steps'
  | 'card'
  | 'markdown';

interface ParsedSection {
  type: SectionType;
  content: string;
  index: number;
}

interface ComponentBasedMarkdownRendererProps {
  content: string;
}

export function ComponentBasedMarkdownRenderer({ content }: ComponentBasedMarkdownRendererProps) {
  const components = {
    // Constants
    SECTION_DELIMITER: '***',
    FRONTMATTER_PATTERN: '---',
    TITLE_PATTERN: 'title:',
    IMAGE_PATTERN: '<Image',
    CARDGROUP_PATTERN: '<CardGroup',
    CALLOUT_PATTERN: '<Callout',
    ACCORDION_PATTERN: '<Accordion',
    ACCORDIONGROUP_PATTERN: '<AccordionGroup',
    TABS_PATTERN: '<Tabs',
    BUTTON_PATTERN: '<Button',
    STEPS_PATTERN: '<Steps',
    CARD_PATTERN: '<Card',

    // Types
    SectionType: 'frontmatter' | 'image' | 'cardgroup' | 'callout' | 'accordion' | 'accordiongroup' | 'tabs' | 'button' | 'steps' | 'card' | 'markdown',

    // Utility functions
    parseSections: (text: string) => {
      const sections = text.split('***').map(section => section.trim()).filter(Boolean);
      
      return sections.map((section, index) => {
        if (section.startsWith('---') && section.includes('title:')) {
          return { type: 'frontmatter', content: section, index };
        }
        if (section.startsWith('<Image')) {
          return { type: 'image', content: section, index };
        }
        if (section.startsWith('<CardGroup')) {
          return { type: 'cardgroup', content: section, index };
        }
        if (section.startsWith('<AccordionGroup')) {
          return { type: 'accordiongroup', content: section, index };
        }
        if (section.startsWith('<Accordion')) {
          return { type: 'accordion', content: section, index };
        }
        if (section.startsWith('<Tabs')) {
          return { type: 'tabs', content: section, index };
        }
        if (section.startsWith('<Button')) {
          return { type: 'button', content: section, index };
        }
        if (section.startsWith('<Steps')) {
          return { type: 'steps', content: section, index };
        }
        if (section.startsWith('<Card')) {
          return { type: 'card', content: section, index };
        }
        if (section.startsWith('<Callout')) {
          return { type: 'callout', content: section, index };
        }
        return { type: 'markdown', content: section, index };
      });
    },

    // Parser functions
    extractImageData: (content: string) => {
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
    },

    extractCalloutData: (content: string) => {
      const typeMatch = content.match(/type="([^"]*)"/);
      const contentMatch = content.match(/<Callout[^>]*>([\s\S]*?)<\/Callout>/);
      
      return {
        type: typeMatch?.[1] as 'info' | 'tip' | 'alert' || 'info',
        content: contentMatch?.[1]?.trim() || ''
      };
    },

    parseCard: (content: string) => {
      const titleMatch = content.match(/title="([^"]*)"/);
      const imageMatch = content.match(/image="([^"]*)"/);
      const contentMatch = content.match(/<Card[^>]*>([\s\S]*?)<\/Card>/);
      
      return {
        title: titleMatch?.[1] || '',
        image: imageMatch?.[1],
        content: contentMatch?.[1]?.trim() || ''
      };
    },

    parseCardGroup: (content: string) => {
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
    },

    parseAccordion: (content: string) => {
      const titleMatch = content.match(/title="([^"]*)"/);
      const contentMatch = content.match(/<Accordion[^>]*>([\s\S]*?)<\/Accordion>/);
      
      return {
        title: titleMatch?.[1] || '',
        content: contentMatch?.[1]?.trim() || ''
      };
    },

    parseAccordionGroup: (content: string) => {
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
    },

    parseTabs: (content: string) => {
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
    },

    parseButton: (content: string) => {
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
    },

    parseSteps: (content: string) => {
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
    },

    processInlineMarkdown: (text: string): React.ReactNode => {
      // Handle inline code
      text = text.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
      
      // Handle bold with **
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Handle italic with *
      text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
      
      // Handle links
      text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline dark:text-blue-400" target="_blank" rel="noopener noreferrer">$1</a>');
      
      return <span dangerouslySetInnerHTML={{ __html: text }} />;
    },
    
    // Fix the pre/code components
    pre: ({ children, ...props }: any) => (
      <CodeBlock {...props}>{children}</CodeBlock>
    ),
    code: ({ children, ...props }: any) => (
      <code className="relative rounded bg-muted px-1.5 py-0.5 font-mono text-sm font-medium text-foreground" {...props}>
        {children}
      </code>
    ),

    // Fix Image component usage
    img: ({ src, alt, ...props }: any) => (
      <Image src={src} alt={alt} {...props} />
    ),

    // Fix Steps components
    steps: ({ children, ...props }: any) => (
      <Steps {...props}>{children}</Steps>
    ),
    step: ({ title, children, ...props }: any) => (
      <Step title={title} {...props}>{children}</Step>
    ),

    // Fix Tabs components
    tabs: ({ defaultActiveTab, children, ...props }: any) => (
      <Tabs defaultActiveTab={defaultActiveTab} {...props}>{children}</Tabs>
    ),
    tabitem: ({ title, children, ...props }: any) => (
      <TabItem title={title} {...props}>{children}</TabItem>
    ),
  };

  return (
    <ReactMarkdown
      components={components}
      remarkPlugins={[remarkGfm, remarkBreaks, remarkFrontmatter]}
      rehypePlugins={[rehypeRaw]}
      skipHtml={false}
    >
      {content}
    </ReactMarkdown>
  );
}
