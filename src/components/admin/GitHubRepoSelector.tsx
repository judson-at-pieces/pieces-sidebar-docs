
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github, RefreshCw, Check } from 'lucide-react';
import { githubService } from '@/services/githubService';
import { toast } from 'sonner';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
}

export function GitHubRepoSelector() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const configured = await githubService.isConfigured();
      setIsConfigured(configured);
      if (configured) {
        loadRepos();
      }
    } catch (error) {
      console.error('Error checking GitHub configuration:', error);
    }
  };

  const loadRepos = async () => {
    setLoading(true);
    try {
      const userRepos = await githubService.getUserRepos();
      setRepos(userRepos);
      
      // Load saved repo from localStorage
      const savedRepo = localStorage.getItem('selected_github_repo');
      if (savedRepo && userRepos.find(repo => repo.full_name === savedRepo)) {
        setSelectedRepo(savedRepo);
      }
    } catch (error) {
      console.error('Error loading repos:', error);
      toast.error('Failed to load GitHub repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleRepoSelect = (repoFullName: string) => {
    setSelectedRepo(repoFullName);
    localStorage.setItem('selected_github_repo', repoFullName);
    toast.success('Repository selected successfully');
  };

  if (!isConfigured) {
    return (
      <Alert>
        <Github className="h-4 w-4" />
        <AlertDescription>
          GitHub OAuth not configured. Please sign in with GitHub to enable repository selection.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Github className="h-5 w-5" />
          <span>GitHub Repository</span>
        </CardTitle>
        <CardDescription>
          Select the repository where documentation changes will be committed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <Select value={selectedRepo} onValueChange={handleRepoSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a repository..." />
              </SelectTrigger>
              <SelectContent>
                {repos.map((repo) => (
                  <SelectItem key={repo.id} value={repo.full_name}>
                    <div className="flex items-center space-x-2">
                      <span>{repo.full_name}</span>
                      {repo.private && (
                        <span className="text-xs bg-muted px-1 rounded">Private</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={loadRepos}
            disabled={loading}
            variant="outline"
            size="icon"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {selectedRepo && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              Documentation changes will be committed to <strong>{selectedRepo}</strong>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
