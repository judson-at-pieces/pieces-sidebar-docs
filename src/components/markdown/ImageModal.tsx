
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ImageModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageModal({ src, alt, isOpen, onClose }: ImageModalProps) {
  // Handle escape key and prevent body scroll
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
  
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={onClose}
        />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] p-4 border-0 bg-transparent shadow-none focus:outline-none max-w-[95vw] max-h-[95vh] w-fit h-fit">
          <div className="relative flex items-center justify-center">
            <DialogPrimitive.Close asChild>
              <button
                className="absolute top-2 right-2 z-50 rounded-full bg-black/80 backdrop-blur-sm p-2.5 text-white hover:bg-black/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-xl border border-white/20"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </DialogPrimitive.Close>
            
            <div className="relative rounded-lg overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 cursor-pointer max-w-full max-h-full shadow-2xl">
              <img
                src={src}
                alt={alt}
                className="block max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain"
                onClick={onClose}
                style={{
                  maxWidth: 'min(90vw, 1200px)',
                  maxHeight: 'min(85vh, 800px)'
                }}
              />
              {alt && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white p-4 pointer-events-none">
                  <p className="text-sm text-center font-medium drop-shadow-lg">{alt}</p>
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
