
import React from 'react';
import { MoreHorizontal, Eye, EyeOff, Folder } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { navigationService } from '@/services/navigationService';
import { toast } from 'sonner';

interface FolderContextMenuProps {
  folderPath: string;
  folderName: string;
  children: React.ReactNode;
  isPublic: boolean;
  onVisibilityChange?: () => void;
}

export function FolderContextMenu({ 
  folderPath, 
  folderName, 
  children, 
  isPublic,
  onVisibilityChange 
}: FolderContextMenuProps) {

  const handleVisibilityToggle = async (newVisibility: boolean) => {
    try {
      await navigationService.updateFolderVisibility(folderPath, newVisibility);
      toast.success(`Folder "${folderName}" is now ${newVisibility ? 'public' : 'private'}`);
      onVisibilityChange?.();
    } catch (error) {
      toast.error('Failed to update folder visibility');
      console.error('Error updating folder visibility:', error);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem 
          onClick={() => handleVisibilityToggle(true)}
          disabled={isPublic}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4 text-green-600" />
          Make Public
          {isPublic && <span className="text-xs text-muted-foreground ml-auto">Current</span>}
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={() => handleVisibilityToggle(false)}
          disabled={!isPublic}
          className="flex items-center gap-2"
        >
          <EyeOff className="h-4 w-4 text-gray-600" />
          Make Private
          {!isPublic && <span className="text-xs text-muted-foreground ml-auto">Current</span>}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function FolderDropdownMenu({ 
  folderPath, 
  folderName, 
  isPublic,
  onVisibilityChange 
}: Omit<FolderContextMenuProps, 'children'>) {

  const handleVisibilityToggle = async (newVisibility: boolean) => {
    try {
      await navigationService.updateFolderVisibility(folderPath, newVisibility);
      toast.success(`Folder "${folderName}" is now ${newVisibility ? 'public' : 'private'}`);
      onVisibilityChange?.();
    } catch (error) {
      toast.error('Failed to update folder visibility');
      console.error('Error updating folder visibility:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem 
          onClick={(e) => {
            e.stopPropagation();
            handleVisibilityToggle(true);
          }}
          disabled={isPublic}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4 text-green-600" />
          Make Public
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={(e) => {
            e.stopPropagation();
            handleVisibilityToggle(false);
          }}
          disabled={!isPublic}
          className="flex items-center gap-2"
        >
          <EyeOff className="h-4 w-4 text-gray-600" />
          Make Private
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
