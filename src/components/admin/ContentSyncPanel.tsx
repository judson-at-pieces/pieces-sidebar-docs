
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, GitBranch, FileText, Clock, CheckCircle, XCircle, AlertTriangle, Settings } from 'lucide-react';
import { contentSyncService, ContentSyncResult } from '@/services/contentSyncService';
import { isSupabaseConfigured } from '@/integrations/supabase/client';

interface SyncLog {
  id: number;
  repository_owner: string;
  repository_name: string;
  files_synced: number;
  sync_status: 'in_progress' | 'completed' | 'failed';
  compilation_status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  triggered_by: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

interface RepoConfig {
  repo_owner: string;
  repo_name: string;
  installation_id: number;
}

export function ContentSyncPanel() {
  const [repoConfig, setRepoConfig] = useState<RepoConfig | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<ContentSyncResult | null>(null);

  useEffect(() => {
    if (isSupabaseConfigured) {
      loadRepoConfig();
      loadSyncLogs();
    }
  }, []);

  const loadRepoConfig = async () => {
    try {
      // Mock data for local development
      setRepoConfig({
        repo_owner: 'your-org',
        repo_name: 'docs-repo',
        installation_id: 12345
      });
    } catch (error) {
      console.error('Error loading repo config:', error);
    }
  };

  const loadSyncLogs = async () => {
    try {
      setIsLoading(true);
      // Mock data for local development
      setSyncLogs([]);
    } catch (error) {
      console.error('Error loading sync logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!repoConfig) {
      alert('No repository configured');
      return;
    }

    try {
      setIsSyncing(true);
      setSyncResult(null);
      
      const result = await contentSyncService.syncContentFromRepo();
      setSyncResult(result);
      
      // Reload sync logs to show the new entry
      await loadSyncLogs();
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      in_progress: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeDiff = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffSeconds = Math.round(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.round(diffMinutes / 60);
    return `${diffHours}h`;
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
      {/* Repository Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Content Repository
              </CardTitle>
              <CardDescription>
                Configured GitHub repository for content syncing
              </CardDescription>
            </div>
            <Button
              onClick={handleManualSync}
              disabled={!repoConfig || isSyncing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {repoConfig ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{repoConfig.repo_owner}/{repoConfig.repo_name}</Badge>
                <span className="text-sm text-muted-foreground">
                  Installation ID: {repoConfig.installation_id}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">
              No repository configured. Please configure a repository in the admin settings.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Result */}
      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${
              syncResult.success ? 'text-green-600' : 'text-red-600'
            }`}>
              {syncResult.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              Sync Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>{syncResult.message}</p>
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

      {/* Sync History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Sync History
              </CardTitle>
              <CardDescription>
                Recent content synchronization operations
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSyncLogs}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {syncLogs.length > 0 ? (
            <div className="space-y-4">
              {syncLogs.map((log, index) => (
                <div key={log.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.sync_status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {log.repository_owner}/{log.repository_name}
                          </span>
                          {getStatusBadge(log.sync_status)}
                          <Badge variant="outline" className="text-xs">
                            {log.triggered_by}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatTimestamp(log.created_at)}
                          {log.completed_at && ` • ${getTimeDiff(log.created_at, log.completed_at)}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        {log.files_synced}
                      </div>
                      {log.compilation_status && (
                        getStatusBadge(log.compilation_status)
                      )}
                    </div>
                  </div>
                  {log.error_message && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm text-red-600">
                      {log.error_message}
                    </div>
                  )}
                  {index < syncLogs.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No sync operations found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
