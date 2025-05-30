import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, FileText, GitPullRequest } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { EditorSidebar } from "./EditorSidebar";
import { EditorMain } from "./EditorMain";
import { githubService } from "@/services/githubService";
import { toast } from "sonner";

interface FileContent {
  [fileName: string]: string;
}

export function EditorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [selectedFile, setSelectedFile] = useState<string>();
  const [fileContents, setFileContents] = useState<FileContent>({});
  const [originalContents, setOriginalContents] = useState<FileContent>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load file content when a file is selected
  useEffect(() => {
    if (selectedFile && !fileContents[selectedFile]) {
      loadFileContent(selectedFile);
    }
  }, [selectedFile]);

  const loadFileContent = async (fileName: string) => {
    setIsLoading(true);
    try {
      console.log('Loading content for file:', fileName);
      
      // Map the file name to the correct content path in public/content
      let contentPath = fileName;
      
      // Handle nested paths properly
      const pathMappings: Record<string, string> = {
        'fundamentals.md': 'meet-pieces/fundamentals.md',
        'windows-installation-guide.md': 'meet-pieces/windows-installation-guide.md',
        'macos-installation-guide.md': 'meet-pieces/macos-installation-guide.md',
        'linux-installation-guide.md': 'meet-pieces/linux-installation-guide.md',
        'cross-platform.md': 'meet-pieces/troubleshooting/cross-platform.md',
        'macos.md': 'meet-pieces/troubleshooting/macos.md',
        'windows.md': 'meet-pieces/troubleshooting/windows.md',
        'linux.md': 'meet-pieces/troubleshooting/linux.md',
        'overview.md': 'quick-guides/overview.md',
        'ltm-context.md': 'quick-guides/ltm-context.md',
        'copilot-with-context.md': 'quick-guides/copilot-with-context.md',
        'download.md': 'desktop/download.md',
        'onboarding.md': 'desktop/onboarding.md',
      };
      
      // Use mapping if available, otherwise use the file name as-is for nested files
      if (pathMappings[fileName]) {
        contentPath = pathMappings[fileName];
      }
      
      console.log('Fetching from path:', `/content/${contentPath}`);
      
      // Fetch the markdown file from public/content
      const response = await fetch(`/content/${contentPath}`);
      
      if (response.ok) {
        const content = await response.text();
        console.log('Successfully loaded content for:', fileName);
        setFileContents(prev => ({ ...prev, [fileName]: content }));
        setOriginalContents(prev => ({ ...prev, [fileName]: content }));
      } else {
        console.log('File not found, using fallback content');
        const fallbackContent = `---
title: "${fileName.replace('.md', '').replace('-', ' ')}"
path: "/${contentPath.replace('.md', '')}"
visibility: "PUBLIC"
---
***

# ${fileName.replace('.md', '').replace('-', ' ')}

Start editing this file...`;
        setFileContents(prev => ({ ...prev, [fileName]: fallbackContent }));
        setOriginalContents(prev => ({ ...prev, [fileName]: fallbackContent }));
      }
    } catch (error) {
      console.error('Error loading file:', error);
      const fallbackContent = `---
title: "${fileName.replace('.md', '').replace('-', ' ')}"
path: "/${fileName.replace('.md', '')}"
visibility: "PUBLIC"
---
***

# ${fileName.replace('.md', '').replace('-', ' ')}

Start editing this file...`;
      setFileContents(prev => ({ ...prev, [fileName]: fallbackContent }));
      setOriginalContents(prev => ({ ...prev, [fileName]: fallbackContent }));
    }
    setIsLoading(false);
  };

  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
  };

  const handleContentChange = (content: string) => {
    if (selectedFile) {
      setFileContents(prev => ({ ...prev, [selectedFile]: content }));
    }
  };

  const getModifiedFiles = (): Set<string> => {
    const modified = new Set<string>();
    Object.keys(fileContents).forEach(fileName => {
      if (fileContents[fileName] !== originalContents[fileName]) {
        modified.add(fileName);
      }
    });
    return modified;
  };

  const hasChanges = selectedFile ? 
    fileContents[selectedFile] !== originalContents[selectedFile] : false;

  const handleSave = async () => {
    const modifiedFiles = getModifiedFiles();
    
    if (modifiedFiles.size === 0) {
      toast.info('No changes to save');
      return;
    }

    const configured = await githubService.isConfigured();
    if (!configured) {
      toast.error('GitHub not configured. Please sign in with GitHub to create pull requests.');
      return;
    }

    setIsLoading(true);
    try {
      // Convert file names back to actual paths in the repository
      const files = Array.from(modifiedFiles).map(fileName => {
        // Map back to the actual file paths in public/content
        const pathMappings: Record<string, string> = {
          'fundamentals.md': 'public/content/meet-pieces/fundamentals.md',
          'windows-installation-guide.md': 'public/content/meet-pieces/windows-installation-guide.md',
          'macos-installation-guide.md': 'public/content/meet-pieces/macos-installation-guide.md',
          'linux-installation-guide.md': 'public/content/meet-pieces/linux-installation-guide.md',
          'cross-platform.md': 'public/content/meet-pieces/troubleshooting/cross-platform.md',
          'macos.md': 'public/content/meet-pieces/troubleshooting/macos.md',
          'windows.md': 'public/content/meet-pieces/troubleshooting/windows.md',
          'linux.md': 'public/content/meet-pieces/troubleshooting/linux.md',
          'overview.md': 'public/content/quick-guides/overview.md',
          'ltm-context.md': 'public/content/quick-guides/ltm-context.md',
          'copilot-with-context.md': 'public/content/quick-guides/copilot-with-context.md',
          'download.md': 'public/content/desktop/download.md',
          'onboarding.md': 'public/content/desktop/onboarding.md',
        };

        const actualPath = pathMappings[fileName] || `public/content/${fileName}`;

        return {
          path: actualPath,
          content: fileContents[fileName],
        };
      });

      const result = await githubService.createPullRequest({
        title: `Update documentation files`,
        body: `Updated ${modifiedFiles.size} file(s):\n\n${Array.from(modifiedFiles).map(f => `- ${f}`).join('\n')}`,
        files,
      });

      if (result.success) {
        toast.success(`Pull request created successfully! PR #${result.prNumber}`);
        // Update original contents to match current
        setOriginalContents({ ...fileContents });
      }
    } catch (error) {
      console.error('Error creating pull request:', error);
      toast.error('Failed to create pull request. Please try again.');
    }
    setIsLoading(false);
  };

  const currentContent = selectedFile ? fileContents[selectedFile] || '' : '';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="lg:hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
            </div>
          </div>
        </div>
        <SheetContent side="left" className="p-0 w-64">
          <EditorSidebar 
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            modifiedFiles={getModifiedFiles()}
          />
        </SheetContent>
      </Sheet>

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64 border-r border-border bg-card">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold">Editor</span>
              </div>
              <ThemeToggle />
            </div>
            <div className="flex-1 overflow-y-auto">
              <EditorSidebar 
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                modifiedFiles={getModifiedFiles()}
              />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <header className="border-b border-border bg-background/80 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <h1 className="text-lg font-semibold">Documentation Editor</h1>
                  {getModifiedFiles().size > 0 && (
                    <Button 
                      onClick={handleSave}
                      disabled={isLoading}
                      size="sm"
                      className="ml-4"
                    >
                      <GitPullRequest className="h-4 w-4 mr-2" />
                      {isLoading ? 'Creating PR...' : `Create PR (${getModifiedFiles().size} files)`}
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">
                    {user?.email}
                  </span>
                  <Button onClick={signOut} variant="outline" size="sm">
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 relative overflow-hidden">
            <EditorMain 
              selectedFile={selectedFile}
              content={currentContent}
              onContentChange={handleContentChange}
              onSave={handleSave}
              hasChanges={hasChanges}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
