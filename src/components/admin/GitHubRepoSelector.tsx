
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github, Loader2, ExternalLink, GitBranch, Check } from 'lucide-react';
import { githubService } from '@/services/githubService';
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

interface GitHubRepoSelectorProps {
  onRepoConfigured: () => void;
}

export function GitHubRepoSelector({ onRepoConfigured }: GitHubRepoSelectorProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const githubToken = session?.provider_token;

      if (!githubToken) {
        setNeedsAuth(true);
        return;
      }

      const repos = await githubService.listUserRepositories(githubToken);
      setRepositories(repos);
      setNeedsAuth(false);
    } catch (error: any) {
      console.error('Error loading repositories:', error);
      if (error.message.includes('401')) {
        setNeedsAuth(true);
        toast.error('GitHub authentication expired. Please reconnect your GitHub account.');
      } else {
        toast.error('Failed to load repositories');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReconnectGitHub = () => {
    // Redirect to GitHub OAuth
    window.location.href = '/auth?provider=github&redirect_to=' + encodeURIComponent(window.location.pathname);
  };

  const handleConfigureRepository = async () => {
    if (!selectedRepo) return;

    const repo = repositories.find(r => r.full_name === selectedRepo);
    if (!repo) return;

    setConfiguring(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const githubToken = session?.provider_token;

      if (!githubToken) {
        toast.error('GitHub token not found. Please reconnect your GitHub account.');
        return;
      }

      // Split owner and repo name
      const [owner, repoName] = repo.full_name.split('/');

      // Test repository access and setup
      await githubService.setupRepositoryForEditing(owner, repoName, githubToken);
      
      // Save configuration
      await githubService.setRepoConfig(owner, repoName);
      
      toast.success(`Repository ${repo.full_name} configured successfully!`);
      onRepoConfigured();
    } catch (error: any) {
      console.error('Error configuring repository:', error);
      
      if (error.message.includes('permissions')) {
        toast.error('Insufficient permissions. Please ensure the Lovable app has access to this repository.');
      } else {
        toast.error(error.message || 'Failed to configure repository');
      }
    } finally {
      setConfiguring(false);
    }
  };

  if (needsAuth) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Github className="h-5 w-5" />
            <span>GitHub Authentication Required</span>
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to access and configure repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              You need to authenticate with GitHub to see your repositories and configure the integration.
            </AlertDescription>
          </Alert>
          
          <Button onClick={handleReconnectGitHub} className="w-full">
            <Github className="h-4 w-4 mr-2" />
            Connect GitHub Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Github className="h-5 w-5" />
            <span>GitHub Repository</span>
            <Loader2 className="h-4 w-4 animate-spin" />
          </CardTitle>
          <CardDescription>
            Loading your repositories...
          </CardDescription>
        </CardHeader>
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
                      {repo.permissions.admin && (
                        <Check className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {repositories.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              No repositories found. Make sure you have access to at least one repository.
            </p>
          )}
        </div>

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
            onClick={loadRepositories} 
            variant="outline"
            disabled={loading}
            className="flex-1"
          >
            <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : 'hidden'}`} />
            Refresh Repositories
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

        <div className="flex items-center justify-center pt-2">
          <Button
            variant="link"
            size="sm"
            onClick={() => window.open('https://github.com/apps/lovable-editor', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Install Lovable GitHub App
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
