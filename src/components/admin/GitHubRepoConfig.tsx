import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Check } from 'lucide-react';
import { GitHubRepoSelector } from './GitHubRepoSelector';
import { githubService } from '@/services/githubService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function GitHubRepoConfig() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<{ owner: string; repo: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      setLoading(true);
      console.log('Loading current GitHub configuration...');
      
      const config = await githubService.getRepoConfig();
      if (config) {
        console.log('Found GitHub configuration:', config);
        setCurrentConfig(config);
        setIsConfigured(true);
      } else {
        console.log('No GitHub configuration found');
        setIsConfigured(false);
        setCurrentConfig(null);
      }
    } catch (error) {
      console.error('Error loading GitHub config:', error);
      toast.error('Failed to load GitHub configuration');
      setIsConfigured(false);
      setCurrentConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRepoConfigured = () => {
    loadCurrentConfig();
  };

  const handleDisconnect = async () => {
    try {
      console.log('Disconnecting GitHub repository configuration...');
      
      // Delete all GitHub configurations (we only keep the latest one anyway)
      const { error } = await supabase
        .from('github_config')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        console.error('Error removing GitHub config:', error);
        toast.error('Failed to remove repository configuration');
        return;
      }

      setIsConfigured(false);
      setCurrentConfig(null);
      toast.success('GitHub repository configuration removed');
    } catch (error) {
      console.error('Error disconnecting GitHub config:', error);
      toast.error('Failed to remove repository configuration');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Github className="h-5 w-5" />
            <span>GitHub Repository</span>
          </CardTitle>
          <CardDescription>
            Loading repository configuration...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

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
            Repository is configured for automatic branching and pull requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
              <Check className="h-4 w-4" />
              <span className="font-medium">Connected to {currentConfig.owner}/{currentConfig.repo}</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-300 mt-1">
              Edits will automatically create branches and pull requests
            </p>
          </div>
          
          <Button onClick={handleDisconnect} variant="outline" className="w-full">
            Disconnect Repository
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <GitHubRepoSelector onRepoConfigured={handleRepoConfigured} />;
}
