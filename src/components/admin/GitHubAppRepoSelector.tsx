import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github, Loader2, ExternalLink, GitBranch, Check, RefreshCw, Info } from 'lucide-react';
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
      
      // Mock installations for now - replace with actual GitHub App service when available
      const installationsList: GitHubInstallation[] = [];
      console.log('Found installations:', installationsList);
      
      setInstallations(installationsList);
      
      if (installationsList.length === 0) {
        console.log('No installations found');
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

  const loadRepositories = async (installationId: number) => {
    setLoading(true);
    try {
      console.log('Loading repositories for installation:', installationId);
      // Mock repositories for now - replace with actual GitHub App service when available
      const repos: Repository[] = [];
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

      // Clear any existing configuration first
      await supabase
        .from('github_config')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      // Save new configuration with installation ID
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
      
      toast.success(`Repository ${repo.full_name} configured successfully! All editors can now create PRs to this repository.`);
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

  const getInstallationUrl = () => {
    // Return GitHub App installation URL - replace with actual GitHub App ID when available
    return 'https://github.com/apps/pieces-documentation-bot/installations/new';
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
              <strong>Important:</strong> Once you install the GitHub App, it will be available for all admins to configure repositories for documentation editing.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Button 
              onClick={() => window.open(getInstallationUrl(), '_blank')}
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
              <strong>Next Steps:</strong>
            </p>
            <ol className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>1. Click "Install Pieces Documentation Bot" above</li>
              <li>2. Select which repositories to grant access to</li>
              <li>3. Come back here and click "Refresh Installations"</li>
              <li>4. Configure your repository for documentation editing</li>
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
          Choose a repository to configure for documentation editing (available to all admins)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <GitBranch className="h-4 w-4" />
          <AlertDescription>
            The selected repository will be configured globally for all editors. When they save changes, the GitHub App will automatically create branches and pull requests.
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
              This will be configured globally for all editors to create automatic PRs.
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
