
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Lock, Users } from 'lucide-react';
import { PublicitySelector } from './PublicitySelector';
import { useDocumentPublicity } from '@/hooks/useDocumentPublicity';
import { useAuth } from '@/hooks/useAuth';

interface EditorMainProps {
  selectedFile?: string;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  hasChanges: boolean;
  saving: boolean;
  isLocked?: boolean;
  lockedBy?: string;
  liveContent?: any;
  isAcquiringLock?: boolean;
  onTakeLock?: () => Promise<boolean>;
}

export function EditorMain({
  selectedFile,
  content,
  onContentChange,
  onSave,
  hasChanges,
  saving,
  isLocked = false,
  lockedBy,
  liveContent,
  isAcquiringLock = false,
  onTakeLock
}: EditorMainProps) {
  const { user } = useAuth();
  const { updateDocumentPublicity, getDocumentPublicity, isUpdating } = useDocumentPublicity();
  const [publicity, setPublicity] = useState<'PUBLIC' | 'PRIVATE' | 'DRAFT'>('PUBLIC');

  // Load document publicity when file changes
  useEffect(() => {
    if (selectedFile) {
      getDocumentPublicity(selectedFile).then(setPublicity);
    }
  }, [selectedFile, getDocumentPublicity]);

  const handlePublicityChange = async (newPublicity: 'PUBLIC' | 'PRIVATE' | 'DRAFT') => {
    if (!selectedFile || !user?.id) return;
    
    const success = await updateDocumentPublicity(selectedFile, newPublicity, user.id);
    if (success) {
      setPublicity(newPublicity);
    }
  };

  if (!selectedFile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Select a file to edit</div>
          <div className="text-muted-foreground">Choose a file from the navigation to start editing</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with file info and controls */}
      <div className="border-b p-4 flex items-center justify-between bg-background">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-medium">{selectedFile}</h3>
            <div className="flex items-center gap-2 mt-1">
              {hasChanges && (
                <Badge variant="secondary" className="text-xs">
                  Unsaved changes
                </Badge>
              )}
              {isLocked && lockedBy && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Locked by {lockedBy}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <PublicitySelector
            value={publicity}
            onChange={handlePublicityChange}
            disabled={isUpdating || !user}
          />
          
          {isLocked && onTakeLock && (
            <Button 
              onClick={() => onTakeLock()}
              disabled={isAcquiringLock}
              variant="outline"
              className="gap-2"
            >
              {isAcquiringLock ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Acquiring...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Take Lock
                </>
              )}
            </Button>
          )}
          
          <Button 
            onClick={onSave}
            disabled={!hasChanges || saving || isLocked}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content editor */}
      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          disabled={isLocked}
          className="w-full h-full p-4 border rounded-lg resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={isLocked ? "This file is locked by another user" : "Start typing your content here..."}
        />
      </div>
    </div>
  );
}
