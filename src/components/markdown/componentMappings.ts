
import React from 'react';
import { Image } from './Image';
import { Callout } from './Callout';
import { MarkdownCard } from './MarkdownCard';
import { CardGroup } from './CardGroup';
import { Steps, Step } from './Steps';
import { Button } from './Button';
import { Accordion } from './Accordion';
import { AccordionGroup } from './AccordionGroup';
import { CodeBlock } from './CodeBlock';

export const createComponentMappings = () => {
  console.log('🔧 Creating component mappings with Image support');
  
  return {
    // Standard HTML elements
    img: ({ src, alt, ...props }: any) => {
      console.log('🖼️ Standard img element:', { src, alt });
      return <Image src={src} alt={alt} {...props} />;
    },
    
    // Custom components
    Image: ({ src, alt, align = 'center', fullwidth = false, ...props }: any) => {
      console.log('🖼️ Custom Image component:', { src, alt, align, fullwidth });
      return <Image src={src} alt={alt} align={align} fullwidth={fullwidth === 'true' || fullwidth === true} {...props} />;
    },
    
    Callout: ({ type = 'info', children, ...props }: any) => {
      return <Callout type={type} {...props}>{children}</Callout>;
    },
    
    Card: ({ title, image, children, ...props }: any) => {
      return <MarkdownCard title={title} image={image} {...props}>{children}</MarkdownCard>;
    },
    
    CardGroup: ({ cols = 2, children, ...props }: any) => {
      return <CardGroup cols={cols} {...props}>{children}</CardGroup>;
    },
    
    Steps: ({ children, ...props }: any) => {
      return <Steps {...props}>{children}</Steps>;
    },
    
    Step: ({ title, children, ...props }: any) => {
      return <Step title={title} {...props}>{children}</Step>;
    },
    
    Button: ({ label, linkHref, openLinkInNewTab, align, ...props }: any) => {
      return <Button label={label} linkHref={linkHref} openLinkInNewTab={openLinkInNewTab} align={align} {...props} />;
    },
    
    Accordion: ({ title, children, ...props }: any) => {
      return <Accordion title={title} {...props}>{children}</Accordion>;
    },
    
    AccordionGroup: ({ children, ...props }: any) => {
      return <AccordionGroup {...props}>{children}</AccordionGroup>;
    },
    
    // Code blocks
    code: ({ className, children, ...props }: any) => {
      const language = className?.replace('language-', '') || '';
      if (language) {
        return <CodeBlock language={language} {...props}>{children}</CodeBlock>;
      }
      return <code className="inline-code" {...props}>{children}</code>;
    },
    
    pre: ({ children, ...props }: any) => {
      return <pre {...props}>{children}</pre>;
    }
  };
};
