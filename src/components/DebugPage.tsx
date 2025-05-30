import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Database, FileText, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isSupabaseConfigured } from '@/integrations/supabase/client';

interface DebugPageProps {
  hasCompiledContent?: boolean;
  error?: string;
}

export function DebugPage({ hasCompiledContent = false, error }: DebugPageProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <span>Application Configuration Debug</span>
          </CardTitle>
          <CardDescription>
            There seems to be an issue with the application setup. Here's what we found:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <p className="text-sm font-medium text-destructive">Error Details:</p>
              <pre className="text-xs text-destructive/80 mt-1 whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {/* Configuration Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuration Status</h3>
            
            {/* Supabase Configuration */}
            <div className="flex items-start space-x-3 p-3 border rounded-md">
              <Database className={`h-5 w-5 mt-0.5 ${isSupabaseConfigured ? 'text-green-500' : 'text-red-500'}`} />
              <div className="flex-1">
                <p className="font-medium">Database Connection (Supabase)</p>
                <p className="text-sm text-muted-foreground">
                  {isSupabaseConfigured ? 'Configured and connected' : 'Not configured or connection failed'}
                </p>
                {!isSupabaseConfigured && (
                  <div className="mt-2 text-xs">
                    <p className="font-medium">Required environment variables:</p>
                    <ul className="list-disc list-inside text-muted-foreground ml-2">
                      <li>VITE_SUPABASE_URL</li>
                      <li>VITE_SUPABASE_ANON_KEY</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Compiled Content */}
            <div className="flex items-start space-x-3 p-3 border rounded-md">
              <FileText className={`h-5 w-5 mt-0.5 ${hasCompiledContent ? 'text-green-500' : 'text-red-500'}`} />
              <div className="flex-1">
                <p className="font-medium">Compiled Documentation</p>
                <p className="text-sm text-muted-foreground">
                  {hasCompiledContent ? 'Available as fallback' : 'Not available or failed to load'}
                </p>
                {!hasCompiledContent && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Run <code className="bg-muted px-1 rounded">npm run build:mdx</code> to generate compiled content</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recommendations</h3>
            <div className="bg-muted/50 p-4 rounded-md space-y-3">
              <div className="flex items-start space-x-2">
                <Settings className="h-4 w-4 mt-0.5 text-blue-500" />
                <div className="text-sm">
                  <p className="font-medium">For Administrators:</p>
                  <p className="text-muted-foreground">Configure Supabase environment variables for full functionality including content management and user authentication.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <FileText className="h-4 w-4 mt-0.5 text-green-500" />
                <div className="text-sm">
                  <p className="font-medium">For Content Access:</p>
                  <p className="text-muted-foreground">Ensure compiled documentation is available by running the build process. This provides read-only access to documentation.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4 pt-4">
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
            <Button onClick={() => window.location.href = '/'}>
              Return Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}