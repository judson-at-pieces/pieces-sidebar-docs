
import React from 'react';

interface CardGroupProps {
  cols?: string;
  children?: React.ReactNode;
}

export function CardGroup({ cols = '1', children }: CardGroupProps) {
  const getGridCols = (cols: string) => {
    switch (cols) {
      case '1':
        return 'grid-cols-1';
      case '2':
        return 'grid-cols-1 md:grid-cols-2';
      case '3':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case '4':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      default:
        return 'grid-cols-1 md:grid-cols-2';
    }
  };

  return (
    <div className={`grid gap-6 my-6 ${getGridCols(cols)}`}>
      {children}
    </div>
  );
}
