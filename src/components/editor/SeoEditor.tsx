import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { githubService } from '@/services/githubService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FileTreeSidebar } from './FileTreeSidebar';
import { FileNode } from '@/hooks/useFileStructure';

interface SeoEditorProps {
  selectedFile?: string;
  onSeoDataChange: (seoData: any) => void;
  fileStructure: FileNode[];
  onFileSelect: (filePath: string) => void;
}

export function SeoEditor({ selectedFile, onSeoDataChange, fileStructure, onFileSelect }: SeoEditorProps) {
  const [globalTitle, setGlobalTitle] = useState('');
  const [globalDescription, setGlobalDescription] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [noIndex, setNoIndex] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Load global SEO settings from database
    const loadGlobalSEO = async () => {
      try {
        const { data, error } = await supabase
          .from('seo_settings')
          .select('title, description')
          .single();

        if (error) {
          console.error('Error loading global SEO settings:', error);
        } else if (data) {
          setGlobalTitle(data.title || '');
          setGlobalDescription(data.description || '');
        }
      } catch (error) {
        console.error('Error loading global SEO settings:', error);
      }
    };

    loadGlobalSEO();
  }, []);

  useEffect(() => {
    // Load page-specific SEO settings from database
    const loadPageSEO = async () => {
      if (!selectedFile) return;

      try {
        const { data, error } = await supabase
          .from('page_seo_settings')
          .select('title, description, no_index')
          .eq('file_path', selectedFile)
          .single();

        if (error) {
          console.error('Error loading page SEO settings:', error);
        } else if (data) {
          setPageTitle(data.title || '');
          setPageDescription(data.description || '');
          setNoIndex(data.no_index || false);
        } else {
          // Reset if no data found for the selected file
          setPageTitle('');
          setPageDescription('');
          setNoIndex(false);
        }
      } catch (error) {
        console.error('Error loading page SEO settings:', error);
      }
    };

    loadPageSEO();
  }, [selectedFile]);

  const handleSaveGlobalSEO = async () => {
    try {
      const { error } = await supabase
        .from('seo_settings')
        .upsert({
          id: 1, // Assuming a single row for global settings
          title: globalTitle,
          description: globalDescription,
        }, { onConflict: ['id'] });

      if (error) {
        console.error('Error saving global SEO settings:', error);
        toast.error('Failed to save global SEO settings');
      } else {
        toast.success('Global SEO settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving global SEO settings:', error);
      toast.error('Failed to save global SEO settings');
    }
  };

  const handleSavePageSEO = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      const { error } = await supabase
        .from('page_seo_settings')
        .upsert({
          file_path: selectedFile,
          title: pageTitle,
          description: pageDescription,
          no_index: noIndex,
        }, { onConflict: ['file_path'] });

      if (error) {
        console.error('Error saving page SEO settings:', error);
        toast.error('Failed to save page SEO settings');
      } else {
        toast.success('Page SEO settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving page SEO settings:', error);
      toast.error('Failed to save page SEO settings');
    }
  };

  const getGitHubAppToken = async () => {
    try {
      const { data: installations, error } = await supabase
        .from('github_installations')
        .select('installation_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !installations) {
        throw new Error('No GitHub app installation found');
      }

      const { data, error: tokenError } = await supabase.functions.invoke('github-app-auth', {
        body: { installationId: installations.installation_id }
      });

      if (tokenError) {
        throw new Error('Failed to get GitHub app token');
      }

      return data.token;
    } catch (error) {
      console.error('Error getting GitHub app token:', error);
      throw error;
    }
  };

  const handleCreateGlobalSEOPR = async () => {
    try {
      toast.info('Creating pull request...', { duration: 2000 });

      // Get GitHub configuration first
      const config = await githubService.getRepoConfig();
      if (!config) {
        toast.error('GitHub repository not configured. Please configure it in Admin settings.', { duration: 5000 });
        return;
      }

      // Get the installation ID from the config
      const { data: configData, error: configError } = await supabase
        .from('github_config')
        .select('installation_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (configError || !configData?.installation_id) {
        toast.error('GitHub App not properly configured. Please check Admin settings.', { duration: 5000 });
        return;
      }

      console.log('Getting GitHub App token for installation:', configData.installation_id);

      // Get GitHub App installation token using your existing edge function
      const githubToken = await getGitHubAppToken();
      const { owner, repo } = config;

      // Construct the SEO file content
      const seoContent = `
        title: ${globalTitle}
        description: ${globalDescription}
      `;

      // Get user information for PR attribution
      const userEmail = user?.email || 'unknown@pieces.app';
      const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split('@')[0];

      const title = `Update global SEO settings`;
      const body = `This pull request updates the global SEO settings via the Pieces documentation editor.

## Changes
- Updated global SEO settings

## Authored By
- **Editor:** ${userName} (${userEmail})
- **Date:** ${new Date().toISOString().split('T')[0]}

## Review Notes
Please review the changes and merge when ready.

---
*This PR was created automatically by the Pieces Documentation Editor*`;

      const files = [
        {
          path: 'seo.config.json', // Example path, adjust as needed
          content: seoContent
        }
      ];

      console.log('Creating PR with GitHub App token for:', {
        title,
        files,
        owner,
        repo,
        installationId: configData.installation_id
      });

      const result = await githubService.createPullRequest(
        {
          title,
          body,
          files,
          baseBranch: 'main', // Add missing baseBranch
          headBranch: `seo-update-${Date.now()}`,
          useExistingBranch: false
        },
        githubToken,
        config
      );

      if (result.success) {
        toast.success(`Pull request created successfully!`, {
          duration: 5000,
          action: {
            label: 'View PR',
            onClick: () => window.open(result.prUrl, '_blank')
          }
        });
      } else {
        throw new Error(result.error || 'Failed to create PR');
      }
    } catch (error: any) {
      console.error('PR creation failed:', error);

      // Provide more specific error messages
      if (error.message?.includes('401') || error.message?.includes('Authentication failed')) {
        toast.error('GitHub App authentication failed. Please check the GitHub App configuration in Admin settings.', {
          duration: 5000,
          action: {
            label: 'Go to Admin',
            onClick: () => window.location.href = '/admin'
          }
        });
      } else if (error.message?.includes('403') || error.message?.includes('Access forbidden')) {
        toast.error('Access forbidden. Please ensure the GitHub App is installed on the repository with proper permissions.', { duration: 5000 });
      } else if (error.message?.includes('404')) {
        toast.error('Repository not found. Please check the repository configuration in Admin settings.', { duration: 5000 });
      } else {
        toast.error(`Failed to create pull request: ${error.message || 'Unknown error'}`, { duration: 5000 });
      }
    }
  };

  const handleCreatePageSEOPR = async () => {
    try {
      toast.info('Creating pull request...', { duration: 2000 });

      // Get GitHub configuration first
      const config = await githubService.getRepoConfig();
      if (!config) {
        toast.error('GitHub repository not configured. Please configure it in Admin settings.', { duration: 5000 });
        return;
      }

      // Check if we have the file path
      if (!selectedFile) {
        toast.error('No file selected for editing. Please select a file first.', { duration: 3000 });
        return;
      }

      // Get the installation ID from the config
      const { data: configData, error: configError } = await supabase
        .from('github_config')
        .select('installation_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (configError || !configData?.installation_id) {
        toast.error('GitHub App not properly configured. Please check Admin settings.', { duration: 5000 });
        return;
      }

      console.log('Getting GitHub App token for installation:', configData.installation_id);

      // Get GitHub App installation token using your existing edge function
      const githubToken = await getGitHubAppToken();
      const { owner, repo } = config;

      // Construct the SEO file content
      const seoContent = `
        title: ${pageTitle}
        description: ${pageDescription}
        noIndex: ${noIndex}
      `;

      // Get user information for PR attribution
      const userEmail = user?.email || 'unknown@pieces.app';
      const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split('@')[0];

      const title = `Update SEO settings for ${selectedFile}`;
      const body = `This pull request updates the SEO settings for the page ${selectedFile} via the Pieces documentation editor.

## Changes
- Updated SEO settings for ${selectedFile}

## Authored By
- **Editor:** ${userName} (${userEmail})
- **Date:** ${new Date().toISOString().split('T')[0]}

## Review Notes
Please review the changes and merge when ready.

---
*This PR was created automatically by the Pieces Documentation Editor*`;

      const files = [
        {
          path: `seo/${selectedFile}.json`, // Example path, adjust as needed
          content: seoContent
        }
      ];

      console.log('Creating PR with GitHub App token for:', {
        title,
        files,
        owner,
        repo,
        installationId: configData.installation_id
      });

      const result = await githubService.createPullRequest(
        {
          title,
          body,
          files,
          baseBranch: 'main', // Add missing baseBranch
          headBranch: `seo-page-update-${Date.now()}`,
          useExistingBranch: false
        },
        githubToken,
        config
      );

      if (result.success) {
        toast.success(`Pull request created successfully!`, {
          duration: 5000,
          action: {
            label: 'View PR',
            onClick: () => window.open(result.prUrl, '_blank')
          }
        });
      } else {
        throw new Error(result.error || 'Failed to create PR');
      }
    } catch (error: any) {
      console.error('PR creation failed:', error);

      // Provide more specific error messages
      if (error.message?.includes('401') || error.message?.includes('Authentication failed')) {
        toast.error('GitHub App authentication failed. Please check the GitHub App configuration in Admin settings.', {
          duration: 5000,
          action: {
            label: 'Go to Admin',
            onClick: () => window.location.href = '/admin'
          }
        });
      } else if (error.message?.includes('403') || error.message?.includes('Access forbidden')) {
        toast.error('Access forbidden. Please ensure the GitHub App is installed on the repository with proper permissions.', { duration: 5000 });
      } else if (error.message?.includes('404')) {
        toast.error('Repository not found. Please check the repository configuration in Admin settings.', { duration: 5000 });
      } else {
        toast.error(`Failed to create pull request: ${error.message || 'Unknown error'}`, { duration: 5000 });
      }
    }
  };

  return (
    <div className="flex h-full">
      {/* File Tree Sidebar */}
      <div className="w-64 border-r border-border p-4">
        <h3 className="text-sm font-semibold mb-2">Content Structure</h3>
        <FileTreeSidebar 
          title="Content Files"
          description="Select a file to edit SEO settings"
          fileStructure={fileStructure} 
          onFileSelect={onFileSelect} 
          selectedFile={selectedFile} 
        />
      </div>

      {/* SEO Editor Content */}
      <div className="flex-1 p-6">
        <h2 className="text-lg font-semibold mb-4">SEO Editor</h2>

        {/* Global SEO Settings */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-md font-semibold">Global SEO Settings</h3>
            <p className="text-sm text-muted-foreground">These settings apply to the entire site.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="global-title">Global Title</Label>
              <Input
                id="global-title"
                value={globalTitle}
                onChange={(e) => setGlobalTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="global-description">Global Description</Label>
              <Textarea
                id="global-description"
                value={globalDescription}
                onChange={(e) => setGlobalDescription(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveGlobalSEO} className="mr-2">Save Global SEO</Button>
            <Button onClick={handleCreateGlobalSEOPR} variant="outline">
              Create Global SEO PR
            </Button>
          </CardFooter>
        </Card>

        {/* Page-Specific SEO Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-md font-semibold">Page-Specific SEO Settings</h3>
            <p className="text-sm text-muted-foreground">
              These settings apply only to the selected page: <strong>{selectedFile}</strong>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="page-title">Page Title</Label>
              <Input
                id="page-title"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                disabled={!selectedFile}
              />
            </div>
            <div>
              <Label htmlFor="page-description">Page Description</Label>
              <Textarea
                id="page-description"
                value={pageDescription}
                onChange={(e) => setPageDescription(e.target.value)}
                disabled={!selectedFile}
              />
            </div>
            <div>
              <Label htmlFor="no-index">No Index</Label>
              <Switch
                id="no-index"
                checked={noIndex}
                onCheckedChange={(checked) => setNoIndex(checked)}
                disabled={!selectedFile}
              />
              <p className="text-sm text-muted-foreground">
                Prevent search engines from indexing this page.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSavePageSEO} className="mr-2" disabled={!selectedFile}>
              Save Page SEO
            </Button>
            <Button onClick={handleCreatePageSEOPR} variant="outline" disabled={!selectedFile}>
              Create Page SEO PR
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
