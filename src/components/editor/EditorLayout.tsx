
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
import { loadMarkdownContent } from "@/lib/content";

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
      // Try to load from content system
      const contentPage = await loadMarkdownContent(fileName.replace('.md', ''));
      const content = contentPage?.content || `# ${fileName.replace('.md', '').replace('-', ' ')}\n\nStart editing this file...`;
      
      setFileContents(prev => ({ ...prev, [fileName]: content }));
      setOriginalContents(prev => ({ ...prev, [fileName]: content }));
    } catch (error) {
      console.error('Error loading file:', error);
      // Fallback content
      const content = `# ${fileName.replace('.md', '').replace('-', ' ')}\n\nStart editing this file...`;
      setFileContents(prev => ({ ...prev, [fileName]: content }));
      setOriginalContents(prev => ({ ...prev, [fileName]: content }));
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

    if (!githubService.isConfigured()) {
      toast.error('GitHub not configured. Please set up your GitHub integration first.');
      return;
    }

    setIsLoading(true);
    try {
      const files = Array.from(modifiedFiles).map(fileName => ({
        path: `public/content/${fileName}`,
        content: fileContents[fileName],
      }));

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
