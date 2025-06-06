
import React, { useState, useEffect } from 'react';
import { ImageModal } from './ImageModal';
import { Loader2, ImageOff, RotateCw } from 'lucide-react';

interface ExpandableImageProps {
  src?: string;
  alt?: string;
  caption?: string;
  className?: string;
}

export function ExpandableImage({ src, alt, caption, className, ...props }: ExpandableImageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset states when src changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [src, alt, caption]);
  
  // Handle stuck loading states
  useEffect(() => {
    if (!src) return;
    
    const timeout = setTimeout(() => {
      if (!imageLoaded && !imageError) {
        setImageLoaded(true);
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [src, imageLoaded, imageError]);

  if (!src) {
    return null;
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    setImageLoaded(false);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleRetry = () => {
    setImageError(false);
    setImageLoaded(false);
  };

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Use caption from props if available, otherwise use alt text
  const displayCaption = caption || alt || '';

  return (
    <>
      <figure className={`my-6 ${className || ''}`}>
        {imageError ? (
          <div className="rounded-lg border-2 border-dashed border-destructive/30 dark:border-destructive/50 bg-destructive/5 dark:bg-destructive/10 p-8 text-center transition-all duration-300">
            <ImageOff className="w-12 h-12 mx-auto mb-3 text-destructive/60" />
            <div className="text-destructive dark:text-destructive-foreground font-medium mb-2">Failed to load image</div>
            <div className="text-xs text-muted-foreground break-all mb-4 max-w-sm mx-auto">{src}</div>
            <button 
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:text-primary/80 border border-primary/20 hover:border-primary/40 rounded-md transition-all duration-200 hover:shadow-sm"
            >
              <RotateCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        ) : (
          <div className="relative group">
            {!imageLoaded && !imageError && (
              <div className="rounded-lg bg-muted/50 dark:bg-muted/20 h-64 flex items-center justify-center transition-all duration-300">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">Loading image...</div>
                </div>
              </div>
            )}
            <img
              src={src}
              alt={alt || ''}
              className={`rounded-lg cursor-pointer max-w-full h-auto transition-all duration-300 ${
                imageLoaded ? 'block shadow-md hover:shadow-xl group-hover:scale-[1.02]' : 'absolute opacity-0 pointer-events-none'
              }`}
              onClick={handleImageClick}
              onError={handleImageError}
              onLoad={handleImageLoad}
              {...props}
            />
            {imageLoaded && (
              <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-all duration-300 pointer-events-none" />
            )}
          </div>
        )}
        {displayCaption && (
          <figcaption className="mt-3 text-sm text-muted-foreground text-center italic">
            {displayCaption}
          </figcaption>
        )}
      </figure>
      
      <ImageModal
        src={src}
        alt={displayCaption}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
