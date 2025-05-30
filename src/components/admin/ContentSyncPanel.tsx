
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, GitBranch, Settings } from 'lucide-react';
import { contentSyncService, ContentSyncResult } from '@/services/contentSyncService';
import { isSupabaseConfigured } from '@/integrations/supabase/client';

export function ContentSyncPanel() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<ContentSyncResult | null>(null);

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      setSyncResult(null);
      
      const result = await contentSyncService.syncContentFromRepo();
      setSyncResult(result);
    } catch (error) {
      setSyncResult({
        success: false,
        message: `Sync failed: ${error.message}`,
        filesUpdated: 0,
        errors: [error.message]
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Show setup message if Supabase is not configured
  if (!isSupabaseConfigured) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>Setup Required</CardTitle>
            <CardDescription>
              Supabase configuration is needed to use the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              To use the content sync features, please configure your Supabase environment variables in Lovable's project settings.
            </p>
            <div className="text-left bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono">
              <div>VITE_SUPABASE_URL</div>
              <div>VITE_SUPABASE_ANON_KEY</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Add these environment variables in your Lovable project settings and refresh the page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Content Sync */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Content Sync
              </CardTitle>
              <CardDescription>
                Sync content from your GitHub repository
              </CardDescription>
            </div>
            <Button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Click "Sync Now" to manually sync content from your configured repository.
          </div>
        </CardContent>
      </Card>

      {/* Sync Result */}
      {syncResult && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className={syncResult.success ? 'text-green-600' : 'text-red-600'}>
                {syncResult.message}
              </p>
              {syncResult.filesUpdated > 0 && (
                <p className="text-sm text-muted-foreground">
                  Files updated: {syncResult.filesUpdated}
                </p>
              )}
              {syncResult.errors && syncResult.errors.length > 0 && (
                <div className="text-sm text-red-600">
                  <p>Errors:</p>
                  <ul className="list-disc list-inside ml-4">
                    {syncResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
