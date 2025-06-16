
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Callout } from './Callout';
import { MarkdownCard } from './MarkdownCard';
import { CardGroup } from './CardGroup';
import { Steps, Step } from './Steps';
import { Image } from './Image';
import { ExpandableImage } from './ExpandableImage';
import { CodeBlock } from './CodeBlock';
import { createDynamicComponentMap } from './DynamicComponentMap';
import { processCustomSyntax } from './customSyntaxProcessor';
import { X } from 'lucide-react';

// Constants
const SECTION_DELIMITER = '***';

interface MarkdownRendererProps {
  content: string;
}

// YouTube embed component
const YouTubeEmbed: React.FC<{ src: string; title?: string }> = ({ src, title }) => {
  console.log('📺 YouTubeEmbed rendering:', { src, title });
  
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
  
  const videoId = getVideoId(src);
  if (!videoId) {
    console.warn('Invalid YouTube URL:', src);
    return <p className="text-red-500">Invalid YouTube URL: {src}</p>;
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

// Embed component that handles YouTube and other embeds
const Embed: React.FC<{ src: string; title?: string }> = ({ src, title }) => {
  console.log('🎬 Embed component rendering:', { src, title });
  
  // Check if it's a YouTube URL
  if (src.includes('youtube.com') || src.includes('youtu.be')) {
    return <YouTubeEmbed src={src} title={title} />;
  }
  
  // For other embeds, use iframe
  return (
    <div className="my-6">
      <div className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden bg-muted">
        <iframe
          src={src}
          title={title || 'Embedded content'}
          frameBorder="0"
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
      {title && (
        <p className="text-sm text-muted-foreground mt-2 text-center">{title}</p>
      )}
    </div>
  );
};

// Create component mappings for ReactMarkdown
const createComponentMappings = () => {
  const dynamicMap = createDynamicComponentMap();
  
  return {
    ...dynamicMap,
    // Override with our custom components
    Callout: ({ type = 'info', title, children, ...props }: any) => {
      console.log('💬 Callout component rendering:', { type, title });
      return (
        <Callout type={type as 'info' | 'tip' | 'alert'} title={title}>
          {children}
        </Callout>
      );
    },
    Card: ({ title, image, href, external, icon, children, ...props }: any) => {
      console.log('🎯 Card component rendering:', { title, image, href, external, icon });
      return (
        <MarkdownCard title={title} image={image} href={href} external={external} icon={icon} {...props}>
          {children}
        </MarkdownCard>
      );
    },
    CardGroup: ({ cols = 2, children, ...props }: any) => {
      console.log('🃏 CardGroup component rendering:', { cols, childrenCount: React.Children.count(children) });
      return (
        <CardGroup cols={cols} {...props}>
          {children}
        </CardGroup>
      );
    },
    Steps: ({ children, ...props }: any) => {
      console.log('👣 Steps component rendering:', { childrenCount: React.Children.count(children) });
      return (
        <Steps {...props}>
          {children}
        </Steps>
      );
    },
    Step: ({ title, children, ...props }: any) => {
      console.log('🦶 Step component rendering:', { title });
      return (
        <Step title={title} {...props}>
          {children}
        </Step>
      );
    },
    Image: ({ src, alt, align = 'center', fullwidth = 'false', ...props }: any) => {
      console.log('🖼️ Image component rendering:', { src, alt, align, fullwidth });
      return (
        <Image 
          src={src} 
          alt={alt} 
          align={align} 
          fullwidth={fullwidth === 'true'} 
          {...props} 
        />
      );
    },
    ExpandableImage: ({ src, alt, caption, ...props }: any) => {
      console.log('🔍 ExpandableImage component rendering:', { src, alt, caption });
      return (
        <ExpandableImage src={src} alt={alt} caption={caption} {...props} />
      );
    },
    Embed: ({ src, title, ...props }: any) => {
      console.log('🎬 Embed component rendering:', { src, title });
      return <Embed src={src} title={title} {...props} />;
    },
    // Code blocks
    code: ({ inline, className, children, ...props }: any) => {
      if (inline) {
        return (
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold" {...props}>
            {children}
          </code>
        );
      }
      return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
    },
    pre: ({ children, ...props }: any) => {
      // If the child is already a CodeBlock, don't wrap it in another pre
      if (React.isValidElement(children) && children.type === CodeBlock) {
        return children;
      }
      return <pre className="rounded-md border bg-secondary text-sm text-secondary-foreground" {...props}>{children}</pre>;
    },
  };
};

// Parse sections based on *** delimiter
const parseSections = (text: string): string[] => {
  console.log('🔍 parseSections: Input text length:', text.length);
  
  const sections = text.split(SECTION_DELIMITER).map(section => section.trim()).filter(Boolean);
  console.log('🔍 parseSections: Split into', sections.length, 'sections');
  
  return sections;
};

// Main component
const HashnodeMarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  console.log('🚀 HashnodeMarkdownRenderer processing content length:', content.length);
  
  // Apply custom syntax processing first
  const processedContent = processCustomSyntax(content);
  console.log('🚀 Applied custom syntax processing');
  
  // Split into sections
  const sections = parseSections(processedContent);
  console.log('🚀 Parsed sections:', sections.length);
  
  // Create component mappings
  const components = createComponentMappings();
  
  return (
    <div className="hn-markdown-renderer">
      {sections.map((section, index) => {
        // Skip frontmatter sections
        if (section.startsWith('---') && section.includes('title:')) {
          console.log(`🚀 Skipping frontmatter section ${index}`);
          return null;
        }
        
        console.log(`🚀 Rendering section ${index} with length:`, section.length);
        
        return (
          <div key={`section-${index}`} className="hn-markdown-section">
            <ReactMarkdown
              components={components}
              skipHtml={false}
            >
              {section}
            </ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
};

export default HashnodeMarkdownRenderer;
