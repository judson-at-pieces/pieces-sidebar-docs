
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface ImageModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageModal({ src, alt, isOpen, onClose }: ImageModalProps) {
  // Handle escape key is already handled by Radix Dialog
  
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] max-w-[90vw] max-h-[90vh] p-0 border-0 bg-transparent shadow-none focus:outline-none">
          <div className="relative flex items-center justify-center">
            <DialogPrimitive.Close asChild>
              <button
                className="fixed top-4 right-4 sm:top-8 sm:right-8 rounded-full bg-background/90 backdrop-blur-md p-3 text-foreground hover:bg-background transition-all duration-200 z-50 focus:outline-none focus:ring-2 focus:ring-foreground/50 shadow-lg"
                aria-label="Close"
                style={{ paddingTop: 'env(safe-area-inset-top, 1rem)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </DialogPrimitive.Close>
            <div className="relative rounded-lg overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10">
              <img
                src={src}
                alt={alt}
                className="max-w-[85vw] max-h-[85vh] object-contain"
              />
              {alt && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white p-4">
                  <p className="text-sm text-center font-medium">{alt}</p>
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
