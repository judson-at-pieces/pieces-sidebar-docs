import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { githubService } from '@/services/githubService';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SeoEditorProps {
  filePath: string;
}

interface SeoMetadata {
  title: string;
  description: string;
  keywords: string[];
}

export function SeoEditor({ filePath }: SeoEditorProps) {
  const [seoMetadata, setSeoMetadata] = useState<SeoMetadata>({
    title: '',
    description: '',
    keywords: [],
  });
  const [creatingPR, setCreatingPR] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkSeoData, setBulkSeoData] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);

  useEffect(() => {
    // Load existing SEO metadata from file (if it exists)
    const loadSeoMetadata = async () => {
      try {
        const response = await fetch(`/seo-metadata.json`);
        if (response.ok) {
          const data = await response.json();
          setSeoMetadata(data);
        }
      } catch (error) {
        console.error('Error loading SEO metadata:', error);
      }
    };

    loadSeoMetadata();
  }, [filePath]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSeoMetadata(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const keywordsArray = value.split(',').map(keyword => keyword.trim());
    setSeoMetadata(prev => ({
      ...prev,
      keywords: keywordsArray,
    }));
  };

  const handleCreatePR = async () => {
    if (!seoMetadata.title || !seoMetadata.description) {
      toast.error('Please fill in all required SEO fields before creating a PR');
      return;
    }

    setCreatingPR(true);
    
    try {
      const token = await getGitHubAppToken();
      const repoConfig = await githubService.getRepoConfig();
      
      if (!repoConfig) {
        toast.error('No GitHub repository configured. Please configure a repository first.');
        return;
      }

      // Create SEO metadata file
      const seoData = {
        path: 'public/seo-metadata.json',
        content: JSON.stringify(seoMetadata, null, 2)
      };

      const result = await githubService.createPullRequest(
        {
          title: `Update SEO metadata`,
          body: `Updated SEO metadata:\n- Title: ${seoMetadata.title}\n- Description: ${seoMetadata.description}\n- Keywords: ${seoMetadata.keywords.join(', ')}\n\nThis pull request was created from the SEO editor.`,
          files: [seoData],
          baseBranch: 'main' // Add the required baseBranch property
        },
        token,
        repoConfig
      );

      if (result.success) {
        toast.success('SEO metadata PR created successfully!', {
          action: {
            label: 'View PR',
            onClick: () => window.open(result.prUrl, '_blank')
          }
        });
      } else {
        toast.error(result.error || 'Failed to create pull request');
      }
    } catch (error) {
      console.error('Error creating SEO PR:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create pull request');
    } finally {
      setCreatingPR(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkSeoData.trim()) {
      toast.error('Please enter SEO data to import');
      return;
    }

    setBulkImporting(true);
    
    try {
      const token = await getGitHubAppToken();
      const repoConfig = await githubService.getRepoConfig();
      
      if (!repoConfig) {
        toast.error('No GitHub repository configured. Please configure a repository first.');
        return;
      }

      // Create bulk SEO data file
      const bulkData = {
        path: 'public/bulk-seo-data.json',
        content: bulkSeoData
      };

      const result = await githubService.createPullRequest(
        {
          title: `Bulk import SEO metadata`,
          body: `Bulk imported SEO metadata from CSV/JSON format.\n\nThis pull request was created from the SEO editor bulk import feature.`,
          files: [bulkData],
          baseBranch: 'main' // Add the required baseBranch property
        },
        token,
        repoConfig
      );

      if (result.success) {
        toast.success('Bulk SEO import PR created successfully!', {
          action: {
            label: 'View PR',
            onClick: () => window.open(result.prUrl, '_blank')
          }
        });
        setBulkSeoData('');
        setShowBulkImport(false);
      } else {
        toast.error(result.error || 'Failed to create pull request');
      }
    } catch (error) {
      console.error('Error creating bulk SEO PR:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create pull request');
    } finally {
      setBulkImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="seo-title">Title</Label>
        <Input
          type="text"
          id="seo-title"
          name="title"
          value={seoMetadata.title}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <Label htmlFor="seo-description">Description</Label>
        <Textarea
          id="seo-description"
          name="description"
          value={seoMetadata.description}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <Label htmlFor="seo-keywords">Keywords (comma-separated)</Label>
        <Input
          type="text"
          id="seo-keywords"
          value={seoMetadata.keywords.join(', ')}
          onChange={handleKeywordsChange}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleCreatePR} disabled={creatingPR}>
          {creatingPR ? 'Creating PR...' : 'Create Pull Request'}
        </Button>
        <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
          <DialogTrigger asChild>
            <Button variant="outline">Bulk Import</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Import SEO Data</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Enter SEO data in JSON or CSV format"
              value={bulkSeoData}
              onChange={(e) => setBulkSeoData(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Button type="button" variant="secondary" onClick={() => setShowBulkImport(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleBulkImport} disabled={bulkImporting}>
                {bulkImporting ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
