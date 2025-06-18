
import React from 'react';
import { EnhancedCommandPalette } from './EnhancedCommandPalette';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
  position: { top: number; left: number };
}

export function CommandPalette(props: CommandPaletteProps) {
  return <EnhancedCommandPalette {...props} />;
}
