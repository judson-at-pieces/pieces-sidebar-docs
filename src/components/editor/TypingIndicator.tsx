
import React from 'react';
import { Edit3, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TypingSession {
  file_path: string;
  user_id: string;
  content: string;
  cursor_position: number;
  updated_at: string;
}

interface TypingIndicatorProps {
  typingSessions: TypingSession[];
  className?: string;
}

export function TypingIndicator({ typingSessions, className = '' }: TypingIndicatorProps) {
  if (typingSessions.length === 0) return null;

  const recentSessions = typingSessions.filter(session => {
    const lastUpdate = new Date(session.updated_at);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    return diffMs < 3000; // Show for 3 seconds after last update
  });

  if (recentSessions.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <Edit3 className="h-3 w-3 text-blue-500" />
        </div>
        <span className="text-xs text-blue-600 font-medium">
          {recentSessions.length === 1 ? 'Someone is typing...' : `${recentSessions.length} people typing...`}
        </span>
      </div>
      
      {recentSessions.map((session, index) => (
        <Badge key={session.user_id} variant="outline" className="text-xs">
          <Eye className="h-3 w-3 mr-1" />
          User {session.user_id.slice(0, 8)}
        </Badge>
      ))}
    </div>
  );
}
