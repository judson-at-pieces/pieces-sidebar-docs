
import { EnhancedEditor } from "./EnhancedEditor";
import { githubAppService } from "@/services/githubAppService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface EditorMainProps {
  selectedFile?: string;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  hasChanges: boolean;
}

export function EditorMain({ selectedFile, content, onContentChange, onSave, hasChanges }: EditorMainProps) {
  const [saving, setSaving] = useState(false);
  const { user, hasRole } = useAuth();

  const handleSave = async () => {
    if (!selectedFile || !hasChanges) {
      console.log('Save blocked:', { selectedFile: !!selectedFile, hasChanges });
      return;
    }

    setSaving(true);
    console.log('=== Starting save process ===');
    console.log('Selected file:', selectedFile);
    console.log('Content length:', content.length);
    console.log('User role check:', { isAdmin: hasRole('admin'), isEditor: hasRole('editor') });
    
    try {
      // Use the RPC function that has SECURITY DEFINER to bypass RLS
      console.log('Fetching GitHub configuration via RPC...');
      const { data: configData, error: configError } = await supabase.rpc('get_current_github_config');
      
      console.log('GitHub config from RPC:', configData);
      console.log('Config error:', configError);
      
      if (configError) {
        console.error('Config error details:', configError);
        throw new Error(`Failed to get GitHub config: ${configError.message}`);
      }
      
      // Check if we got any configuration data
      if (!configData || !configData.repo_owner || !configData.repo_name) {
        console.error('No GitHub configuration found');
        
        // Show different messages based on user role
        if (hasRole('admin')) {
          toast.error(
            <div className="flex flex-col gap-2">
              <p>No GitHub repository configured.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = '/admin'}
                className="w-fit"
              >
                <Settings className="h-3 w-3 mr-1" />
                Configure in Admin Panel
              </Button>
            </div>,
            { duration: 8000 }
          );
        } else {
          toast.error(
            <div className="flex flex-col gap-1">
              <p>No GitHub repository configured.</p>
              <p className="text-xs text-muted-foreground">Please ask an administrator to configure a GitHub repository in the admin panel.</p>
            </div>,
            { duration: 6000 }
          );
        }
        return;
      }

      const { repo_owner, repo_name } = configData;
      console.log('Repository from config:', `${repo_owner}/${repo_name}`);

      // Get the installation_id from the github_config table with a direct query
      // This should work for editors if we update the RLS policy
      const { data: installationData, error: installationError } = await supabase
        .from('github_config')
        .select('installation_id')
        .eq('repo_owner', repo_owner)
        .eq('repo_name', repo_name)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('Installation data:', installationData);
      console.log('Installation error:', installationError);

      // If we can't get installation_id due to RLS, try to get it from github_installations table
      let installation_id = installationData?.installation_id;
      
      if (!installation_id) {
        console.log('Trying to get installation_id from github_installations table...');
        const { data: installations, error: installationsError } = await supabase
          .from('github_installations')
          .select('installation_id')
          .order('installed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (installations && !installationsError) {
          installation_id = installations.installation_id;
          console.log('Got installation_id from installations table:', installation_id);
        }
      }

      if (!installation_id) {
        console.error('No installation ID found');
        
        if (hasRole('admin')) {
          toast.error(
            <div className="flex flex-col gap-2">
              <p>GitHub App installation not found.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = '/admin'}
                className="w-fit"
              >
                <Settings className="h-3 w-3 mr-1" />
                Reconfigure Repository
              </Button>
            </div>,
            { duration: 8000 }
          );
        } else {
          toast.error(
            <div className="flex flex-col gap-1">
              <p>GitHub App installation not found.</p>
              <p className="text-xs text-muted-foreground">Please ask an administrator to reconfigure the repository.</p>
            </div>,
            { duration: 6000 }
          );
        }
        return;
      }

      console.log('Using installation ID:', installation_id);
      console.log('Creating PR for repository:', `${repo_owner}/${repo_name}`);
      console.log('File path will be:', `public/content/${selectedFile}`);

      // Test if we can access the installation repositories first
      try {
        console.log('Testing repository access...');
        const repos = await githubAppService.getInstallationRepositories(installation_id);
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

      // Create PR body with user email
      const userEmail = user?.email || 'Unknown user';
      const userRole = hasRole('admin') ? 'Admin' : 'Editor';
      const prBody = `Automated documentation update for ${selectedFile}

Updated via Pieces Documentation Editor by: ${userEmail} (${userRole})`;

      // Create PR using GitHub App
      console.log('Creating branch and PR...');
      const result = await githubAppService.createBranchAndPR(
        installation_id,
        repo_owner,
        repo_name,
        {
          title: `Update ${selectedFile}`,
          body: prBody,
          files: [{
            path: `public/content/${selectedFile}`,
            content: content
          }]
        }
      );

      console.log('PR creation result:', result);

      if (result.success) {
        console.log('About to show success toast...');
        
        // Show success toast with clickable PR link
        const toastId = toast.success(
          <div className="flex items-center justify-between w-full gap-2">
            <span className="flex-1">Pull request created successfully! PR #{result.prNumber}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Opening PR URL:', result.prUrl);
                window.open(result.prUrl, '_blank', 'noopener,noreferrer');
              }}
              className="shrink-0"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View PR
            </Button>
          </div>,
          {
            duration: 10000, // Show for 10 seconds
          }
        );
        
        console.log('Toast shown with ID:', toastId);
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
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please ensure you have the necessary role to save changes.';
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
