
import React from 'react';
import { Image } from './Image';

interface ExpandableImageProps {
  src: string;
  alt?: string;
  align?: 'left' | 'center' | 'right';
  fullwidth?: boolean;
  loading?: 'lazy' | 'eager';
}

export const ExpandableImage: React.FC<ExpandableImageProps> = (props) => {
  return <Image {...props} />;
};
