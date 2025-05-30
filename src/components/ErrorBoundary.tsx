
import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/utils/logger';
import { DebugPage } from './DebugPage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorId: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = Math.random().toString(36).substring(2, 15);
    return {
      hasError: true,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details securely
    logger.error('React Error Boundary caught an error', {
      error: {
        name: error.name,
        message: error.message,
        stack: import.meta.env.DEV ? error.stack : '[Hidden in production]'
      },
      errorInfo: import.meta.env.DEV ? errorInfo : '[Hidden in production]',
      errorId: this.state.errorId,
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Check if this is a Supabase-related error
      const isSupabaseError = window.location.href.includes('supabaseUrl') || 
                              this.state.errorId.includes('supabase') ||
                              document.querySelector('script')?.textContent?.includes('supabaseUrl is required');

      if (isSupabaseError) {
        return <DebugPage error="Supabase configuration error detected" hasCompiledContent={true} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <span>Something went wrong</span>
              </CardTitle>
              <CardDescription>
                An unexpected error occurred. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Error ID: {this.state.errorId}
              </p>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="flex-1"
                >
                  Reload Page
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'} 
                  variant="outline"
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
