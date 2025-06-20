
import React from 'react';
import { MarkdownCard } from './MarkdownCard';

interface Card {
  title: string;
  image?: string;
  href?: string;
  content?: string;
}

interface DynamicCardGroupProps {
  cols?: number;
  cards: Card[];
}

export const DynamicCardGroup: React.FC<DynamicCardGroupProps> = ({ cols = 2, cards }) => {
  console.log('DynamicCardGroup render:', { cols, cards });

  const gridClass = cols === 1 ? 'grid-cols-1' : 
                   cols === 2 ? 'grid-cols-1 md:grid-cols-2' :
                   cols === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                   cols === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
                   'grid-cols-1 md:grid-cols-2';

  return (
    <div className={`grid ${gridClass} gap-6 my-8`}>
      {cards.map((card, index) => {
        console.log('DynamicCardGroup: Rendering card:', card);
        return (
          <MarkdownCard
            key={index}
            title={card.title}
            image={card.image}
            href={card.href}
          >
            {card.content}
          </MarkdownCard>
        );
      })}
    </div>
  );
};

export default DynamicCardGroup;
