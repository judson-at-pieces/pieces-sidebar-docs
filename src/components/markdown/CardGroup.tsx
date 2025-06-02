
import React from 'react';
import { cn } from '@/lib/utils';

interface CardGroupProps {
  cols?: string;
  children?: React.ReactNode;
  className?: string;
}

export function CardGroup({ cols = '2', children, className }: CardGroupProps) {
  const getGridCols = (cols: string) => {
    switch (cols) {
      case '1':
        return 'grid-cols-1';
      case '2':
        return 'grid-cols-1 sm:grid-cols-2';
      case '3':
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case '4':
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case '5':
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
      case '6':
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';
      default:
        return 'grid-cols-1 sm:grid-cols-2';
    }
  };

  return (
    <div className={cn(
      "grid gap-3 my-4",
      getGridCols(cols),
      "auto-rows-fr",
      className
    )}>
      {React.Children.map(children, (child, index) => (
        <div 
          key={index}
          className="h-full"
        >
          {child}
        </div>
      ))}
    </div>
  );
}
