
import React from 'react';

interface ImageProps {
  src: string;
  alt: string;
  align?: 'left' | 'center' | 'right';
  fullwidth?: boolean;
}

export const Image: React.FC<ImageProps> = ({ 
  src, 
  alt, 
  align = 'center', 
  fullwidth = false 
}) => {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[align];

  return (
    <div className={`my-6 ${alignClass}`}>
      <img 
        src={src} 
        alt={alt} 
        className={`${fullwidth ? 'w-full' : 'max-w-full'} h-auto rounded-lg`}
        loading="lazy"
      />
    </div>
  );
};
