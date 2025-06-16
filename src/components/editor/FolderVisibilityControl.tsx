
import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FolderVisibilityControlProps {
  folderPath: string;
  folderName: string;
  isPublic: boolean;
  onToggle: (folderPath: string, isPublic: boolean) => void;
  disabled?: boolean;
}

export function FolderVisibilityControl({ 
  folderPath, 
  folderName, 
  isPublic, 
  onToggle, 
  disabled = false 
}: FolderVisibilityControlProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (newValue: boolean) => {
    if (disabled || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onToggle(folderPath, newValue);
      toast.success(`Folder "${folderName}" is now ${newValue ? 'public' : 'private'}`);
    } catch (error) {
      toast.error('Failed to update folder visibility');
      console.error('Error updating folder visibility:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
      <Folder className="h-4 w-4 text-blue-500" />
      <div className="flex-1">
        <div className="font-medium text-sm">{folderName}</div>
        <div className="text-xs text-muted-foreground">Folder visibility</div>
      </div>
      <div className="flex items-center gap-2">
        {isPublic ? (
          <Eye className="h-4 w-4 text-green-600" />
        ) : (
          <EyeOff className="h-4 w-4 text-gray-400" />
        )}
        <Label htmlFor={`folder-visibility-${folderPath}`} className="text-sm">
          {isPublic ? 'Public' : 'Private'}
        </Label>
        <Switch
          id={`folder-visibility-${folderPath}`}
          checked={isPublic}
          onCheckedChange={handleToggle}
          disabled={disabled || isUpdating}
        />
      </div>
    </div>
  );
}
