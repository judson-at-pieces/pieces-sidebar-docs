
import React from 'react';

interface CardGroupProps {
  cols?: 2 | 3 | 4;
  children: React.ReactNode;
}

const CardGroup: React.FC<CardGroupProps> = ({ cols = 2, children }) => {
  const getGridClass = () => {
    switch (cols) {
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      default:
        return 'grid-cols-1 sm:grid-cols-2';
    }
  };

  return (
    <div className={`my-4 grid gap-x-4 gap-y-6 ${getGridClass()}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            className: `${child.props.className || ''} my-2`.trim(),
          });
        }
        return child;
      })}
    </div>
  );
};

export default CardGroup;

// Export named export for compatibility
export { CardGroup };
