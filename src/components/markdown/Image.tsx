
import React from 'react';

interface ImageProps {
  src: string;
  alt?: string;
  align?: 'left' | 'center' | 'right';
  fullwidth?: boolean;
  loading?: 'lazy' | 'eager';
}

export const Image: React.FC<ImageProps> = ({ 
  src, 
  alt = '', 
  align = 'center', 
  fullwidth = false, 
  loading = 'lazy' 
}) => {
  const alignmentClass = align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : 'mr-auto';
  const widthClass = fullwidth ? 'w-full' : 'max-w-full';

  return (
    <div className={`my-4 ${alignmentClass}`}>
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        className={`${widthClass} h-auto rounded-lg shadow-sm`}
      />
    </div>
  );
};
