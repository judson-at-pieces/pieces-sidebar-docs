
import React from 'react';

interface NewTabProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const NewTab: React.FC<NewTabProps> = ({ href, children, className = '' }) => {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`text-blue-600 hover:text-blue-800 underline underline-offset-4 ${className}`}
    >
      {children}
    </a>
  );
};

export default NewTab;
