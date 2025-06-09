
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/UserMenu';
import { Settings, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BranchSelector } from './BranchSelector';

interface EditorHeaderProps {
  activeTab: 'navigation' | 'content' | 'seo';
  hasChanges: boolean;
  totalLiveFiles: number;
}

export function EditorHeader({ activeTab, hasChanges, totalLiveFiles }: EditorHeaderProps) {
  const { hasRole } = useAuth();

  return (
    <div className="border-b border-border/50 bg-background/95 backdrop-blur-md shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-all duration-200 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-semibold text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Pieces Docs</span>
          </Link>
          <div className="h-6 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <h1 className="text-lg font-medium text-muted-foreground">
                {activeTab === 'content' ? 'Content Editor' : activeTab === 'seo' ? 'SEO Editor' : 'Navigation Editor'}
              </h1>
            </div>
            <BranchSelector />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted/50 transition-colors relative">
              <Home className="h-4 w-4" />
              Home
              {(hasChanges || totalLiveFiles > 0) && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-background"></div>
              )}
            </Button>
          </Link>
          {hasRole('admin') && (
            <Link to="/admin">
              <Button variant="outline" size="sm" className="gap-2 hover:bg-muted/50 transition-colors">
                <Settings className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          )}
          <UserMenu />
        </div>
      </div>
    </div>
  );
}
