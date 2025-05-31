
import { EnhancedEditor } from "./EnhancedEditor";
import { githubAppService } from "@/services/githubAppService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface EditorMainProps {
  selectedFile?: string;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  hasChanges: boolean;
}

export function EditorMain({ selectedFile, content, onContentChange, onSave, hasChanges }: EditorMainProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedFile || !hasChanges) {
      console.log('Save blocked:', { selectedFile: !!selectedFile, hasChanges });
      return;
    }

    setSaving(true);
    console.log('=== Starting save process ===');
    console.log('Selected file:', selectedFile);
    console.log('Content length:', content.length);
    
    try {
      // Get GitHub configuration
      console.log('Fetching GitHub configuration...');
      const { data: configData, error: configError } = await supabase.rpc('get_current_github_config');
      
      console.log('GitHub config from database:', configData);
      console.log('Config error:', configError);
      
      if (configError) {
        console.error('Config error details:', configError);
        throw new Error(`Failed to get GitHub config: ${configError.message}`);
      }
      
      if (!configData || configData.length === 0) {
        console.error('No GitHub configuration found');
        toast.error('No GitHub repository configured. Please configure a repository in the admin panel.');
        return;
      }

      const { repo_owner, repo_name } = configData[0];
      console.log('Repository from config:', `${repo_owner}/${repo_name}`);

      // Get the installation ID for this repository
      console.log('Fetching installation ID...');
      const { data: githubConfig, error: installationError } = await supabase
        .from('github_config')
        .select('installation_id')
        .eq('repo_owner', repo_owner)
        .eq('repo_name', repo_name)
        .single();

      console.log('Installation config:', githubConfig);
      console.log('Installation error:', installationError);

      if (installationError) {
        console.error('Installation error details:', installationError);
        throw new Error(`Failed to get installation config: ${installationError.message}`);
      }

      if (!githubConfig?.installation_id) {
        console.error('No installation ID found');
        toast.error('GitHub App installation not found. Please reconfigure the repository in the admin panel.');
        return;
      }

      console.log('Using installation ID:', githubConfig.installation_id);
      console.log('Creating PR for repository:', `${repo_owner}/${repo_name}`);
      console.log('File path will be:', `public/content/${selectedFile}`);

      // Test if we can access the installation repositories first
      try {
        console.log('Testing repository access...');
        const repos = await githubAppService.getInstallationRepositories(githubConfig.installation_id);
        console.log('Available repositories:', repos.map(r => r.full_name));
        
        const targetRepo = repos.find(r => r.full_name === `${repo_owner}/${repo_name}`);
        if (!targetRepo) {
          console.error('Target repository not found in accessible repos');
          toast.error(`Repository ${repo_owner}/${repo_name} is not accessible by the GitHub App. Please ensure the app is installed on this repository.`);
          return;
        }
        console.log('Target repository found:', targetRepo);
      } catch (repoError) {
        console.error('Error checking repository access:', repoError);
        toast.error('Failed to verify repository access. Please check the GitHub App installation.');
        return;
      }

      // Create PR using GitHub App
      console.log('Creating branch and PR...');
      const result = await githubAppService.createBranchAndPR(
        githubConfig.installation_id,
        repo_owner,
        repo_name,
        {
          title: `Update ${selectedFile}`,
          body: `Automated documentation update for ${selectedFile}\n\nUpdated via Pieces Documentation Editor.`,
          files: [{
            path: `public/content/${selectedFile}`,
            content: content
          }]
        }
      );

      console.log('PR creation result:', result);

      if (result.success) {
        // Show success toast with clickable PR link - NO automatic opening
        toast.success(
          <div className="flex items-center justify-between w-full">
            <span>Pull request created successfully! PR #{result.prNumber}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(result.prUrl, '_blank')}
              className="ml-2"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View PR
            </Button>
          </div>,
          {
            duration: 10000, // Show for 10 seconds
          }
        );
        onSave(); // Mark as saved
        console.log('Save process completed successfully');
      } else {
        console.error('PR creation failed - no success flag');
        throw new Error('Failed to create pull request');
      }
    } catch (error: any) {
      console.error('=== Save process failed ===');
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);
      
      // More specific error handling
      let errorMessage = error.message || 'Failed to save changes';
      
      if (error.message?.includes('installation_id')) {
        errorMessage = 'GitHub App installation issue. Please check the admin panel configuration.';
      } else if (error.message?.includes('repository')) {
        errorMessage = 'Repository access issue. Please verify the GitHub App is installed on the target repository.';
      } else if (error.message?.includes('authentication')) {
        errorMessage = 'Authentication failed. Please try signing out and back in.';
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
      console.log('=== Save process ended ===');
    }
  };

  return (
    <EnhancedEditor
      selectedFile={selectedFile}
      content={content}
      onContentChange={onContentChange}
      onSave={handleSave}
      hasChanges={hasChanges}
      saving={saving}
    />
  );
}
