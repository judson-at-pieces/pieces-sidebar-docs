
import { useState, useEffect } from 'react';
import { X, Lock, Globe, Settings, FolderOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { navigationService } from '@/services/navigationService';

interface ItemSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string | null;
  itemType: 'file' | 'folder' | null;
  itemPath: string | null;
  currentPrivacy: 'PUBLIC' | 'PRIVATE';
  onSettingsUpdate: () => void;
}

export function ItemSettingsPanel({
  isOpen,
  onClose,
  itemId,
  itemType,
  itemPath,
  currentPrivacy,
  onSettingsUpdate
}: ItemSettingsPanelProps) {
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPrivacy(currentPrivacy);
  }, [currentPrivacy]);

  const handleSave = async () => {
    if (!itemPath) return;

    setIsSaving(true);
    try {
      // Use the cascading privacy update function
      await navigationService.updateNavigationItemPrivacyByFilePath(itemPath, privacy);
      
      const cascadeMessage = itemType === 'folder' 
        ? 'Privacy settings updated for folder and all its contents'
        : 'Privacy settings updated';
      
      toast.success(cascadeMessage);
      onSettingsUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-background border-l border-border shadow-lg transform transition-transform duration-300 ease-in-out">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Item Settings</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Item Info */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Item Details</Label>
          <div className="bg-muted/20 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-sm">
              {itemType === 'folder' ? (
                <FolderOpen className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span className="font-medium">Type:</span>
              <span className="capitalize">{itemType}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <span className="font-medium">Path:</span>
              <span className="break-all text-muted-foreground">{itemPath}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Privacy Settings */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Privacy Settings</Label>
          <RadioGroup
            value={privacy}
            onValueChange={(value: 'PUBLIC' | 'PRIVATE') => setPrivacy(value)}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors">
              <RadioGroupItem value="PUBLIC" id="public" className="mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-600" />
                  <Label htmlFor="public" className="font-medium cursor-pointer">
                    Public
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  This {itemType} is visible to everyone and appears in navigation
                  {itemType === 'folder' && ' (applies to all contents within this folder)'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors">
              <RadioGroupItem value="PRIVATE" id="private" className="mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-orange-600" />
                  <Label htmlFor="private" className="font-medium cursor-pointer">
                    Private
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  This {itemType} is hidden from public navigation and requires direct access
                  {itemType === 'folder' && ' (applies to all contents within this folder)'}
                </p>
              </div>
            </div>
          </RadioGroup>

          {itemType === 'folder' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FolderOpen className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Folder Privacy:</strong> Changing this setting will automatically update the privacy for all files and subfolders within this directory, including any corresponding .md files.
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || privacy === currentPrivacy}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
