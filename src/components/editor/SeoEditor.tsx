import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Globe, Search, Image, Hash, Clock, Users, BarChart, Folder, FolderOpen, ChevronDown, ChevronRight, Save, GitBranch, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { FileNode } from "@/utils/fileSystem";
import { useSeoData } from "@/hooks/useSeoData";
import { useDocumentSeo } from "@/hooks/useDocumentSeo";
import { githubService } from "@/services/githubService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import type { SeoData } from "@/hooks/useSeoData";

interface SeoEditorProps {
  selectedFile?: string;
  onSeoDataChange: (data: SeoData) => void;
  fileStructure?: FileNode[];
  onFileSelect?: (filePath: string) => void;
}

// File tree component for SEO navigation
function FileTreeItem({ 
  node, 
  selectedFile, 
  onFileSelect, 
  depth = 0,
  pendingChanges
}: { 
  node: FileNode; 
  selectedFile?: string; 
  onFileSelect?: (filePath: string) => void;
  depth?: number;
  pendingChanges: string[];
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isFile = node.type === 'file';
  const isSelected = selectedFile === node.path;
  const hasChanges = pendingChanges.includes(node.path);

  const handleClick = () => {
    if (isFile && onFileSelect) {
      onFileSelect(node.path);
    } else if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div>
      <div 
        className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-accent/50 rounded-sm ${
          isSelected ? 'bg-accent' : ''
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {hasChildren && (
          <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}
        
        {!hasChildren && <div className="w-4" />}
        
        {isFile ? (
          <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
        ) : hasChildren ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
          )
        ) : null}
        
        <span className="text-sm truncate flex-1">
          {node.name}
        </span>
        
        {hasChanges && (
          <div className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {node.children?.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              depth={depth + 1}
              pendingChanges={pendingChanges}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SeoEditor({ selectedFile, onSeoDataChange, fileStructure, onFileSelect }: SeoEditorProps) {
  const { seoData, updateSeoData, saveAllChanges, pendingChanges, isSaving, hasUnsavedChanges } = useSeoData(selectedFile);
  const { user } = useAuth();
  const [newKeyword, setNewKeyword] = useState("");
  const [newMetaName, setNewMetaName] = useState("");
  const [newMetaContent, setNewMetaContent] = useState("");
  const [newMetaProperty, setNewMetaProperty] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);

  useDocumentSeo(previewMode ? seoData : {});

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info', options?: any) => {
    if (type === 'success') {
      toast.success(message, options);
    } else if (type === 'error') {
      toast.error(message, options);
    } else {
      toast.info(message, options);
    }
  };

  // Helper function to load existing file content
  const loadExistingContent = async (filePath: string): Promise<string> => {
    try {
      let markdownPath = filePath;
      if (!markdownPath.endsWith('.md')) {
        markdownPath = `${filePath}.md`;
      }
      markdownPath = markdownPath.replace(/^\/+/, '');
      
      const response = await fetch(`/content/${markdownPath}`);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      console.warn('Could not load existing content:', error);
    }
    
    // Return default content if file doesn't exist
    return `# ${seoData.metaTitle || seoData.title || 'Page Title'}

${seoData.metaDescription || seoData.description || 'Page content goes here...'}`;
  };

  const handleSeoChange = (updates: Partial<SeoData>) => {
    updateSeoData(updates);
    onSeoDataChange({ ...seoData, ...updates });
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !seoData.keywords.includes(newKeyword.trim())) {
      handleSeoChange({
        keywords: [...seoData.keywords, newKeyword.trim()]
      });
      setNewKeyword("");
      showToast("Keyword added", "success");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    handleSeoChange({
      keywords: seoData.keywords.filter(k => k !== keyword)
    });
    showToast("Keyword removed", "success");
  };

  const handleAddCustomMeta = () => {
    if (newMetaName.trim() && newMetaContent.trim()) {
      handleSeoChange({
        customMeta: [...seoData.customMeta, {
          name: newMetaName.trim(),
          content: newMetaContent.trim(),
          property: newMetaProperty.trim() || undefined
        }]
      });
      setNewMetaName("");
      setNewMetaContent("");
      setNewMetaProperty("");
      showToast("Custom meta tag added", "success");
    }
  };

  const handleRemoveCustomMeta = (index: number) => {
    handleSeoChange({
      customMeta: seoData.customMeta.filter((_, i) => i !== index)
    });
    showToast("Custom meta tag removed", "success");
  };

  const generateSlugFromTitle = () => {
    if (seoData.title) {
      const slug = seoData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      handleSeoChange({ canonicalUrl: `/${slug}` });
      showToast("URL slug generated from title", "success");
    }
  };

  const copyToSocial = () => {
    handleSeoChange({
      ogTitle: seoData.metaTitle || seoData.title,
      ogDescription: seoData.metaDescription || seoData.description,
      twitterTitle: seoData.metaTitle || seoData.title,
      twitterDescription: seoData.metaDescription || seoData.description
    });
    showToast("Copied basic SEO data to social media fields", "success");
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
    showToast(previewMode ? "Preview disabled" : "Preview enabled", "info");
  };

  const generateFrontmatter = (data: SeoData): string => {
    const frontmatterLines = [
      '---',
      data.metaTitle ? `seoTitle: "${data.metaTitle}"` : '',
      data.metaDescription ? `seoDescription: "${data.metaDescription}"` : '',
      data.keywords.length ? `seoKeywords: "${data.keywords.join(', ')}"` : '',
      data.canonicalUrl ? `canonicalUrl: "${data.canonicalUrl}"` : '',
      data.ogTitle ? `ogTitle: "${data.ogTitle}"` : '',
      data.ogDescription ? `ogDescription: "${data.ogDescription}"` : '',
      data.ogImage ? `ogImage: "${data.ogImage}"` : '',
      data.ogType !== 'article' ? `ogType: "${data.ogType}"` : '',
      data.twitterCard !== 'summary_large_image' ? `twitterCard: "${data.twitterCard}"` : '',
      data.twitterTitle ? `twitterTitle: "${data.twitterTitle}"` : '',
      data.twitterDescription ? `twitterDescription: "${data.twitterDescription}"` : '',
      data.twitterImage ? `twitterImage: "${data.twitterImage}"` : '',
      data.robots !== 'index,follow' ? `robots: "${data.robots}"` : '',
      data.noindex ? `noindex: true` : '',
      data.nofollow ? `nofollow: true` : '',
      '---'
    ].filter(Boolean);
    
    return frontmatterLines.join('\n');
  };

  const updateContentWithSeoData = async (existingContent: string, seoData: SeoData): Promise<string> => {
    const frontmatter = generateFrontmatter(seoData);
    
    // If content has existing frontmatter, replace it
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?/;
    if (frontmatterRegex.test(existingContent)) {
      return existingContent.replace(frontmatterRegex, `${frontmatter}\n\n`);
    }
    
    // If no frontmatter exists, prepend it
    return `${frontmatter}\n\n${existingContent}`;
  };

  const handleCreatePRForCurrentFile = async () => {
    if (!selectedFile) {
      showToast('No file selected', 'error');
      return;
    }

    if (isCreatingPR) return;

    setIsCreatingPR(true);
    
    try {
      showToast('Creating pull request...', 'info');

      // Get GitHub configuration first
      const config = await githubService.getRepoConfig();
      if (!config) {
        showToast('GitHub repository not configured. Please configure it in Admin settings.', 'error');
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
        showToast('GitHub App not properly configured. Please check Admin settings.', 'error');
        return;
      }

      console.log('Getting GitHub App token for installation:', configData.installation_id);

      // Get GitHub App installation token using the existing edge function
      const { data: authResponse, error: authError } = await supabase.functions.invoke('github-app-auth', {
        body: { installationId: configData.installation_id }
      });

      if (authError || !authResponse?.token) {
        console.error('GitHub App auth error:', authError);
        showToast('Failed to authenticate with GitHub App. Please check the configuration.', 'error');
        return;
      }

      const githubToken = authResponse.token;
      const { owner, repo } = config;
      
      // Get user information for PR attribution
      const userEmail = user?.email || 'unknown@pieces.app';
      const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split('@')[0];

      // Generate title
      let title = 'Update SEO configuration';
      if (seoData.metaTitle || seoData.title) {
        title = `SEO Update: ${seoData.metaTitle || seoData.title}`;
      } else {
        const fileName = selectedFile.split('/').pop()?.replace(/\.md$/, '') || 'content';
        title = `SEO Update: ${fileName.replace(/-/g, ' ')}`;
      }

      // Determine the correct file path in the repository
      let repoFilePath = selectedFile;
      if (!selectedFile.startsWith('public/') && !selectedFile.startsWith('src/')) {
        repoFilePath = `public/content/${selectedFile}`;
      }
      if (!repoFilePath.endsWith('.md')) {
        repoFilePath = `${repoFilePath}.md`;
      }

      // Load existing content and update with SEO data
      const existingContent = await loadExistingContent(selectedFile);
      const updatedContent = await updateContentWithSeoData(existingContent, seoData);

      console.log('Creating SEO PR with GitHub App token for:', { 
        title, 
        repoFilePath, 
        owner, 
        repo,
        installationId: configData.installation_id
      });

      // Create the pull request using the GitHub App token
      const result = await githubService.createPullRequest(
        {
          title,
          body: `This pull request updates SEO configuration for the documentation.

## SEO Changes
- **File:** \`${repoFilePath}\`
- **Title:** ${seoData.metaTitle || seoData.title || 'Not set'}
- **Description:** ${seoData.metaDescription || seoData.description || 'Not set'}
- **Keywords:** ${seoData.keywords.join(', ') || 'Not set'}

## Authored By
- **Editor:** ${userName} (${userEmail})
- **Date:** ${new Date().toISOString().split('T')[0]}

## Review Notes
Please review the SEO changes and merge when ready. The existing content has been preserved.

---
*This PR was created automatically by the Pieces Documentation SEO Editor*`,
          files: [
            {
              path: repoFilePath,
              content: updatedContent
            }
          ]
        },
        githubToken,
        config
      );

      if (result.success && result.prNumber && result.prUrl) {
        showToast(`SEO pull request created successfully! #${result.prNumber}`, 'success', { 
          duration: 5000,
          action: {
            label: 'View PR',
            onClick: () => window.open(result.prUrl, '_blank')
          }
        });
      } else {
        throw new Error(result.error || 'Failed to create PR');
      }
      
    } catch (error) {
      console.error('SEO PR creation failed:', error);
      showToast(`Failed to create pull request: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsCreatingPR(false);
    }
  };

  const handleCreatePRForAllChanges = async () => {
    if (pendingChanges.length === 0) {
      showToast('No changes to save', 'info');
      return;
    }

    if (isCreatingPR) return;

    setIsCreatingPR(true);
    
    try {
      showToast(`Creating pull request for ${pendingChanges.length} files...`, 'info');

      // Get GitHub configuration first
      const config = await githubService.getRepoConfig();
      if (!config) {
        showToast('GitHub repository not configured. Please configure it in Admin settings.', 'error');
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
        showToast('GitHub App not properly configured. Please check Admin settings.', 'error');
        return;
      }

      // Get GitHub App installation token using the existing edge function
      const { data: authResponse, error: authError } = await supabase.functions.invoke('github-app-auth', {
        body: { installationId: configData.installation_id }
      });

      if (authError || !authResponse?.token) {
        console.error('GitHub App auth error:', authError);
        showToast('Failed to authenticate with GitHub App. Please check the configuration.', 'error');
        return;
      }

      const githubToken = authResponse.token;
      const { owner, repo } = config;

      // Get user information for PR attribution
      const userEmail = user?.email || 'unknown@pieces.app';
      const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split('@')[0];

      // Prepare files for all pending changes
      const files = await Promise.all(pendingChanges.map(async filePath => {
        let repoFilePath = filePath;
        if (!filePath.startsWith('public/') && !filePath.startsWith('src/')) {
          repoFilePath = `public/content/${filePath}`;
        }
        if (!repoFilePath.endsWith('.md')) {
          repoFilePath = `${repoFilePath}.md`;
        }

        // Load existing content and update with SEO data
        const existingContent = await loadExistingContent(filePath);
        const updatedContent = await updateContentWithSeoData(existingContent, seoData);

        return {
          path: repoFilePath,
          content: updatedContent
        };
      }));

      // Create the pull request using the GitHub App token
      const result = await githubService.createPullRequest(
        {
          title: `Bulk SEO Configuration Update (${pendingChanges.length} files)`,
          body: `This pull request updates SEO configuration for multiple documentation files.

## Files Updated
${pendingChanges.map(path => `- \`${path}\``).join('\n')}

## Authored By
- **Editor:** ${userName} (${userEmail})
- **Date:** ${new Date().toISOString().split('T')[0]}

## Review Notes
Please review all SEO changes and merge when ready. All existing content has been preserved.

---
*This PR was created automatically by the Pieces Documentation SEO Editor*`,
          files
        },
        githubToken,
        config
      );

      if (result.success && result.prNumber && result.prUrl) {
        showToast(`Bulk SEO pull request created successfully! #${result.prNumber}`, 'success', { 
          duration: 5000,
          action: {
            label: 'View PR',
            onClick: () => window.open(result.prUrl, '_blank')
          }
        });
      } else {
        throw new Error(result.error || 'Failed to create PR');
      }
      
    } catch (error) {
      console.error('Bulk SEO PR creation failed:', error);
      showToast(`Failed to create pull request: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsCreatingPR(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* File Navigation Sidebar */}
      {fileStructure && onFileSelect && (
        <div className="w-80 border-r border-border/50 bg-muted/20 backdrop-blur-sm flex flex-col">
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">Select Page for SEO</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a page to configure its SEO settings
                </p>
              </div>
              {hasUnsavedChanges && (
                <Button 
                  onClick={handleCreatePRForAllChanges} 
                  disabled={isCreatingPR}
                  size="sm" 
                  className="gap-2"
                >
                  {isCreatingPR ? (
                    <>
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      Creating PR...
                    </>
                  ) : (
                    <>
                      <GitBranch className="h-3 w-3" />
                      Create PR ({pendingChanges.length})
                    </>
                  )}
                </Button>
              )}
            </div>
            {pendingChanges.length > 0 && (
              <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                {pendingChanges.length} file(s) with unsaved SEO changes
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-2">
                {fileStructure.map((node) => (
                  <FileTreeItem
                    key={node.path}
                    node={node}
                    selectedFile={selectedFile}
                    onFileSelect={onFileSelect}
                    pendingChanges={pendingChanges}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Main SEO Editor */}
      <div className="flex-1 flex flex-col bg-background">
        {!selectedFile ? (
          <div className="h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-background to-muted/20">
            <div className="text-center space-y-4 p-8">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">SEO Management</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Select a file to configure its SEO settings, meta tags, and social media optimization.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b bg-gradient-to-r from-background to-muted/10 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${previewMode ? 'bg-green-500' : 'bg-blue-500'} animate-pulse`} />
                  <h2 className="font-semibold text-lg">SEO Configuration</h2>
                  {previewMode && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Preview Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={togglePreview} variant="outline" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    {previewMode ? 'Disable Preview' : 'Preview Changes'}
                  </Button>
                  <Button 
                    onClick={handleCreatePRForCurrentFile} 
                    disabled={isCreatingPR}
                    size="sm" 
                    className="gap-2"
                  >
                    {isCreatingPR ? (
                      <>
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        Creating PR...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Create PR for Current File
                      </>
                    )}
                  </Button>
                  {hasUnsavedChanges && (
                    <Button 
                      onClick={handleCreatePRForAllChanges} 
                      disabled={isCreatingPR} 
                      variant="secondary" 
                      size="sm" 
                      className="gap-2"
                    >
                      {isCreatingPR ? (
                        <>
                          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          Creating PR...
                        </>
                      ) : (
                        <>
                          <GitBranch className="h-3 w-3" />
                          Create PR for All ({pendingChanges.length})
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Configure SEO settings for: <code className="bg-muted px-2 py-1 rounded text-xs">{selectedFile}</code>
                {pendingChanges.includes(selectedFile) && (
                  <span className="ml-2 text-amber-600">• Unsaved changes</span>
                )}
                {previewMode && (
                  <span className="ml-2 text-green-600">• Preview mode active - changes applied to current page</span>
                )}
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6">
                <Tabs defaultValue="basic" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="basic" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Basic
                    </TabsTrigger>
                    <TabsTrigger value="social" className="gap-2">
                      <Globe className="h-4 w-4" />
                      Social
                    </TabsTrigger>
                    <TabsTrigger value="technical" className="gap-2">
                      <Search className="h-4 w-4" />
                      Technical
                    </TabsTrigger>
                    <TabsTrigger value="schema" className="gap-2">
                      <BarChart className="h-4 w-4" />
                      Schema
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="gap-2">
                      <Hash className="h-4 w-4" />
                      Advanced
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          Basic SEO Information
                          <div className="flex gap-2">
                            <Button onClick={generateSlugFromTitle} variant="outline" size="sm">
                              Generate URL
                            </Button>
                            <Button onClick={copyToSocial} variant="outline" size="sm">
                              Copy to Social
                            </Button>
                          </div>
                        </CardTitle>
                        <CardDescription>
                          Core SEO elements that appear in search results
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Page Title</Label>
                          <Input
                            id="title"
                            value={seoData.title}
                            onChange={(e) => handleSeoChange({ title: e.target.value })}
                            placeholder="Enter page title (50-60 characters recommended)"
                            maxLength={60}
                          />
                          <div className="text-xs text-muted-foreground">
                            {seoData.title.length}/60 characters
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Meta Description</Label>
                          <Textarea
                            id="description"
                            value={seoData.description}
                            onChange={(e) => handleSeoChange({ description: e.target.value })}
                            placeholder="Brief description for search results (150-160 characters)"
                            maxLength={160}
                            rows={3}
                          />
                          <div className="text-xs text-muted-foreground">
                            {seoData.description.length}/160 characters
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="canonical">Canonical URL</Label>
                          <Input
                            id="canonical"
                            value={seoData.canonicalUrl}
                            onChange={(e) => handleSeoChange({ canonicalUrl: e.target.value })}
                            placeholder="/page-url"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Keywords</Label>
                          <div className="flex gap-2">
                            <Input
                              value={newKeyword}
                              onChange={(e) => setNewKeyword(e.target.value)}
                              placeholder="Add keyword"
                              onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                            />
                            <Button onClick={handleAddKeyword} size="sm">Add</Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {seoData.keywords.map((keyword) => (
                              <Badge key={keyword} variant="secondary" className="gap-1">
                                {keyword}
                                <button
                                  onClick={() => handleRemoveKeyword(keyword)}
                                  className="text-xs hover:text-destructive"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="social" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Open Graph (Facebook, LinkedIn)</CardTitle>
                        <CardDescription>
                          How your content appears when shared on social platforms
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="og-title">OG Title</Label>
                          <Input
                            id="og-title"
                            value={seoData.ogTitle}
                            onChange={(e) => handleSeoChange({ ogTitle: e.target.value })}
                            placeholder="Title for social sharing"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="og-description">OG Description</Label>
                          <Textarea
                            id="og-description"
                            value={seoData.ogDescription}
                            onChange={(e) => handleSeoChange({ ogDescription: e.target.value })}
                            placeholder="Description for social sharing"
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="og-image">OG Image URL</Label>
                          <Input
                            id="og-image"
                            value={seoData.ogImage}
                            onChange={(e) => handleSeoChange({ ogImage: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="og-type">OG Type</Label>
                          <Select
                            value={seoData.ogType}
                            onValueChange={(value) => handleSeoChange({ ogType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="article">Article</SelectItem>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="profile">Profile</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Twitter Cards</CardTitle>
                        <CardDescription>
                          Optimize appearance on Twitter/X
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="twitter-card">Card Type</Label>
                          <Select
                            value={seoData.twitterCard}
                            onValueChange={(value) => handleSeoChange({ twitterCard: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="summary">Summary</SelectItem>
                              <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                              <SelectItem value="app">App</SelectItem>
                              <SelectItem value="player">Player</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="twitter-title">Twitter Title</Label>
                          <Input
                            id="twitter-title"
                            value={seoData.twitterTitle}
                            onChange={(e) => handleSeoChange({ twitterTitle: e.target.value })}
                            placeholder="Title for Twitter"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="twitter-description">Twitter Description</Label>
                          <Textarea
                            id="twitter-description"
                            value={seoData.twitterDescription}
                            onChange={(e) => handleSeoChange({ twitterDescription: e.target.value })}
                            placeholder="Description for Twitter"
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="twitter-image">Twitter Image</Label>
                          <Input
                            id="twitter-image"
                            value={seoData.twitterImage}
                            onChange={(e) => handleSeoChange({ twitterImage: e.target.value })}
                            placeholder="https://example.com/twitter-image.jpg"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="twitter-site">Twitter Site</Label>
                            <Input
                              id="twitter-site"
                              value={seoData.twitterSite}
                              onChange={(e) => handleSeoChange({ twitterSite: e.target.value })}
                              placeholder="@username"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="twitter-creator">Twitter Creator</Label>
                            <Input
                              id="twitter-creator"
                              value={seoData.twitterCreator}
                              onChange={(e) => handleSeoChange({ twitterCreator: e.target.value })}
                              placeholder="@username"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="technical" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Search Engine Instructions</CardTitle>
                        <CardDescription>
                          Control how search engines crawl and index this page
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="robots">Robots Meta</Label>
                          <Input
                            id="robots"
                            value={seoData.robots}
                            onChange={(e) => handleSeoChange({ robots: e.target.value })}
                            placeholder="index,follow"
                          />
                          <div className="text-xs text-muted-foreground">
                            Common values: index,follow | noindex,nofollow | index,nofollow
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="noindex"
                              checked={seoData.noindex}
                              onCheckedChange={(checked) => handleSeoChange({ noindex: checked })}
                            />
                            <Label htmlFor="noindex">No Index</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="nofollow"
                              checked={seoData.nofollow}
                              onCheckedChange={(checked) => handleSeoChange({ nofollow: checked })}
                            />
                            <Label htmlFor="nofollow">No Follow</Label>
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="priority">Sitemap Priority</Label>
                            <Input
                              id="priority"
                              type="number"
                              min="0"
                              max="1"
                              step="0.1"
                              value={seoData.priority}
                              onChange={(e) => handleSeoChange({ priority: parseFloat(e.target.value) })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="changefreq">Change Frequency</Label>
                            <Select
                              value={seoData.changefreq}
                              onValueChange={(value) => handleSeoChange({ changefreq: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="always">Always</SelectItem>
                                <SelectItem value="hourly">Hourly</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                                <SelectItem value="never">Never</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="schema" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Schema.org Structured Data</CardTitle>
                        <CardDescription>
                          Help search engines understand your content better
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="schema-type">Schema Type</Label>
                          <Select
                            value={seoData.schemaType}
                            onValueChange={(value) => handleSeoChange({ schemaType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Article">Article</SelectItem>
                              <SelectItem value="BlogPosting">Blog Posting</SelectItem>
                              <SelectItem value="TechArticle">Technical Article</SelectItem>
                              <SelectItem value="HowTo">How-To Guide</SelectItem>
                              <SelectItem value="FAQ">FAQ</SelectItem>
                              <SelectItem value="Product">Product</SelectItem>
                              <SelectItem value="Organization">Organization</SelectItem>
                              <SelectItem value="WebPage">Web Page</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="schema-data">Custom Schema JSON-LD</Label>
                          <Textarea
                            id="schema-data"
                            value={seoData.schemaData}
                            onChange={(e) => handleSeoChange({ schemaData: e.target.value })}
                            placeholder='{"@context": "https://schema.org", "@type": "Article", ...}'
                            rows={8}
                            className="font-mono text-xs"
                          />
                          <div className="text-xs text-muted-foreground">
                            Enter custom JSON-LD structured data (optional - will be auto-generated based on schema type if empty)
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Custom Meta Tags</CardTitle>
                        <CardDescription>
                          Add additional meta tags for specific requirements
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            value={newMetaName}
                            onChange={(e) => setNewMetaName(e.target.value)}
                            placeholder="Meta name"
                          />
                          <Input
                            value={newMetaContent}
                            onChange={(e) => setNewMetaContent(e.target.value)}
                            placeholder="Content"
                          />
                          <div className="flex gap-2">
                            <Input
                              value={newMetaProperty}
                              onChange={(e) => setNewMetaProperty(e.target.value)}
                              placeholder="Property (optional)"
                              className="flex-1"
                            />
                            <Button onClick={handleAddCustomMeta} size="sm">Add</Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {seoData.customMeta.map((meta, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 border rounded">
                              <code className="text-xs flex-1">
                                &lt;meta {meta.property ? `property="${meta.property}"` : `name="${meta.name}"`} content="{meta.content}" /&gt;
                              </code>
                              <Button
                                onClick={() => handleRemoveCustomMeta(index)}
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
}
