import { useState, useEffect } from "react";
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
import { FileText, Globe, Search, Image, Hash, Clock, Users, BarChart, Folder, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { FileNode } from "@/utils/fileSystem";

interface SeoData {
  // Basic SEO
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  
  // Meta tags
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  
  // Open Graph
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  ogUrl: string;
  
  // Twitter Cards
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterSite: string;
  twitterCreator: string;
  
  // Technical SEO
  robots: string;
  noindex: boolean;
  nofollow: boolean;
  priority: number;
  changefreq: string;
  
  // Schema.org
  schemaType: string;
  schemaData: string;
  
  // Additional
  customMeta: Array<{ name: string; content: string; property?: string }>;
}

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
  depth = 0 
}: { 
  node: FileNode; 
  selectedFile?: string; 
  onFileSelect?: (filePath: string) => void;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isFile = node.type === 'file';
  const isSelected = selectedFile === node.path;

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
        
        <span className="text-sm truncate">
          {node.name}
        </span>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SeoEditor({ selectedFile, onSeoDataChange, fileStructure, onFileSelect }: SeoEditorProps) {
  const [seoData, setSeoData] = useState<SeoData>({
    title: "",
    description: "",
    keywords: [],
    canonicalUrl: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    ogType: "article",
    ogUrl: "",
    twitterCard: "summary_large_image",
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
    twitterSite: "@pieces_app",
    twitterCreator: "",
    robots: "index,follow",
    noindex: false,
    nofollow: false,
    priority: 0.8,
    changefreq: "weekly",
    schemaType: "Article",
    schemaData: "",
    customMeta: []
  });

  const [newKeyword, setNewKeyword] = useState("");
  const [newMetaName, setNewMetaName] = useState("");
  const [newMetaContent, setNewMetaContent] = useState("");
  const [newMetaProperty, setNewMetaProperty] = useState("");

  useEffect(() => {
    onSeoDataChange(seoData);
  }, [seoData, onSeoDataChange]);

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !seoData.keywords.includes(newKeyword.trim())) {
      setSeoData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setSeoData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleAddCustomMeta = () => {
    if (newMetaName.trim() && newMetaContent.trim()) {
      setSeoData(prev => ({
        ...prev,
        customMeta: [...prev.customMeta, {
          name: newMetaName.trim(),
          content: newMetaContent.trim(),
          property: newMetaProperty.trim() || undefined
        }]
      }));
      setNewMetaName("");
      setNewMetaContent("");
      setNewMetaProperty("");
    }
  };

  const handleRemoveCustomMeta = (index: number) => {
    setSeoData(prev => ({
      ...prev,
      customMeta: prev.customMeta.filter((_, i) => i !== index)
    }));
  };

  const generateSlugFromTitle = () => {
    if (seoData.title) {
      const slug = seoData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSeoData(prev => ({ ...prev, canonicalUrl: `/${slug}` }));
      toast.success("URL slug generated from title");
    }
  };

  const copyToSocial = () => {
    setSeoData(prev => ({
      ...prev,
      ogTitle: prev.metaTitle || prev.title,
      ogDescription: prev.metaDescription || prev.description,
      twitterTitle: prev.metaTitle || prev.title,
      twitterDescription: prev.metaDescription || prev.description
    }));
    toast.success("Copied basic SEO data to social media fields");
  };

  return (
    <div className="h-full flex">
      {/* File Navigation Sidebar */}
      {fileStructure && onFileSelect && (
        <div className="w-80 border-r border-border/50 bg-muted/20 backdrop-blur-sm">
          <div className="p-4 border-b">
            <h3 className="font-medium text-sm">Select Page for SEO</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Choose a page to configure its SEO settings
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {fileStructure.map((node) => (
                <FileTreeItem
                  key={node.path}
                  node={node}
                  selectedFile={selectedFile}
                  onFileSelect={onFileSelect}
                />
              ))}
            </div>
          </ScrollArea>
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
            <div className="p-6 border-b bg-gradient-to-r from-background to-muted/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <h2 className="font-semibold text-lg">SEO Configuration</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={copyToSocial} variant="outline" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Copy to Social
                  </Button>
                  <Button onClick={generateSlugFromTitle} variant="outline" size="sm" className="gap-2">
                    <Hash className="h-4 w-4" />
                    Generate URL
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Configure SEO settings for: <code className="bg-muted px-2 py-1 rounded text-xs">{selectedFile}</code>
              </p>
            </div>

            <ScrollArea className="flex-1 p-6">
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
                      <CardTitle>Basic SEO Information</CardTitle>
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
                          onChange={(e) => setSeoData(prev => ({ ...prev, title: e.target.value }))}
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
                          onChange={(e) => setSeoData(prev => ({ ...prev, description: e.target.value }))}
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
                          onChange={(e) => setSeoData(prev => ({ ...prev, canonicalUrl: e.target.value }))}
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
                          onChange={(e) => setSeoData(prev => ({ ...prev, ogTitle: e.target.value }))}
                          placeholder="Title for social sharing"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="og-description">OG Description</Label>
                        <Textarea
                          id="og-description"
                          value={seoData.ogDescription}
                          onChange={(e) => setSeoData(prev => ({ ...prev, ogDescription: e.target.value }))}
                          placeholder="Description for social sharing"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="og-image">OG Image URL</Label>
                        <Input
                          id="og-image"
                          value={seoData.ogImage}
                          onChange={(e) => setSeoData(prev => ({ ...prev, ogImage: e.target.value }))}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="og-type">OG Type</Label>
                        <Select
                          value={seoData.ogType}
                          onValueChange={(value) => setSeoData(prev => ({ ...prev, ogType: value }))}
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
                          onValueChange={(value) => setSeoData(prev => ({ ...prev, twitterCard: value }))}
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
                          onChange={(e) => setSeoData(prev => ({ ...prev, twitterTitle: e.target.value }))}
                          placeholder="Title for Twitter"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twitter-description">Twitter Description</Label>
                        <Textarea
                          id="twitter-description"
                          value={seoData.twitterDescription}
                          onChange={(e) => setSeoData(prev => ({ ...prev, twitterDescription: e.target.value }))}
                          placeholder="Description for Twitter"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twitter-image">Twitter Image</Label>
                        <Input
                          id="twitter-image"
                          value={seoData.twitterImage}
                          onChange={(e) => setSeoData(prev => ({ ...prev, twitterImage: e.target.value }))}
                          placeholder="https://example.com/twitter-image.jpg"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="twitter-site">Twitter Site</Label>
                          <Input
                            id="twitter-site"
                            value={seoData.twitterSite}
                            onChange={(e) => setSeoData(prev => ({ ...prev, twitterSite: e.target.value }))}
                            placeholder="@username"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="twitter-creator">Twitter Creator</Label>
                          <Input
                            id="twitter-creator"
                            value={seoData.twitterCreator}
                            onChange={(e) => setSeoData(prev => ({ ...prev, twitterCreator: e.target.value }))}
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
                          onChange={(e) => setSeoData(prev => ({ ...prev, robots: e.target.value }))}
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
                            onCheckedChange={(checked) => setSeoData(prev => ({ ...prev, noindex: checked }))}
                          />
                          <Label htmlFor="noindex">No Index</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="nofollow"
                            checked={seoData.nofollow}
                            onCheckedChange={(checked) => setSeoData(prev => ({ ...prev, nofollow: checked }))}
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
                            onChange={(e) => setSeoData(prev => ({ ...prev, priority: parseFloat(e.target.value) }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="changefreq">Change Frequency</Label>
                          <Select
                            value={seoData.changefreq}
                            onValueChange={(value) => setSeoData(prev => ({ ...prev, changefreq: value }))}
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
                          onValueChange={(value) => setSeoData(prev => ({ ...prev, schemaType: value }))}
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
                          onChange={(e) => setSeoData(prev => ({ ...prev, schemaData: e.target.value }))}
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
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
}
