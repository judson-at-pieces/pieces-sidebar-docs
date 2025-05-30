
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, FileText, GitPullRequest, ExternalLink } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { EditorSidebar } from "./EditorSidebar";
import { EditorMain } from "./EditorMain";
import { githubAppService } from "@/services/githubAppService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileNode, loadContentStructure } from "@/utils/fileSystem";

interface FileContent {
  [fileName: string]: string;
}

export function EditorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [selectedFile, setSelectedFile] = useState<string>();
  const [fileContents, setFileContents] = useState<FileContent>({});
  const [originalContents, setOriginalContents] = useState<FileContent>({});
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load file structure on mount
  useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true);
      try {
        const structure = await loadContentStructure();
        setFileStructure(structure);
      } catch (error) {
        console.error('Failed to load file structure:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, []);

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

  const addFileToStructure = (structure: FileNode[], filePath: string, fileName: string): FileNode[] => {
    const updatedStructure = [...structure];
    
    if (!filePath) {
      // Add to root
      const newFile: FileNode = {
        name: fileName,
        type: 'file',
        path: fileName
      };
      updatedStructure.push(newFile);
      return updatedStructure;
    }

    // Find the parent folder and add the file
    const findAndAddFile = (nodes: FileNode[], targetPath: string): boolean => {
      for (const node of nodes) {
        if (node.type === 'folder' && node.path === targetPath) {
          if (!node.children) {
            node.children = [];
          }
          const newFile: FileNode = {
            name: fileName,
            type: 'file',
            path: `${targetPath}/${fileName}`
          };
          node.children.push(newFile);
          return true;
        }
        if (node.children && findAndAddFile(node.children, targetPath)) {
          return true;
        }
      }
      return false;
    };

    findAndAddFile(updatedStructure, filePath);
    return updatedStructure;
  };

  const handleCreateFile = (fileName: string, parentPath?: string) => {
    const cleanFileName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    const fullPath = parentPath ? `${parentPath}/${cleanFileName}` : cleanFileName;
    
    // Create default content for new file
    const defaultContent = `---
title: "${cleanFileName.replace('.md', '').replace('-', ' ')}"
path: "/${fullPath.replace('.md', '')}"
visibility: "PUBLIC"
---
***

# ${cleanFileName.replace('.md', '').replace('-', ' ')}

Start editing this file...`;

    // Add to file contents
    setFileContents(prev => ({ ...prev, fullPath: defaultContent }));
    setOriginalContents(prev => ({ ...prev, fullPath: defaultContent }));
    
    // Update file structure in real-time
    setFileStructure(prev => addFileToStructure(prev, parentPath || '', cleanFileName));
    
    // Select the new file
    setSelectedFile(fullPath);
    
    toast.success(`Created new file: ${cleanFileName}`);
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
      toast.error('No changes to save');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting GitHub App PR creation process...');
      
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

      if (!user) {
        toast.error('You must be logged in to create pull requests');
        return;
      }

      console.log('GitHub App token found, preparing files for PR...');

      const files = Array.from(modifiedFiles).map(fileName => {
        return {
          path: `public/content/${fileName}`,
          content: fileContents[fileName],
        };
      });

      console.log('Prepared files for PR:', files.map(f => f.path));

      // Use the GitHub App service to create branch and PR
      const result = await githubAppService.createBranchAndPR(
        githubConfig.installation_id,
        repo_owner,
        repo_name,
        {
          title: `Update documentation files`,
          body: `Updated ${modifiedFiles.size} file(s) by ${user.email}:\n\n${Array.from(modifiedFiles).map(f => `- ${f}`).join('\n')}`,
          files,
        }
      );

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
        // Update original contents to match current
        setOriginalContents({ ...fileContents });
      } else {
        throw new Error('Failed to create pull request');
      }
    } catch (error: any) {
      console.error('Error creating pull request:', error);
      
      // The GitHubAppService now provides more specific error messages
      if (error.message.includes('GitHub app') || error.message.includes('installation')) {
        toast.error('Please ensure the Pieces Documentation Bot is installed on your repository. Check the Admin panel for setup instructions.');
      } else {
        toast.error(error.message || 'Failed to create pull request. Please try again.');
      }
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
        <SheetContent side="left" className="p-0 w-[85vw] max-w-sm">
          <ScrollArea className="h-full">
            <EditorSidebar 
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              modifiedFiles={getModifiedFiles()}
              onCreateFile={handleCreateFile}
              fileStructure={fileStructure}
              isLoading={isLoading}
            />
          </ScrollArea>
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
                onCreateFile={handleCreateFile}
                fileStructure={fileStructure}
                isLoading={isLoading}
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
