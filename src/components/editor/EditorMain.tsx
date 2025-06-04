
import React from 'react';
import { EnhancedEditor } from './EnhancedEditor';

interface EditorMainProps {
  selectedFile?: string;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  hasChanges: boolean;
  saving: boolean;
}

export function EditorMain(props: EditorMainProps) {
  return <EnhancedEditor {...props} />;
}
