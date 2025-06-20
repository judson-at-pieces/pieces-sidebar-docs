
import React from 'react';
import { processInlineMarkdown, sanitizeText } from '../../utils/secureMarkdownProcessor';

interface CardProps {
  title: string;
  image?: string;
  href?: string;
  children: React.ReactNode;
}

const renderInlineMarkdown = (content: string) => {
  const elements = processInlineMarkdown(content);
  return elements.map((element, index) => {
    switch (element.type) {
      case 'bold':
        return <strong key={index} className="font-semibold">{sanitizeText(element.content)}</strong>;
      case 'italic':
        return <em key={index} className="italic">{sanitizeText(element.content)}</em>;
      case 'code':
        return <code key={index} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{sanitizeText(element.content)}</code>;
      case 'link':
        return (
          <a 
            key={index} 
            href={element.href} 
            target={element.target}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {sanitizeText(element.content)}
          </a>
        );
      case 'image':
        return (
          <img 
            key={index} 
            src={element.src} 
            alt={element.alt} 
            className="inline-block max-w-full h-auto"
          />
        );
      case 'text':
      default:
        return <span key={index}>{sanitizeText(element.content)}</span>;
    }
  });
};

const Card: React.FC<CardProps> = ({ title, image, href, children }) => {
  const cardContent = (
    <div className="p-6 my-4 border rounded-xl dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      {image && (
        <div className="w-10 h-10 mb-6 relative rounded-lg">
          <img
            src={image}
            alt={title}
            loading="lazy"
            decoding="async"
            className="rounded-lg object-cover"
            style={{
              position: 'absolute',
              height: '100%',
              width: '100%',
              left: 0,
              top: 0,
            }}
          />
        </div>
      )}
      <span className="block text-base font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </span>
      <div className="mt-3 text-base text-slate-600 dark:text-slate-300">
        {typeof children === 'string' ? (
          renderInlineMarkdown(children)
        ) : (
          children
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block no-underline hover:no-underline"
      >
        {cardContent}
      </a>
    );
  }

  return cardContent;
};

export default Card;
