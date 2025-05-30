
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github, Save, Check } from 'lucide-react';
import { toast } from 'sonner';

export function GitHubRepoConfig() {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<string | null>(null);

  useEffect(() => {
    // Load current configuration
    const saved = localStorage.getItem('github_repo_config');
    if (saved) {
      setCurrentConfig(saved);
      const [savedOwner, savedRepo] = saved.split('/');
      setOwner(savedOwner || '');
      setRepo(savedRepo || '');
    }
  }, []);

  const handleSave = () => {
    if (!owner.trim() || !repo.trim()) {
      toast.error('Please enter both username/organization and repository name');
      return;
    }

    setLoading(true);
    const repoConfig = `${owner.trim()}/${repo.trim()}`;
    
    try {
      localStorage.setItem('github_repo_config', repoConfig);
      setCurrentConfig(repoConfig);
      toast.success('Repository configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save repository configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Github className="h-5 w-5" />
          <span>GitHub Repository Configuration</span>
        </CardTitle>
        <CardDescription>
          Configure the repository where documentation pull requests will be created
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="owner">Username/Organization</Label>
            <Input
              id="owner"
              placeholder="your-username"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repo">Repository Name</Label>
            <Input
              id="repo"
              placeholder="your-repo-name"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
            />
          </div>
        </div>

        <Button 
          onClick={handleSave}
          disabled={loading}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Configuration'}
        </Button>

        {currentConfig && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              Pull requests will be created in <strong>{currentConfig}</strong>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>Note:</strong> Make sure you have push access to the repository and that you're signed in with GitHub OAuth.</p>
        </div>
      </CardContent>
    </Card>
  );
}
