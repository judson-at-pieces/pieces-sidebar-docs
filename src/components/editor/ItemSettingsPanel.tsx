
import React, { useState } from 'react';
import { X, Lock, Unlock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ItemSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    title: string;
    privacy?: 'PUBLIC' | 'PRIVATE';
    description?: string;
  } | null;
  onPrivacyChange: (itemId: string, privacy: 'PUBLIC' | 'PRIVATE') => void;
  onDescriptionChange?: (itemId: string, description: string) => void;
}

export function ItemSettingsPanel({ 
  isOpen, 
  onClose, 
  item, 
  onPrivacyChange,
  onDescriptionChange 
}: ItemSettingsPanelProps) {
  const [localDescription, setLocalDescription] = useState(item?.description || '');

  React.useEffect(() => {
    setLocalDescription(item?.description || '');
  }, [item]);

  if (!item) return null;

  const isPrivate = item.privacy === 'PRIVATE';

  const handlePrivacyToggle = (checked: boolean) => {
    onPrivacyChange(item.id, checked ? 'PRIVATE' : 'PUBLIC');
  };

  const handleDescriptionSave = () => {
    if (onDescriptionChange) {
      onDescriptionChange(item.id, localDescription);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/20 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-96 bg-background border-l border-border z-50 transition-transform duration-300 ease-in-out shadow-xl",
          isOpen ? "transform translate-x-0" : "transform translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Item Settings</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Item Info */}
            <div>
              <h3 className="text-sm font-medium mb-2">Item Information</h3>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">ID: {item.id}</p>
              </div>
            </div>

            <Separator />

            {/* Privacy Settings */}
            <div>
              <h3 className="text-sm font-medium mb-4">Privacy Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {isPrivate ? (
                      <Lock className="h-4 w-4 text-destructive" />
                    ) : (
                      <Unlock className="h-4 w-4 text-green-600" />
                    )}
                    <div>
                      <Label htmlFor="privacy-switch" className="text-sm font-medium">
                        Private Item
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {isPrivate 
                          ? "This item is hidden from public navigation" 
                          : "This item is visible in public navigation"
                        }
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="privacy-switch"
                    checked={isPrivate}
                    onCheckedChange={handlePrivacyToggle}
                  />
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isPrivate ? "bg-destructive" : "bg-green-600"
                    )} />
                    <span className="text-xs font-medium">
                      Current Status: {isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isPrivate 
                      ? "Only editors and admins can see this item in the navigation"
                      : "All visitors can see this item in the documentation"
                    }
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium mb-4">Description</h3>
              <div className="space-y-3">
                <textarea
                  value={localDescription}
                  onChange={(e) => setLocalDescription(e.target.value)}
                  placeholder="Add a description for this item..."
                  className="w-full p-3 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                />
                {onDescriptionChange && (
                  <Button 
                    onClick={handleDescriptionSave}
                    size="sm"
                    className="w-full"
                    disabled={localDescription === (item.description || '')}
                  >
                    Save Description
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
