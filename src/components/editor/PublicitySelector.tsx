
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, FileText } from 'lucide-react';

interface PublicitySelectorProps {
  value: 'PUBLIC' | 'PRIVATE' | 'DRAFT';
  onChange: (value: 'PUBLIC' | 'PRIVATE' | 'DRAFT') => void;
  disabled?: boolean;
}

export function PublicitySelector({ value, onChange, disabled }: PublicitySelectorProps) {
  const getIcon = (publicity: string) => {
    switch (publicity) {
      case 'PUBLIC':
        return <Eye className="h-3 w-3" />;
      case 'PRIVATE':
        return <EyeOff className="h-3 w-3" />;
      case 'DRAFT':
        return <FileText className="h-3 w-3" />;
      default:
        return <Eye className="h-3 w-3" />;
    }
  };

  const getVariant = (publicity: string) => {
    switch (publicity) {
      case 'PUBLIC':
        return 'default';
      case 'PRIVATE':
        return 'destructive';
      case 'DRAFT':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Visibility:</span>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-32">
          <SelectValue>
            <div className="flex items-center gap-2">
              {getIcon(value)}
              <span className="capitalize">{value.toLowerCase()}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PUBLIC">
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3" />
              <span>Public</span>
            </div>
          </SelectItem>
          <SelectItem value="PRIVATE">
            <div className="flex items-center gap-2">
              <EyeOff className="h-3 w-3" />
              <span>Private</span>
            </div>
          </SelectItem>
          <SelectItem value="DRAFT">
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3" />
              <span>Draft</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <Badge variant={getVariant(value)} className="gap-1">
        {getIcon(value)}
        {value}
      </Badge>
    </div>
  );
}
