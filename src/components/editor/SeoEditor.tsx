
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileTreeSidebar } from './FileTreeSidebar';
import { useSeoData, SeoData } from '@/hooks/useSeoData';
import { FileNode } from '@/utils/fileSystem';
import { Search, Globe, Share2, Settings, Save, Loader2 } from 'lucide-react';

interface SeoEditorProps {
  selectedFile?: string;
  onSeoDataChange: (seoData: SeoData) => void;
  fileStructure: FileNode[];
  onFileSelect: (filePath: string) => void;
}

export function SeoEditor({ selectedFile, onSeoDataChange, fileStructure, onFileSelect }: SeoEditorProps) {
  const { seoData, updateSeoData, saveAllChanges, hasUnsavedChanges, isSaving, isLoading } = useSeoData(selectedFile);
  const [activeTab, setActiveTab] = useState('basic');

  // Call onSeoDataChange when seoData changes
  useEffect(() => {
    onSeoDataChange(seoData);
  }, [seoData, onSeoDataChange]);

  const handleInputChange = (field: keyof SeoData, value: any) => {
    updateSeoData({ [field]: value });
  };

  const handleKeywordsChange = (value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(Boolean);
    updateSeoData({ keywords });
  };

  const addCustomMeta = () => {
    const newMeta = { name: '', content: '', property: '' };
    updateSeoData({ 
      customMeta: [...seoData.customMeta, newMeta] 
    });
  };

  const updateCustomMeta = (index: number, field: string, value: string) => {
    const updatedMeta = [...seoData.customMeta];
    updatedMeta[index] = { ...updatedMeta[index], [field]: value };
    updateSeoData({ customMeta: updatedMeta });
  };

  const removeCustomMeta = (index: number) => {
    const updatedMeta = seoData.customMeta.filter((_, i) => i !== index);
    updateSeoData({ customMeta: updatedMeta });
  };

  return (
    <div className="flex h-full">
      <FileTreeSidebar
        title="SEO Management"
        description="Select a file to edit its SEO metadata"
        selectedFile={selectedFile}
        onFileSelect={onFileSelect}
        fileStructure={fileStructure}
      />
      
      <div className="flex-1 p-6 overflow-auto">
        {!selectedFile ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a File</h3>
              <p className="text-muted-foreground">Choose a file from the sidebar to edit its SEO metadata</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">SEO Editor</h2>
                <p className="text-muted-foreground">Editing: {selectedFile}</p>
              </div>
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <Badge variant="secondary">Unsaved Changes</Badge>
                )}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </div>
                )}
                <Button 
                  onClick={saveAllChanges} 
                  disabled={!hasUnsavedChanges || isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading SEO data...</p>
                </div>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic" className="gap-2">
                    <Search className="w-4 h-4" />
                    Basic SEO
                  </TabsTrigger>
                  <TabsTrigger value="social" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Social Media
                  </TabsTrigger>
                  <TabsTrigger value="technical" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Technical
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="gap-2">
                    <Globe className="w-4 h-4" />
                    Advanced
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic SEO Information</CardTitle>
                      <CardDescription>
                        Core SEO metadata that search engines use to understand your content
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">Page Title</Label>
                          <Input
                            id="title"
                            value={seoData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="Enter page title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="metaTitle">Meta Title</Label>
                          <Input
                            id="metaTitle"
                            value={seoData.metaTitle}
                            onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                            placeholder="Enter meta title (for search engines)"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={seoData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder="Enter page description"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <Textarea
                          id="metaDescription"
                          value={seoData.metaDescription}
                          onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                          placeholder="Enter meta description (for search engines, 150-160 characters)"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="keywords">Keywords</Label>
                        <Input
                          id="keywords"
                          value={seoData.keywords.join(', ')}
                          onChange={(e) => handleKeywordsChange(e.target.value)}
                          placeholder="Enter keywords separated by commas"
                        />
                      </div>

                      <div>
                        <Label htmlFor="canonicalUrl">Canonical URL</Label>
                        <Input
                          id="canonicalUrl"
                          value={seoData.canonicalUrl}
                          onChange={(e) => handleInputChange('canonicalUrl', e.target.value)}
                          placeholder="Enter canonical URL"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="social" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Open Graph (Facebook, LinkedIn)</CardTitle>
                      <CardDescription>
                        How your content appears when shared on social media platforms
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ogTitle">OG Title</Label>
                          <Input
                            id="ogTitle"
                            value={seoData.ogTitle}
                            onChange={(e) => handleInputChange('ogTitle', e.target.value)}
                            placeholder="Open Graph title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ogType">OG Type</Label>
                          <Select value={seoData.ogType} onValueChange={(value) => handleInputChange('ogType', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="article">Article</SelectItem>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="book">Book</SelectItem>
                              <SelectItem value="profile">Profile</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="ogDescription">OG Description</Label>
                        <Textarea
                          id="ogDescription"
                          value={seoData.ogDescription}
                          onChange={(e) => handleInputChange('ogDescription', e.target.value)}
                          placeholder="Open Graph description"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ogImage">OG Image URL</Label>
                          <Input
                            id="ogImage"
                            value={seoData.ogImage}
                            onChange={(e) => handleInputChange('ogImage', e.target.value)}
                            placeholder="Image URL for social sharing"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ogUrl">OG URL</Label>
                          <Input
                            id="ogUrl"
                            value={seoData.ogUrl}
                            onChange={(e) => handleInputChange('ogUrl', e.target.value)}
                            placeholder="Canonical URL for Open Graph"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Twitter Cards</CardTitle>
                      <CardDescription>
                        How your content appears when shared on Twitter/X
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="twitterCard">Twitter Card Type</Label>
                          <Select value={seoData.twitterCard} onValueChange={(value) => handleInputChange('twitterCard', value)}>
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
                        <div>
                          <Label htmlFor="twitterSite">Twitter Site</Label>
                          <Input
                            id="twitterSite"
                            value={seoData.twitterSite}
                            onChange={(e) => handleInputChange('twitterSite', e.target.value)}
                            placeholder="@site_account"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="twitterTitle">Twitter Title</Label>
                        <Input
                          id="twitterTitle"
                          value={seoData.twitterTitle}
                          onChange={(e) => handleInputChange('twitterTitle', e.target.value)}
                          placeholder="Twitter card title"
                        />
                      </div>

                      <div>
                        <Label htmlFor="twitterDescription">Twitter Description</Label>
                        <Textarea
                          id="twitterDescription"
                          value={seoData.twitterDescription}
                          onChange={(e) => handleInputChange('twitterDescription', e.target.value)}
                          placeholder="Twitter card description"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="twitterImage">Twitter Image URL</Label>
                          <Input
                            id="twitterImage"
                            value={seoData.twitterImage}
                            onChange={(e) => handleInputChange('twitterImage', e.target.value)}
                            placeholder="Image URL for Twitter card"
                          />
                        </div>
                        <div>
                          <Label htmlFor="twitterCreator">Twitter Creator</Label>
                          <Input
                            id="twitterCreator"
                            value={seoData.twitterCreator}
                            onChange={(e) => handleInputChange('twitterCreator', e.target.value)}
                            placeholder="@creator_account"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="technical" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Robot Instructions</CardTitle>
                      <CardDescription>
                        Control how search engines crawl and index this page
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="robots">Robots Meta Tag</Label>
                        <Input
                          id="robots"
                          value={seoData.robots}
                          onChange={(e) => handleInputChange('robots', e.target.value)}
                          placeholder="e.g., index,follow"
                        />
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="noindex"
                            checked={seoData.noindex}
                            onCheckedChange={(value) => handleInputChange('noindex', value)}
                          />
                          <Label htmlFor="noindex">No Index</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="nofollow"
                            checked={seoData.nofollow}
                            onCheckedChange={(value) => handleInputChange('nofollow', value)}
                          />
                          <Label htmlFor="nofollow">No Follow</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Sitemap Settings</CardTitle>
                      <CardDescription>
                        Configure how this page appears in your sitemap
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="priority">Priority (0.0 - 1.0)</Label>
                          <Input
                            id="priority"
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={seoData.priority}
                            onChange={(e) => handleInputChange('priority', parseFloat(e.target.value) || 0.8)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="changefreq">Change Frequency</Label>
                          <Select value={seoData.changefreq} onValueChange={(value) => handleInputChange('changefreq', value)}>
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

                <TabsContent value="advanced" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Schema.org Structured Data</CardTitle>
                      <CardDescription>
                        Add structured data to help search engines understand your content
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="schemaType">Schema Type</Label>
                        <Select value={seoData.schemaType} onValueChange={(value) => handleInputChange('schemaType', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Article">Article</SelectItem>
                            <SelectItem value="BlogPosting">Blog Posting</SelectItem>
                            <SelectItem value="WebPage">Web Page</SelectItem>
                            <SelectItem value="Organization">Organization</SelectItem>
                            <SelectItem value="Person">Person</SelectItem>
                            <SelectItem value="Product">Product</SelectItem>
                            <SelectItem value="FAQ">FAQ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="schemaData">Schema JSON-LD</Label>
                        <Textarea
                          id="schemaData"
                          value={seoData.schemaData}
                          onChange={(e) => handleInputChange('schemaData', e.target.value)}
                          placeholder="Enter JSON-LD structured data"
                          rows={6}
                          className="font-mono text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Custom Meta Tags</CardTitle>
                      <CardDescription>
                        Add custom meta tags for specific platforms or services
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {seoData.customMeta.map((meta, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={meta.name}
                              onChange={(e) => updateCustomMeta(index, 'name', e.target.value)}
                              placeholder="Meta name"
                            />
                          </div>
                          <div>
                            <Label>Property</Label>
                            <Input
                              value={meta.property || ''}
                              onChange={(e) => updateCustomMeta(index, 'property', e.target.value)}
                              placeholder="Meta property (optional)"
                            />
                          </div>
                          <div>
                            <Label>Content</Label>
                            <Input
                              value={meta.content}
                              onChange={(e) => updateCustomMeta(index, 'content', e.target.value)}
                              placeholder="Meta content"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeCustomMeta(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      
                      <Button variant="outline" onClick={addCustomMeta}>
                        Add Custom Meta Tag
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
