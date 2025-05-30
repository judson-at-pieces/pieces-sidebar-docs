import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github, Loader2, ExternalLink, GitBranch, Check, RefreshCw, Info } from 'lucide-react';
import { githubAppService } from '@/services/githubAppService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
  default_branch: string;
}

interface GitHubInstallation {
  installation_id: number;
  account_login: string;
  account_type: string;
  installed_at: string;
}

interface GitHubAppRepoSelectorProps {
  onRepoConfigured: () => void;
}

export function GitHubAppRepoSelector({ onRepoConfigured }: GitHubAppRepoSelectorProps) {
  const [installations, setInstallations] = useState<GitHubInstallation[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedInstallation, setSelectedInstallation] = useState<string>('');
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadInstallations();
  }, []);

  const loadInstallations = async () => {
    setLoading(true);
    try {
      console.log('Loading GitHub App installations...');
      
      // First check if we have any installations in our database
      const { data: dbInstallations, error: dbError } = await supabase
        .from('github_installations')
        .select('*')
        .order('installed_at', { ascending: false });

      if (dbError) {
        console.error('Error loading installations from database:', dbError);
        toast.error('Failed to load GitHub App installations from database');
        setInstallations([]);
        return;
      }

      console.log('Installations from database:', dbInstallations);

      if (dbInstallations && dbInstallations.length > 0) {
        // Convert database format to expected format
        const formattedInstallations: GitHubInstallation[] = dbInstallations.map(install => ({
          installation_id: install.installation_id,
          account_login: install.account_login,
          account_type: install.account_type,
          installed_at: install.installed_at
        }));
        
        setInstallations(formattedInstallations);
        console.log('Found installations:', formattedInstallations);
      } else {
        console.log('No installations found in database - trying manual sync...');
        // Try to manually sync installations if webhook didn't work
        await syncInstallationsManually();
      }
    } catch (error: any) {
      console.error('Error loading installations:', error);
      toast.error('Failed to load GitHub App installations');
      setInstallations([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const syncInstallationsManually = async () => {
    try {
      console.log('Attempting manual installation sync...');
      
      // Call our webhook function to try to detect installations
      const response = await fetch('/api/github/sync-installations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('Manual sync endpoint not available, this is expected');
        return;
      }

      // Reload installations after sync
      const { data: dbInstallations, error: dbError } = await supabase
        .from('github_installations')
        .select('*')
        .order('installed_at', { ascending: false });

      if (!dbError && dbInstallations && dbInstallations.length > 0) {
        const formattedInstallations: GitHubInstallation[] = dbInstallations.map(install => ({
          installation_id: install.installation_id,
          account_login: install.account_login,
          account_type: install.account_type,
          installed_at: install.installed_at
        }));
        
        setInstallations(formattedInstallations);
        toast.success('Found GitHub App installations!');
      }
    } catch (error) {
      console.log('Manual sync failed, this is expected:', error);
    }
  };

  const loadRepositories = async (installationId: number) => {
    setLoading(true);
    try {
      console.log('Loading repositories for installation:', installationId);
      const repos = await githubAppService.getInstallationRepositories(installationId);
      console.log('Found repositories:', repos);
      setRepositories(repos);
    } catch (error: any) {
      console.error('Error loading repositories:', error);
      toast.error('Failed to load repositories for this installation');
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallationChange = (installationId: string) => {
    setSelectedInstallation(installationId);
    setSelectedRepo('');
    setRepositories([]);
    
    if (installationId) {
      loadRepositories(parseInt(installationId));
    }
  };

  const handleConfigureRepository = async () => {
    if (!selectedRepo || !selectedInstallation) return;

    const repo = repositories.find(r => r.full_name === selectedRepo);
    if (!repo) return;

    setConfiguring(true);
    try {
      const [owner, repoName] = repo.full_name.split('/');

      console.log('Configuring repository:', { owner, repoName, installationId: selectedInstallation });

      // Save configuration with installation ID
      const { error } = await supabase
        .from('github_config')
        .insert({
          repo_owner: owner,
          repo_name: repoName,
          installation_id: parseInt(selectedInstallation),
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        throw new Error(`Failed to save configuration: ${error.message}`);
      }
      
      toast.success(`Repository ${repo.full_name} configured successfully!`);
      onRepoConfigured();
    } catch (error: any) {
      console.error('Error configuring repository:', error);
      toast.error(error.message || 'Failed to configure repository');
    } finally {
      setConfiguring(false);
    }
  };

  const handleRefreshInstallations = async () => {
    await loadInstallations();
    toast.success('Installations refreshed');
  };

  if (initialLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Github className="h-5 w-5" />
            <span>GitHub App Installation</span>
            <Loader2 className="h-4 w-4 animate-spin" />
          </CardTitle>
          <CardDescription>
            Loading GitHub App installations...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (installations.length === 0) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const correctWebhookUrl = `${supabaseUrl}/functions/v1/github-webhook`;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Github className="h-5 w-5" />
            <span>Install GitHub App</span>
          </CardTitle>
          <CardDescription>
            Install the Pieces Documentation Bot to access your repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> After installing the GitHub App, make sure the webhook URL in your GitHub App settings is set to:
              <br />
              <code className="bg-muted px-1 py-0.5 rounded text-xs mt-1 block">
                {correctWebhookUrl}
              </code>
              <br />
              This ensures installation events are properly recorded.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Button 
              onClick={() => window.open(githubAppService.getInstallationUrl(), '_blank')}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Install Pieces Documentation Bot
            </Button>
            
            <Button 
              onClick={handleRefreshInstallations}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Installations
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Troubleshooting:</strong> If you've installed the app but don't see it here:
            </p>
            <ol className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>1. Verify the webhook URL is correctly set in your GitHub App settings</li>
              <li>2. Try clicking "Refresh Installations" above</li>
              <li>3. Check that the app has access to your target repository</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Github className="h-5 w-5" />
          <span>Select Repository</span>
        </CardTitle>
        <CardDescription>
          Choose a repository to configure for documentation editing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <GitBranch className="h-4 w-4" />
          <AlertDescription>
            The selected repository will be configured for automatic branch creation and pull request management.
          </AlertDescription>
        </Alert>

        <div>
          <label className="text-sm font-medium mb-2 block">GitHub Installation</label>
          <Select value={selectedInstallation} onValueChange={handleInstallationChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an installation..." />
            </SelectTrigger>
            <SelectContent>
              {installations.map((installation) => (
                <SelectItem key={installation.installation_id} value={installation.installation_id.toString()}>
                  {installation.account_login} ({installation.account_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedInstallation && (
          <div>
            <label className="text-sm font-medium mb-2 block">Available Repositories</label>
            <Select value={selectedRepo} onValueChange={setSelectedRepo}>
              <SelectTrigger>
                <SelectValue placeholder="Select a repository..." />
              </SelectTrigger>
              <SelectContent>
                {repositories.map((repo) => (
                  <SelectItem key={repo.id} value={repo.full_name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{repo.full_name}</span>
                      <div className="flex items-center space-x-1 ml-2">
                        {repo.private && (
                          <span className="text-xs bg-gray-100 px-1 rounded">Private</span>
                        )}
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {repositories.length === 0 && !loading && selectedInstallation && (
              <p className="text-sm text-muted-foreground mt-2">
                No repositories found for this installation.
              </p>
            )}

            {loading && selectedInstallation && (
              <div className="flex items-center space-x-2 mt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading repositories...</span>
              </div>
            )}
          </div>
        )}

        {selectedRepo && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
              <Github className="h-4 w-4" />
              <span className="text-sm font-medium">Selected: {selectedRepo}</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              This will set up automatic branching and PR creation for documentation edits.
            </p>
          </div>
        )}

        <div className="flex space-x-2">
          <Button 
            onClick={handleRefreshInstallations} 
            variant="outline"
            disabled={loading}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            onClick={handleConfigureRepository}
            disabled={!selectedRepo || configuring}
            className="flex-1"
          >
            {configuring ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Configuring...
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4 mr-2" />
                Configure Repository
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
