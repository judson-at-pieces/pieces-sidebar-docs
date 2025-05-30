import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, Check, AlertCircle } from 'lucide-react';
import { githubService } from '@/services/githubService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function GitHubRepoConfig() {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<{ owner: string; repo: string } | null>(null);
  const { user } = useAuth();

  // Load current configuration on component mount
  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const config = await githubService.getRepoConfig();
      if (config) {
        setCurrentConfig(config);
        setIsConfigured(true);
      } else {
        setIsConfigured(false);
        setCurrentConfig(null);
      }
    } catch (error) {
      console.error('Error loading GitHub config:', error);
    }
  };

  const handleSave = async () => {
    if (!owner || !repo) {
      toast.error('Please fill in both owner and repository name');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to configure GitHub');
      return;
    }

    setLoading(true);
    setVerifying(true);

    try {
      // Get the user's GitHub access token
      const { data: { session } } = await supabase.auth.getSession();
      const githubToken = session?.provider_token;

      if (!githubToken) {
        toast.error('GitHub access token not found. Please sign out and sign back in.');
        return;
      }

      // Verify the repository structure
      await githubService.verifyRepository(owner, repo, githubToken);
      
      // Save the repository configuration to Supabase
      const success = await githubService.setRepoConfig(owner, repo);
      
      if (success) {
        setIsConfigured(true);
        setCurrentConfig({ owner, repo });
        toast.success('GitHub repository configured successfully!');
        
        // Clear the form
        setOwner('');
        setRepo('');
      } else {
        toast.error('Failed to save repository configuration');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to configure GitHub repository');
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      // Delete all GitHub configurations (we only keep the latest one anyway)
      const { error } = await supabase
        .from('github_config')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        toast.error('Failed to remove repository configuration');
        return;
      }

      setIsConfigured(false);
      setCurrentConfig(null);
      toast.success('GitHub repository configuration removed');
    } catch (error) {
      toast.error('Failed to remove repository configuration');
    }
  };

  if (isConfigured && currentConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Github className="h-5 w-5" />
            <span>GitHub Repository</span>
            <Check className="h-4 w-4 text-green-600" />
          </CardTitle>
          <CardDescription>
            Repository is configured for creating pull requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
              <Check className="h-4 w-4" />
              <span className="font-medium">Connected to {currentConfig.owner}/{currentConfig.repo}</span>
            </div>
          </div>
          
          <Button onClick={handleDisconnect} variant="outline" className="w-full">
            Disconnect Repository
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
          <span>GitHub Repository</span>
        </CardTitle>
        <CardDescription>
          Configure the GitHub repository for creating pull requests
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
          disabled={loading || !owner || !repo}
          className="w-full"
        >
          {loading ? 'Configuring...' : 'Save Repository Configuration'}
        </Button>
      </CardContent>
    </Card>
  );
}
