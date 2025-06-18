
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
      
      // Extract attributes with multiple quote style patterns
      const titleMatch = attributes.match(/title=["']([^"']*)["']/);
      const imageMatch = attributes.match(/image=["']([^"']*)["']/);
      const hrefMatch = attributes.match(/href=["']([^"']*)["']/);
      const externalMatch = attributes.match(/external=["']([^"']*)["']/);
      
      const title = titleMatch ? titleMatch[1] : '';
      const image = imageMatch ? imageMatch[1] : '';
      const href = hrefMatch ? hrefMatch[1] : '';
      const external = externalMatch ? externalMatch[1] : '';
      
      console.log('🃏 CardGroup: Extracted attributes:', { title, image, href, external });
      
      // Use ONLY the original href/external from markdown - no fallbacks
      const finalHref = href || external || '';
      
      console.log('🃏 CardGroup: Final href decision:', { original_href: href, original_external: external, final: finalHref });
      
      cards.push({
        title,
        image,
        href: finalHref,
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
            key={index}
            title={card.title}
            image={card.image}
            href={card.href}
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
          
          console.log('🃏 CardGroup: Using href from React element:', { original: href, final: href });
          
          cards.push({
            title,
            image,
            href: href, // Use original href only, no fallbacks
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
          key={index}
          title={card.title}
          image={card.image}
          href={card.href}
        >
          {card.children}
        </MarkdownCard>
      ))}
    </div>
  );
};

export default CardGroup;
