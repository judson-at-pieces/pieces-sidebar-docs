
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface VisibilitySwitchProps {
  isPublic: boolean;
  onToggle: (isPublic: boolean) => void;
  disabled?: boolean;
}

export function VisibilitySwitch({ isPublic, onToggle, disabled = false }: VisibilitySwitchProps) {
  return (
    <div className="flex items-center gap-2">
      {isPublic ? (
        <Eye className="h-4 w-4 text-green-600" />
      ) : (
        <EyeOff className="h-4 w-4 text-gray-400" />
      )}
      <Label htmlFor="visibility-switch" className="text-sm">
        {isPublic ? 'Public' : 'Private'}
      </Label>
      <Switch
        id="visibility-switch"
        checked={isPublic}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
    </div>
  );
}
