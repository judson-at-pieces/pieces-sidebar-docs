
import React from 'react';

interface CardGroupProps {
  children: React.ReactNode;
  cols?: number;
}

export const CardGroup: React.FC<CardGroupProps> = ({ children, cols = 2 }) => {
  const gridClass = cols === 3 ? 'md:grid-cols-3' : cols === 4 ? 'md:grid-cols-4' : 'md:grid-cols-2';
  
  return (
    <div className={`grid grid-cols-1 ${gridClass} gap-4 my-6`}>
      {children}
    </div>
  );
};
