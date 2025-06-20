
import React from 'react';
import { CardGroup } from './CardGroup';

interface DynamicCardGroupProps {
  cols?: 2 | 3 | 4;
  children: React.ReactNode;
}

const DynamicCardGroup: React.FC<DynamicCardGroupProps> = ({ cols = 2, children }) => {
  console.log('🎯 DynamicCardGroup rendering:', { 
    cols, 
    childrenCount: React.Children.count(children),
    children: React.Children.toArray(children).map((child, index) => ({
      index,
      type: React.isValidElement(child) ? child.type : typeof child,
      props: React.isValidElement(child) ? Object.keys(child.props) : 'not-element'
    }))
  });

  // Prevent duplicate rendering by checking if we've already processed this content
  const processedChildren = React.useMemo(() => {
    return React.Children.toArray(children).filter((child, index, array) => {
      // Remove duplicates by checking if this exact child appears earlier in the array
      const firstIndex = array.findIndex(item => 
        React.isValidElement(item) && 
        React.isValidElement(child) && 
        item.type === child.type &&
        JSON.stringify(item.props) === JSON.stringify(child.props)
      );
      return firstIndex === index;
    });
  }, [children]);

  console.log('🎯 DynamicCardGroup after deduplication:', { 
    originalCount: React.Children.count(children),
    processedCount: processedChildren.length
  });

  return (
    <CardGroup cols={cols}>
      {processedChildren}
    </CardGroup>
  );
};

export default DynamicCardGroup;
export { DynamicCardGroup };
