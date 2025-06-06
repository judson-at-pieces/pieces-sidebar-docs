import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileTreeSidebar } from './FileTreeSidebar';
import { useSeoData, SeoData } from "@/hooks/useSeoData";
import { githubService } from "@/services/githubService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GitPullRequest, Save, Eye, EyeOff, FileText, Search, Link, Globe, Hash, Image, Twitter, Facebook } from "lucide-react";

interface SeoEditorProps {
  selectedFile?: string;
  onSeoDataChange: (seoData: SeoData) => void;
  fileStructure: any;
  onFileSelect: (filePath: string) => void;
}

export function SeoEditor({ selectedFile, onSeoDataChange, fileStructure, onFileSelect }: SeoEditorProps) {
  const { session } = useAuth();
  const { seoData, updateSeoData, hasUnsavedChanges } = useSeoData(selectedFile);
  const [creatingPR, setCreatingPR] = useState(false);
  const [existingContent, setExistingContent] = useState<string>('');

  // Load existing content when file changes
  useEffect(() => {
    if (selectedFile) {
      loadExistingContent(selectedFile);
    }
  }, [selectedFile]);

  const loadExistingContent = async (filePath: string) => {
    try {
      let fetchPath = filePath;
      if (!fetchPath.endsWith('.md')) {
        fetchPath = `${fetchPath}.md`;
      }
      
      const cleanFetchPath = fetchPath.replace(/^\/+/, '');
      const fetchUrl = `/content/${cleanFetchPath}`;
      
      const response = await fetch(fetchUrl);
      if (response.ok) {
        const content = await response.text();
        setExistingContent(content);
      } else {
        setExistingContent('');
      }
    } catch (error) {
      console.error('Failed to load existing content:', error);
      setExistingContent('');
    }
  };

  const handleSeoChange = (field: keyof SeoData, value: any) => {
    const updatedData = { ...seoData, [field]: value };
    updateSeoData({ [field]: value });
    onSeoDataChange(updatedData);
  };

  const generateSeoContent = (seoData: SeoData, existingContent: string) => {
    // Extract existing body content (everything after frontmatter)
    const frontmatterMatch = existingContent.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    const bodyContent = frontmatterMatch ? frontmatterMatch[2] : existingContent;

    // Generate new frontmatter with SEO data
    const frontmatter = [
      '---',
      `title: "${seoData.metaTitle || seoData.title}"`,
      `path: "${seoData.canonicalUrl || `/${selectedFile?.replace(/\.md$/, '').replace(/^\//, '')}`}"`,
      `visibility: "PUBLIC"`,
      `description: "${seoData.metaDescription || seoData.description}"`,
      ...(seoData.keywords.length > 0 ? [`seoKeywords: "${seoData.keywords.join(', ')}"`] : []),
      ...(seoData.ogTitle ? [`ogTitle: "${seoData.ogTitle}"`] : []),
      ...(seoData.ogDescription ? [`ogDescription: "${seoData.ogDescription}"`] : []),
      ...(seoData.ogImage ? [`ogImage: "${seoData.ogImage}"`] : []),
      ...(seoData.ogType !== 'article' ? [`ogType: "${seoData.ogType}"`] : []),
      ...(seoData.twitterCard !== 'summary_large_image' ? [`twitterCard: "${seoData.twitterCard}"`] : []),
      ...(seoData.twitterTitle ? [`twitterTitle: "${seoData.twitterTitle}"`] : []),
      ...(seoData.twitterDescription ? [`twitterDescription: "${seoData.twitterDescription}"`] : []),
      ...(seoData.twitterImage ? [`twitterImage: "${seoData.twitterImage}"`] : []),
      ...(seoData.robots !== 'index,follow' ? [`robots: "${seoData.robots}"`] : []),
      ...(seoData.noindex ? [`noindex: true`] : []),
      ...(seoData.nofollow ? [`nofollow: true`] : []),
      ...(seoData.priority !== 0.8 ? [`priority: ${seoData.priority}`] : []),
      ...(seoData.changefreq !== 'weekly' ? [`changefreq: "${seoData.changefreq}"`] : []),
      ...(seoData.schemaType !== 'Article' ? [`schemaType: "${seoData.schemaType}"`] : []),
      '---'
    ].join('\n');

    // Combine frontmatter with existing body content
    return `${frontmatter}\n\n${bodyContent.trim()}`;
  };

  const handleCreatePR = async () => {
    if (!selectedFile || !hasUnsavedChanges) {
      toast.error('No SEO changes to create a pull request for');
      return;
    }

    if (!session?.provider_token) {
      toast.error('GitHub authentication required. Please sign in with GitHub.');
      return;
    }

    setCreatingPR(true);
    
    try {
      const repoConfig = await githubService.getRepoConfig();
      if (!repoConfig) {
        toast.error('No GitHub repository configured. Please configure a repository first.');
        return;
      }

      // Generate the complete file content with SEO updates
      const updatedContent = generateSeoContent(seoData, existingContent);
      
      const fileName = selectedFile.split('/').pop() || selectedFile;
      const result = await githubService.createPullRequest(
        {
          title: `Update SEO metadata for ${fileName}`,
          body: `Updated SEO metadata for ${selectedFile}\n\nChanges include:\n- Meta title and description\n- Open Graph tags\n- Twitter Card metadata\n- Schema.org data\n\nThis pull request was created from the SEO editor.`,
          files: [
            {
              path: selectedFile.endsWith('.md') ? selectedFile : `${selectedFile}.md`,
              content: updatedContent
            }
          ]
        },
        session.provider_token,
        repoConfig
      );

      if (result.success) {
        toast.success('SEO pull request created successfully!', {
          action: {
            label: 'View PR',
            onClick: () => window.open(result.prUrl, '_blank')
          }
        });
      }
    } catch (error) {
      console.error('Error creating SEO PR:', error);
      toast.error('Failed to create SEO pull request');
    } finally {
      setCreatingPR(false);
    }
  };

  return (
    <div className="flex h-full">
      <FileTreeSidebar
        title="SEO Management"
        description="Select a file to edit its SEO metadata"
        selectedFile={selectedFile}
        onFileSelect={onFileSelect}
        fileStructure={fileStructure}
        pendingChanges={hasUnsavedChanges ? [selectedFile || ''] : []}
      />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">SEO Editor</h1>
              <p className="text-muted-foreground mt-2">
                Optimize your content for search engines and social media
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <Badge variant="secondary" className="gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  Unsaved Changes
                </Badge>
              )}
              
              <Button
                onClick={handleCreatePR}
                disabled={!hasUnsavedChanges || creatingPR}
                variant="outline"
                className="gap-2"
              >
                {creatingPR ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <GitPullRequest className="w-4 h-4" />
                )}
                Create SEO PR
              </Button>
            </div>
          </div>

          {!selectedFile ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No File Selected</h3>
                <p className="text-muted-foreground">
                  Select a file from the sidebar to start editing its SEO metadata
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Basic SEO
                </TabsTrigger>
                <TabsTrigger value="social" className="gap-2">
                  <Globe className="w-4 h-4" />
                  Social Media
                </TabsTrigger>
                <TabsTrigger value="technical" className="gap-2">
                  <Search className="w-4 h-4" />
                  Technical
                </TabsTrigger>
                <TabsTrigger value="schema" className="gap-2">
                  <Hash className="w-4 h-4" />
                  Schema
                </TabsTrigger>
              </TabsList>

              {/* Basic SEO Tab */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Basic SEO Information
                    </CardTitle>
                    <CardDescription>
                      Core SEO elements that appear in search results
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        value={seoData.metaTitle}
                        onChange={(e) => handleSeoChange('metaTitle', e.target.value)}
                        placeholder="Enter SEO title (50-60 characters recommended)"
                        maxLength={60}
                      />
                      <div className="text-xs text-muted-foreground">
                        {seoData.metaTitle.length}/60 characters
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        value={seoData.metaDescription}
                        onChange={(e) => handleSeoChange('metaDescription', e.target.value)}
                        placeholder="Enter SEO description (150-160 characters recommended)"
                        rows={3}
                        maxLength={160}
                      />
                      <div className="text-xs text-muted-foreground">
                        {seoData.metaDescription.length}/160 characters
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="keywords">Keywords</Label>
                      <Input
                        id="keywords"
                        value={seoData.keywords.join(', ')}
                        onChange={(e) => handleSeoChange('keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
                        placeholder="Enter keywords separated by commas"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="canonicalUrl">Canonical URL</Label>
                      <Input
                        id="canonicalUrl"
                        value={seoData.canonicalUrl}
                        onChange={(e) => handleSeoChange('canonicalUrl', e.target.value)}
                        placeholder="/path/to/page"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Social Media Tab */}
              <TabsContent value="social" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Open Graph */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Facebook className="w-5 h-5" />
                        Open Graph (Facebook)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ogTitle">OG Title</Label>
                        <Input
                          id="ogTitle"
                          value={seoData.ogTitle}
                          onChange={(e) => handleSeoChange('ogTitle', e.target.value)}
                          placeholder="Facebook share title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ogDescription">OG Description</Label>
                        <Textarea
                          id="ogDescription"
                          value={seoData.ogDescription}
                          onChange={(e) => handleSeoChange('ogDescription', e.target.value)}
                          placeholder="Facebook share description"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ogImage">OG Image URL</Label>
                        <Input
                          id="ogImage"
                          value={seoData.ogImage}
                          onChange={(e) => handleSeoChange('ogImage', e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ogType">OG Type</Label>
                        <Select value={seoData.ogType} onValueChange={(value) => handleSeoChange('ogType', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="book">Book</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Twitter Cards */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Twitter className="w-5 h-5" />
                        Twitter Cards
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="twitterCard">Card Type</Label>
                        <Select value={seoData.twitterCard} onValueChange={(value) => handleSeoChange('twitterCard', value)}>
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
                        <Label htmlFor="twitterTitle">Twitter Title</Label>
                        <Input
                          id="twitterTitle"
                          value={seoData.twitterTitle}
                          onChange={(e) => handleSeoChange('twitterTitle', e.target.value)}
                          placeholder="Twitter share title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twitterDescription">Twitter Description</Label>
                        <Textarea
                          id="twitterDescription"
                          value={seoData.twitterDescription}
                          onChange={(e) => handleSeoChange('twitterDescription', e.target.value)}
                          placeholder="Twitter share description"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twitterImage">Twitter Image URL</Label>
                        <Input
                          id="twitterImage"
                          value={seoData.twitterImage}
                          onChange={(e) => handleSeoChange('twitterImage', e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Technical SEO Tab */}
              <TabsContent value="technical" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      Technical SEO Settings
                    </CardTitle>
                    <CardDescription>
                      Control how search engines crawl and index your content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="robots">Robots Meta</Label>
                        <Select value={seoData.robots} onValueChange={(value) => handleSeoChange('robots', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="index,follow">Index, Follow</SelectItem>
                            <SelectItem value="noindex,follow">No Index, Follow</SelectItem>
                            <SelectItem value="index,nofollow">Index, No Follow</SelectItem>
                            <SelectItem value="noindex,nofollow">No Index, No Follow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="changefreq">Change Frequency</Label>
                        <Select value={seoData.changefreq} onValueChange={(value) => handleSeoChange('changefreq', value)}>
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

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority (0.0 - 1.0)</Label>
                      <Input
                        id="priority"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={seoData.priority}
                        onChange={(e) => handleSeoChange('priority', parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="noindex"
                        checked={seoData.noindex}
                        onCheckedChange={(checked) => handleSeoChange('noindex', checked)}
                      />
                      <Label htmlFor="noindex">No Index</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="nofollow"
                        checked={seoData.nofollow}
                        onCheckedChange={(checked) => handleSeoChange('nofollow', checked)}
                      />
                      <Label htmlFor="nofollow">No Follow</Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Schema Tab */}
              <TabsContent value="schema" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="w-5 h-5" />
                      Schema.org Structured Data
                    </CardTitle>
                    <CardDescription>
                      Help search engines understand your content better
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="schemaType">Schema Type</Label>
                      <Select value={seoData.schemaType} onValueChange={(value) => handleSeoChange('schemaType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Article">Article</SelectItem>
                          <SelectItem value="BlogPosting">Blog Posting</SelectItem>
                          <SelectItem value="NewsArticle">News Article</SelectItem>
                          <SelectItem value="TechArticle">Tech Article</SelectItem>
                          <SelectItem value="WebPage">Web Page</SelectItem>
                          <SelectItem value="Product">Product</SelectItem>
                          <SelectItem value="Organization">Organization</SelectItem>
                          <SelectItem value="Person">Person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="schemaData">Custom Schema JSON</Label>
                      <Textarea
                        id="schemaData"
                        value={seoData.schemaData}
                        onChange={(e) => handleSeoChange('schemaData', e.target.value)}
                        placeholder="Enter custom schema.org JSON-LD data"
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
