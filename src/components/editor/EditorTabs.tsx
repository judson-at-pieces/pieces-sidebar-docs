
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Navigation, Settings } from "lucide-react";
import { EditorMain } from "./EditorMain";
import { NavigationEditor } from "./NavigationEditor";
import { FileNode } from "@/utils/fileSystem";

interface EditorTabsProps {
  selectedFile?: string;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  hasChanges: boolean;
  fileStructure: FileNode[];
  onNavigationChange: () => void;
}

export function EditorTabs({
  selectedFile,
  content,
  onContentChange,
  onSave,
  hasChanges,
  fileStructure,
  onNavigationChange
}: EditorTabsProps) {
  const [activeTab, setActiveTab] = useState("content");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
        <TabsTrigger value="content" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Content Editor
        </TabsTrigger>
        <TabsTrigger value="navigation" className="flex items-center gap-2">
          <Navigation className="h-4 w-4" />
          Navigation Editor
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="content" className="flex-1 m-0">
        <EditorMain
          selectedFile={selectedFile}
          content={content}
          onContentChange={onContentChange}
          onSave={onSave}
          hasChanges={hasChanges}
        />
      </TabsContent>
      
      <TabsContent value="navigation" className="flex-1 m-0">
        <NavigationEditor
          fileStructure={fileStructure}
          onNavigationChange={onNavigationChange}
        />
      </TabsContent>
      
      <TabsContent value="settings" className="flex-1 m-0 p-4">
        <div className="text-center text-muted-foreground">
          Settings panel coming soon...
        </div>
      </TabsContent>
    </Tabs>
  );
}
