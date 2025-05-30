
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, Edit } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export function EditorMain() {
  const [content, setContent] = useState(`# Welcome to the Editor

This is a markdown editor where you can edit documentation files.

## Features

- Live preview
- Syntax highlighting
- File management
- Auto-save

Edit this content to see the changes in real-time.`);

  const [activeTab, setActiveTab] = useState("edit");

  return (
    <div className="h-full flex flex-col">
      {/* Editor toolbar */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">fundamentals.md</span>
            <span className="text-xs text-muted-foreground">• Modified</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
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
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full resize-none font-mono text-sm"
              placeholder="Start writing your documentation..."
            />
          </TabsContent>

          <TabsContent value="preview" className="flex-1 p-4 m-0">
            <div className="prose prose-sm max-w-none h-full overflow-y-auto">
              <div className="whitespace-pre-wrap">{content}</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
