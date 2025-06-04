import React from 'react';

interface HorizontalRuleProps {
  className?: string;
}

const HorizontalRule: React.FC<HorizontalRuleProps> = ({ className = '' }) => {
  return (
    <hr className={`my-8 border-slate-200 dark:border-slate-800/80 ${className}`} />
  );
};

export default HorizontalRule;