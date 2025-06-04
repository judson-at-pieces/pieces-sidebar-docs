import React from 'react';

interface CardProps {
  title: string;
  image?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, image, children }) => {
  return (
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
        {children}
      </div>
    </div>
  );
};

export default Card;