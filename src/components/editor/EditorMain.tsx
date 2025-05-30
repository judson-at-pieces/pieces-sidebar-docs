
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, Edit, ExternalLink } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { githubAppService } from "@/services/githubAppService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditorMainProps {
  selectedFile?: string;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  hasChanges: boolean;
}

export function EditorMain({ selectedFile, content, onContentChange, onSave, hasChanges }: EditorMainProps) {
  const [activeTab, setActiveTab] = useState("edit");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedFile || !hasChanges) return;

    setSaving(true);
    try {
      console.log('=== Starting save process ===');
      
      // Get GitHub configuration
      const { data: configData, error: configError } = await supabase.rpc('get_current_github_config');
      
      console.log('GitHub config from database:', configData);
      console.log('Config error:', configError);
      
      if (configError) {
        throw new Error(`Failed to get GitHub config: ${configError.message}`);
      }
      
      if (!configData || configData.length === 0) {
        toast.error('No GitHub repository configured. Please configure a repository in the admin panel.');
        return;
      }

      const { repo_owner, repo_name } = configData[0];
      console.log('Repository from config:', `${repo_owner}/${repo_name}`);

      // Get the installation ID for this repository
      const { data: githubConfig, error: installationError } = await supabase
        .from('github_config')
        .select('installation_id')
        .eq('repo_owner', repo_owner)
        .eq('repo_name', repo_name)
        .single();

      console.log('Installation config:', githubConfig);
      console.log('Installation error:', installationError);

      if (installationError) {
        throw new Error(`Failed to get installation config: ${installationError.message}`);
      }

      if (!githubConfig?.installation_id) {
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
      const result = await githubAppService.createBranchAndPR(
        githubConfig.installation_id,
        repo_owner,
        repo_name,
        {
          title: `Update ${selectedFile}`,
          body: `Automated documentation update for ${selectedFile}`,
          files: [{
            path: `public/content/${selectedFile}`,
            content: content
          }]
        }
      );

      if (result.success) {
        // Show success toast with clickable PR link
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
      } else {
        throw new Error('Failed to create pull request');
      }
    } catch (error: any) {
      console.error('=== Save process failed ===');
      console.error('Error details:', error);
      toast.error(error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground">No file selected</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Select a file from the sidebar to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Editor toolbar */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{selectedFile}</span>
            {hasChanges && <span className="text-xs text-muted-foreground">• Modified</span>}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Creating PR...' : 'Save & Create PR'}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="w-fit mx-4 mt-4">
            <TabsTrigger value="edit" className="flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 p-4 m-0">
            <Textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="w-full h-full resize-none font-mono text-sm"
              placeholder="Start writing your documentation..."
            />
          </TabsContent>

          <TabsContent value="preview" className="flex-1 p-4 m-0 overflow-y-auto">
            <div className="max-w-none">
              <MarkdownRenderer content={content} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
