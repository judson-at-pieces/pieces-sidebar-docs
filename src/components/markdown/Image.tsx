
import React from 'react';

interface ImageProps {
  src: string;
  alt?: string;
  align?: 'left' | 'center' | 'right';
  fullwidth?: boolean;
  className?: string;
}

export const Image: React.FC<ImageProps> = ({ 
  src, 
  alt = '', 
  align = 'center', 
  fullwidth = false,
  className = ''
}) => {
  console.log('🖼️ Image component rendering:', { src, alt, align, fullwidth });
  
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center', 
    right: 'text-right'
  }[align];
  
  const widthClass = fullwidth ? 'w-full' : 'max-w-full';
  
  return (
    <div className={`hn-image-container ${alignmentClass} my-6`}>
      <img 
        src={src} 
        alt={alt}
        className={`hn-image ${widthClass} h-auto rounded-lg ${className}`}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};
