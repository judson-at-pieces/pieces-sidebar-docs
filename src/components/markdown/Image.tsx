import React from 'react';
import { ExpandableImage } from './ExpandableImage';

interface ImageProps {
  src: string;
  alt?: string;
  caption?: string;
  align?: 'left' | 'center' | 'right';
  fullwidth?: string | boolean;
  title?: string;
}

export function Image({ src, alt = '', caption = '', align = 'left', fullwidth, title }: ImageProps) {
  // Use ExpandableImage for the actual image rendering
  const imageElement = <ExpandableImage src={src} alt={alt || title || ''} caption={caption || title || ''} />;
  
  // Handle alignment and full width
  if (fullwidth === 'true' || fullwidth === true) {
    return (
      <div className="w-full my-4">
        {imageElement}
      </div>
    );
  }
  
  const alignmentClass = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto'
  }[align];
  
  return (
    <div className={`my-4 ${alignmentClass}`}>
      {imageElement}
    </div>
  );
}