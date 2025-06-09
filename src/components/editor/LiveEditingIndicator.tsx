
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveEditingIndicatorProps {
  isLocked: boolean;
  lockedBy: string | null;
  isAcquiringLock: boolean;
  onAcquireLock: () => void;
  onReleaseLock: () => void;
  className?: string;
}

export function LiveEditingIndicator({
  isLocked,
  lockedBy,
  isAcquiringLock,
  onAcquireLock,
  onReleaseLock,
  className = ''
}: LiveEditingIndicatorProps) {
  const isLockedByCurrentUser = lockedBy === 'You';
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isLocked ? (
        <>
          <Badge 
            variant={isLockedByCurrentUser ? 'default' : 'destructive'} 
            className="flex items-center gap-1"
          >
            <Lock className="h-3 w-3" />
            {isLockedByCurrentUser ? 'Editing' : `Locked by ${lockedBy}`}
          </Badge>
          
          {isLockedByCurrentUser && (
            <Button
              onClick={onReleaseLock}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
            >
              <Unlock className="h-3 w-3 mr-1" />
              Release
            </Button>
          )}
        </>
      ) : (
        <Button
          onClick={onAcquireLock}
          disabled={isAcquiringLock}
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs"
        >
          {isAcquiringLock ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
          ) : (
            <Users className="h-3 w-3 mr-1" />
          )}
          {isAcquiringLock ? 'Acquiring...' : 'Start Editing'}
        </Button>
      )}
    </div>
  );
}
