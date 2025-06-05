
import React from 'react';

interface ImageProps {
  src: string;
  alt?: string;
  align?: 'left' | 'center' | 'right';
  fullwidth?: boolean;
  loading?: 'lazy' | 'eager';
}

const Image: React.FC<ImageProps> = ({
  src,
  alt = '',
  align = 'center',
  fullwidth = false,
  loading = 'lazy',
}) => {
  const getAlignmentClass = () => {
    switch (align) {
      case 'left':
        return 'justify-start';
      case 'right':
        return 'justify-end';
      default:
        return 'justify-center';
    }
  };

  const getImageClass = () => {
    if (fullwidth) {
      return 'w-full h-auto rounded-lg';
    }
    return 'max-w-full h-auto rounded-lg';
  };

  return (
    <div className={`flex my-4 not-prose [&>_img]:!rounded-lg ${getAlignmentClass()}`}>
      <img
        src={src}
        alt={alt}
        className={getImageClass()}
        loading={loading}
        decoding="async"
      />
    </div>
  );
};

export default Image;
