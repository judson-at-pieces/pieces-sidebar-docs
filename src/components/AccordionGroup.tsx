
import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isOpen, onToggle }) => (
  <div className="accordion-item group" data-state={isOpen ? 'open' : 'closed'}>
    <div
      role="button"
      data-state={isOpen ? 'open' : 'closed'}
      aria-expanded={isOpen}
      className="w-full px-5 py-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
      onClick={onToggle}
    >
      <div className="mt-0.5">
        {isOpen ? (
          <ChevronDown size={16} className="text-slate-600 dark:text-slate-400" />
        ) : (
          <ChevronRight size={16} className="text-slate-600 dark:text-slate-400" />
        )}
      </div>
      <div className="font-medium text-base text-slate-700 dark:text-slate-200">
        {title}
      </div>
    </div>
    {isOpen && (
      <div
        role="region"
        aria-labelledby="accordion-trigger"
        className="px-6 py-4 text-base text-slate-600 dark:text-slate-300"
      >
        {children}
      </div>
    )}
  </div>
);

interface AccordionGroupProps {
  children: React.ReactNode;
  allowMultiple?: boolean;
}

const AccordionGroup: React.FC<AccordionGroupProps> = ({ children, allowMultiple = false }) => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    
    if (allowMultiple) {
      if (newOpenItems.has(index)) {
        newOpenItems.delete(index);
      } else {
        newOpenItems.add(index);
      }
    } else {
      if (newOpenItems.has(index)) {
        newOpenItems.clear();
      } else {
        newOpenItems.clear();
        newOpenItems.add(index);
      }
    }
    
    setOpenItems(newOpenItems);
  };

  return (
    <div className="my-4 border border-slate-200 rounded-xl overflow-hidden [&>.accordion-item]:border-b [&>.accordion-item]:border-b-slate-200 dark:[&>.accordion-item]:border-b-slate-800/80 [&>.accordion-item:last-of-type]:border-b-0 dark:border-slate-800/80">
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && child.type === AccordionItem) {
          return React.cloneElement(child, {
            ...child.props,
            isOpen: openItems.has(index),
            onToggle: () => toggleItem(index),
          });
        }
        
        // If it's an Accordion component with title prop, convert it to AccordionItem
        if (React.isValidElement(child) && typeof child.props === 'object' && child.props && 'title' in child.props) {
          const props = child.props as { title: string; children: React.ReactNode };
          return (
            <AccordionItem
              key={index}
              title={props.title}
              isOpen={openItems.has(index)}
              onToggle={() => toggleItem(index)}
            >
              {props.children}
            </AccordionItem>
          );
        }
        
        return child;
      })}
    </div>
  );
};

// Export both for flexibility
export { AccordionItem };
export default AccordionGroup;
