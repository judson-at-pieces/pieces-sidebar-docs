
import React, { useState } from 'react';
import { ImageModal } from './ImageModal';

interface ExpandableImageProps {
  src: string;
  alt?: string;
  caption?: string;
  className?: string;
}

export const ExpandableImage: React.FC<ExpandableImageProps> = ({ 
  src, 
  alt = '', 
  caption = '',
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="my-6 text-center">
        <img
          src={src}
          alt={alt}
          className={`max-w-full h-auto cursor-zoom-in rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}
          onClick={handleImageClick}
          loading="lazy"
          decoding="async"
        />
        {caption && (
          <p className="text-sm text-muted-foreground mt-2 italic">{caption}</p>
        )}
      </div>
      
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        src={src}
        alt={alt}
        caption={caption}
      />
    </>
  );
};
