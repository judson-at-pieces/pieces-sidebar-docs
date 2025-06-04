import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="my-4 border border-slate-200 rounded-xl overflow-hidden dark:border-slate-800/80">
      <div
        role="button"
        data-state={isOpen ? 'open' : 'closed'}
        aria-expanded={isOpen}
        className="w-full px-5 py-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
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
};

export default Accordion;