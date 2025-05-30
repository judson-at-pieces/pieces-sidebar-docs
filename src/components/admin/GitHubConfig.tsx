
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, Check, AlertCircle } from 'lucide-react';
import { githubService } from '@/services/githubService';
import { toast } from 'sonner';

export function GitHubConfig() {
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isConfigured, setIsConfigured] = useState(githubService.isConfigured());

  const verifyRepository = async (owner: string, repo: string, token: string) => {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/public/content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Repository not found or missing /public/content directory structure');
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const contents = await response.json();
      
      // Check if it's a directory and has some content files
      if (!Array.isArray(contents)) {
        throw new Error('Invalid repository structure: /public/content should be a directory');
      }

      // Look for some expected markdown files
      const hasMarkdownFiles = contents.some((item: any) => 
        item.name.endsWith('.md') || item.type === 'dir'
      );

      if (!hasMarkdownFiles) {
        throw new Error('Repository structure validation failed: No markdown files or subdirectories found in /public/content');
      }

      return true;
    } catch (error) {
      console.error('Repository verification failed:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!token || !owner || !repo) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    setVerifying(true);

    try {
      // Verify the repository structure
      await verifyRepository(owner, repo, token);
      
      // Configure the GitHub service
      githubService.configure(token, owner, repo);
      setIsConfigured(true);
      
      toast.success('GitHub configuration saved successfully!');
      
      // Clear the form
      setToken('');
      setOwner('');
      setRepo('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to configure GitHub');
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_owner');
    localStorage.removeItem('github_repo');
    setIsConfigured(false);
    toast.success('GitHub configuration removed');
  };

  if (isConfigured) {
    const currentOwner = localStorage.getItem('github_owner');
    const currentRepo = localStorage.getItem('github_repo');
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Github className="h-5 w-5" />
            <span>GitHub Integration</span>
            <Check className="h-4 w-4 text-green-600" />
          </CardTitle>
          <CardDescription>
            GitHub is configured and ready for creating pull requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
              <Check className="h-4 w-4" />
              <span className="font-medium">Connected to {currentOwner}/{currentRepo}</span>
            </div>
          </div>
          
          <Button onClick={handleDisconnect} variant="outline" className="w-full">
            Disconnect GitHub
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Github className="h-5 w-5" />
          <span>GitHub Integration</span>
        </CardTitle>
        <CardDescription>
          Configure GitHub repository for creating pull requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The repository must have a <code>/public/content</code> directory structure matching the documentation format.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="github-token">GitHub Personal Access Token</Label>
            <Input
              id="github-token"
              type="password"
              placeholder="ghp_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Create a token with "repo" permissions at{' '}
              <a 
                href="https://github.com/settings/tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub Settings
              </a>
            </p>
          </div>
          
          <div>
            <Label htmlFor="github-owner">Repository Owner/Organization</Label>
            <Input
              id="github-owner"
              placeholder="username or organization"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="github-repo">Repository Name</Label>
            <Input
              id="github-repo"
              placeholder="repository-name"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
            />
          </div>
        </div>
        
        {verifying && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Verifying repository structure...
            </AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={handleSave} 
          disabled={loading || !token || !owner || !repo}
          className="w-full"
        >
          {loading ? 'Configuring...' : 'Save GitHub Configuration'}
        </Button>
      </CardContent>
    </Card>
  );
}
