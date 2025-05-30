
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, Edit } from "lucide-react";
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
      // Get GitHub configuration
      const { data: configData } = await supabase.rpc('get_current_github_config');
      
      if (!configData || configData.length === 0) {
        toast.error('No GitHub repository configured. Please configure a repository in the admin panel.');
        return;
      }

      const { repo_owner, repo_name } = configData[0];

      // Get the installation ID for this repository
      const { data: githubConfig, error: configError } = await supabase
        .from('github_config')
        .select('installation_id')
        .eq('repo_owner', repo_owner)
        .eq('repo_name', repo_name)
        .single();

      if (configError || !githubConfig?.installation_id) {
        toast.error('GitHub App installation not found. Please reconfigure the repository.');
        return;
      }

      console.log('Creating PR with GitHub App for:', `${repo_owner}/${repo_name}`);
      console.log('Installation ID:', githubConfig.installation_id);

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
        toast.success(`Pull request created successfully! PR #${result.prNumber}`);
        onSave(); // Mark as saved
        
        // Optionally open the PR in a new tab
        if (result.prUrl) {
          window.open(result.prUrl, '_blank');
        }
      } else {
        throw new Error('Failed to create pull request');
      }
    } catch (error: any) {
      console.error('Error saving file:', error);
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
