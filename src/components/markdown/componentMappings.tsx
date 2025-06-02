import React from 'react';
import { Callout } from './Callout';
import { Card } from './Card';
import { CardGroup } from './CardGroup';
import { Steps } from './Steps';
import { ExpandableImage } from './ExpandableImage';
import { CustomTable } from './CustomTable';
import { Image } from './Image';
import { GlossaryAll } from './GlossaryAll';
import { PiecesCloudModels } from './PiecesCloudModels';
import { PiecesLocalModels } from './PiecesLocalModels';

export function createComponentMappings() {
  return {
    // Handle card components with preserved markdown
    div: ({ children, ...props }: any) => {
      // Handle card components with preserved markdown content
      if (props['data-card-component'] === 'true') {
        const title = props['data-title'] || '';
        const image = props['data-image'] || '';
        const href = props['data-href'] || '';
        const external = props['data-external'] || '';
        const icon = props['data-icon'] || '';
        
        // Pass the raw markdown content to Card component for proper processing
        return (
          <Card
            title={title}
            image={image}
            href={href}
            external={external}
            icon={icon}
          >
            {children}
          </Card>
        );
      }
      
      // Handle regular cards
      if (props['data-card'] === 'true') {
        const title = props['data-title'] || '';
        const image = props['data-image'] || '';
        const href = props['data-href'] || '';
        const external = props['data-external'] || '';
        const icon = props['data-icon'] || '';
        
        return (
          <Card
            title={title}
            image={image}
            href={href}
            external={external}
            icon={icon}
          >
            {children}
          </Card>
        );
      }
      
      // Handle card groups
      if (props['data-cardgroup'] === 'true') {
        const cols = parseInt(props['data-cols'] || '2', 10);
        return <CardGroup cols={cols}>{children}</CardGroup>;
      }
      
      // Handle callouts
      if (props['data-callout']) {
        const type = props['data-callout'];
        const title = props['data-title'] || '';
        
        return (
          <Callout type={type} title={title}>
            {children}
          </Callout>
        );
      }
      
      // Handle steps
      if (props['data-steps'] === 'true') {
        return <Steps>{children}</Steps>;
      }
      
      // Handle individual step
      if (props['data-step']) {
        const stepNumber = parseInt(props['data-step'], 10);
        const stepTitle = props['data-step-title'] || '';
        
        return (
          <div className="step-item flex gap-4 mb-6">
            <div className="step-number flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              {stepNumber}
            </div>
            <div className="step-content flex-1">
              {stepTitle && (
                <h3 className="font-semibold text-lg mb-2">{stepTitle}</h3>
              )}
              <div className="prose prose-sm max-w-none">{children}</div>
            </div>
          </div>
        );
      }
      
      // Default div behavior
      return <div {...props}>{children}</div>;
    },
    
    // Handle images with captions
    img: ({ src, alt, ...props }: any) => {
      const caption = props['data-caption'];
      
      if (caption) {
        return <ExpandableImage src={src} alt={alt} caption={caption} />;
      }
      
      return <Image src={src} alt={alt} {...props} />;
    },
    
    // Handle tables
    table: ({ children, ...props }: any) => {
      return <CustomTable>{children}</CustomTable>;
    },
    
    // Special components
    GlossaryAll: () => <GlossaryAll />,
    PiecesCloudModels: () => <PiecesCloudModels />,
    PiecesLocalModels: () => <PiecesLocalModels />,
    
    // Handle links properly
    a: ({ href, children, ...props }: any) => {
      const isExternal = href?.startsWith('http');
      
      return (
        <a
          href={href}
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 underline hover:no-underline"
          {...props}
        >
          {children}
        </a>
      );
    },
  };
}
