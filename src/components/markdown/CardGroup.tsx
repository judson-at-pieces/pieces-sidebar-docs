
import React from 'react';
import { MarkdownCard } from './MarkdownCard';

interface CardGroupProps {
  cols?: number;
  children: React.ReactNode;
}

export const CardGroup: React.FC<CardGroupProps> = ({ cols = 2, children }) => {
  console.log('CardGroup render:', { cols, children });
  
  // Parse Card components from children
  const parseCards = (children: React.ReactNode): any[] => {
    const cards: any[] = [];
    
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && (child.type === 'Card' || child.type === MarkdownCard)) {
        const props = child.props as any;
        console.log('CardGroup: Found card with props:', props);
        cards.push({
          title: props.title || '',
          image: props.image || '',
          href: props.href || '',
          children: props.children || ''
        });
      }
    });
    
    return cards;
  };

  const cards = parseCards(children);
  console.log('CardGroup: Parsed cards:', cards);

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
