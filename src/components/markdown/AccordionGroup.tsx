import React, { useState, ReactNode } from 'react';

interface AccordionGroupProps {
  children: ReactNode;
  allowMultiple?: boolean;
}

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

export default function AccordionGroup({ children, allowMultiple = false }: AccordionGroupProps) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const handleToggle = (index: number) => {
    if (allowMultiple) {
      if (openItems.includes(index)) {
        setOpenItems(openItems.filter(item => item !== index));
      } else {
        setOpenItems([...openItems, index]);
      }
    } else {
      setOpenItems(openItems.includes(index) ? [] : [index]);
    }
  };

  return (
    <div className="space-y-2 border border-border rounded-lg overflow-hidden">
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && child.type === AccordionItem) {
          const childProps = child.props as AccordionItemProps;
          return React.cloneElement(child, {
            isOpen: openItems.includes(index),
            onToggle: () => handleToggle(index),
            title: childProps.title,
            children: childProps.children
          });
        }
        return child;
      })}
    </div>
  );
}

export function AccordionItem({ title, children, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border-b border-border">
      <button
        className="flex items-center justify-between w-full p-4 text-sm font-medium text-left focus:outline-none"
        onClick={onToggle}
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}
