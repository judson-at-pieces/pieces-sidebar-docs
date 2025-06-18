
import React from 'react';
import { MarkdownCard } from './MarkdownCard';

interface CardGroupProps {
  cols?: number;
  children: React.ReactNode;
}

export const CardGroup: React.FC<CardGroupProps> = ({ cols = 2, children }) => {
  console.log('🃏 CardGroup render - RAW children:', children);
  console.log('🃏 CardGroup render - children type:', typeof children);
  
  // Handle string children (from markdown processing)
  if (typeof children === 'string') {
    console.log('🃏 CardGroup: Processing string children');
    const cardRegex = /<Card\s+([^>]*?)>([\s\S]*?)<\/Card>/g;
    const cards: any[] = [];
    
    let match: RegExpExecArray | null;
    while ((match = cardRegex.exec(children)) !== null) {
      const attributes = match[1];
      const innerContent = match[2].trim();
      
      console.log('🃏 CardGroup: Raw attributes string:', attributes);
      console.log('🃏 CardGroup: Inner content:', innerContent);
      
      // More flexible attribute extraction - handle optional attributes
      const extractAttribute = (attrName: string) => {
        const regex = new RegExp(`${attrName}\\s*=\\s*["']([^"']*)["']`, 'i');
        const match = attributes.match(regex);
        return match ? match[1] : '';
      };
      
      const title = extractAttribute('title');
      const image = extractAttribute('image');
      const href = extractAttribute('href');
      const target = extractAttribute('target');
      const external = extractAttribute('external');
      
      console.log('🃏 CardGroup: Extracted attributes:', { title, image, href, target, external });
      
      // Use href first, then external as fallback - but allow empty
      const finalHref = href || external || '';
      // Only set target if there's actually a link
      const finalTarget = finalHref ? (target || '_blank') : '';
      
      console.log('🃏 CardGroup: Final decisions:', { 
        original_href: href, 
        original_external: external, 
        original_target: target,
        final_href: finalHref,
        final_target: finalTarget,
        willBeClickable: !!finalHref
      });
      
      // Always add the card, even if it has no href
      cards.push({
        title,
        image,
        href: finalHref,
        target: finalTarget,
        children: innerContent
      });
    }
    
    console.log('🃏 CardGroup: Total cards parsed from string:', cards.length);
    
    const gridClass = cols === 1 ? 'grid-cols-1' : 
                     cols === 2 ? 'grid-cols-1 md:grid-cols-2' :
                     cols === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                     cols === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
                     'grid-cols-1 md:grid-cols-2';

    return (
      <div className={`grid ${gridClass} gap-6 my-8`}>
        {cards.map((card, index) => (
          <MarkdownCard
            key={`card-${index}`}
            title={card.title}
            image={card.image}
            href={card.href}
            target={card.target}
          >
            {card.children}
          </MarkdownCard>
        ))}
      </div>
    );
  }
  
  // Handle React element children (original logic)
  const parseCards = (children: React.ReactNode): any[] => {
    const cards: any[] = [];
    
    React.Children.forEach(children, (child) => {
      console.log('🃏 CardGroup: Processing child:', child);
      
      if (React.isValidElement(child)) {
        console.log('🃏 CardGroup: Child type:', child.type);
        console.log('🃏 CardGroup: Child props:', child.props);
        
        // Handle both 'Card' string type and MarkdownCard component
        if (child.type === 'Card' || child.type === MarkdownCard || 
            (typeof child.type === 'function' && child.type.name === 'MarkdownCard')) {
          const props = child.props as any;
          console.log('🃏 CardGroup: Found card with props:', props);
          
          const title = props.title || '';
          const image = props.image || '';
          const href = props.href || props.external || '';
          const target = href ? (props.target || '_blank') : '';
          
          console.log('🃏 CardGroup: Using attributes from React element:', { href, target });
          
          cards.push({
            title,
            image,
            href: href,
            target,
            children: props.children || ''
          });
        }
      }
    });
    
    return cards;
  };

  const cards = parseCards(children);
  console.log('🃏 CardGroup: Parsed cards from React children:', cards);

  const gridClass = cols === 1 ? 'grid-cols-1' : 
                   cols === 2 ? 'grid-cols-1 md:grid-cols-2' :
                   cols === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                   cols === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
                   'grid-cols-1 md:grid-cols-2';

  return (
    <div className={`grid ${gridClass} gap-6 my-8`}>
      {cards.map((card, index) => (
        <MarkdownCard
          key={`card-${index}`}
          title={card.title}
          image={card.image}
          href={card.href}
          target={card.target}
        >
          {card.children}
        </MarkdownCard>
      ))}
    </div>
  );
};

export default CardGroup;
