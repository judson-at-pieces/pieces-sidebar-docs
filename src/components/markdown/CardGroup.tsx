
import React from 'react';

interface CardGroupProps {
  cols?: 2 | 3 | 4;
  children: React.ReactNode;
}

const CardGroup: React.FC<CardGroupProps> = ({ cols = 2, children }) => {
  console.log('🃏 CardGroup rendering:', { 
    cols, 
    childrenCount: React.Children.count(children),
    children: React.Children.toArray(children).map((child, index) => ({
      index,
      type: React.isValidElement(child) ? child.type : typeof child,
      props: React.isValidElement(child) ? Object.keys(child.props || {}) : 'not-element'
    }))
  });

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
      {React.Children.map(children, (child, index) => {
        console.log(`🃏 CardGroup processing child ${index}:`, {
          type: React.isValidElement(child) ? child.type : typeof child,
          isValidElement: React.isValidElement(child),
          hasProps: React.isValidElement(child) && child.props
        });
        
        // Safety check for valid React elements
        if (!React.isValidElement(child)) {
          console.warn(`CardGroup child ${index} is not a valid React element:`, child);
          return null;
        }
        
        try {
          return React.cloneElement(child, {
            ...child.props,
            className: `${child.props.className || ''} my-2`.trim(),
          });
        } catch (error) {
          console.error(`Error cloning child ${index}:`, error);
          return child; // Fallback to original child
        }
      })}
    </div>
  );
};

export default CardGroup;

// Export named export for compatibility
export { CardGroup };
