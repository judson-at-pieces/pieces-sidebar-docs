
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Type, Image as ImageIcon, AlertCircle, List, Hash, Quote, Code, Save, Edit } from 'lucide-react';
import HashnodeMarkdownRenderer from '@/components/HashnodeMarkdownRenderer';

interface WYSIWYGEditorProps {
  content: string;
  onContentChange: (content: string) => void;
}

interface EditableElement {
  id: string;
  type: 'text' | 'heading' | 'image' | 'callout' | 'card' | 'steps' | 'list';
  content: string;
  props?: Record<string, any>;
}

export function WYSIWYGEditor({ content, onContentChange }: WYSIWYGEditorProps) {
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [insertPosition, setInsertPosition] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse content into editable elements
  const parseContent = (markdownContent: string): EditableElement[] => {
    const lines = markdownContent.split('\n');
    const elements: EditableElement[] = [];
    let currentElement = '';
    let elementType: EditableElement['type'] = 'text';
    let elementId = 0;

    for (const line of lines) {
      if (line.startsWith('# ')) {
        if (currentElement) {
          elements.push({
            id: `element-${elementId++}`,
            type: elementType,
            content: currentElement.trim()
          });
          currentElement = '';
        }
        elementType = 'heading';
        currentElement = line;
      } else if (line.startsWith('<Image')) {
        if (currentElement) {
          elements.push({
            id: `element-${elementId++}`,
            type: elementType,
            content: currentElement.trim()
          });
          currentElement = '';
        }
        elementType = 'image';
        currentElement = line;
      } else if (line.startsWith('<Callout') || line.startsWith(':::')) {
        if (currentElement) {
          elements.push({
            id: `element-${elementId++}`,
            type: elementType,
            content: currentElement.trim()
          });
          currentElement = '';
        }
        elementType = 'callout';
        currentElement = line;
      } else {
        if (elementType !== 'text' && currentElement) {
          elements.push({
            id: `element-${elementId++}`,
            type: elementType,
            content: currentElement.trim()
          });
          elementType = 'text';
          currentElement = '';
        }
        currentElement += line + '\n';
      }
    }

    if (currentElement.trim()) {
      elements.push({
        id: `element-${elementId++}`,
        type: elementType,
        content: currentElement.trim()
      });
    }

    return elements;
  };

  const elements = parseContent(content);

  const insertElement = (type: EditableElement['type'], position: number) => {
    let newContent = '';
    
    switch (type) {
      case 'heading':
        newContent = '## New Heading';
        break;
      case 'text':
        newContent = 'New paragraph text...';
        break;
      case 'image':
        newContent = '<Image src="" alt="" align="center" fullwidth="false" />';
        break;
      case 'callout':
        newContent = ':::info\nNew callout content...\n:::';
        break;
      case 'card':
        newContent = '<Card title="New Card" image="">\nCard content...\n</Card>';
        break;
      case 'steps':
        newContent = '<Steps>\n  <Step title="Step 1">\n    Step content...\n  </Step>\n</Steps>';
        break;
      case 'list':
        newContent = '- List item 1\n- List item 2\n- List item 3';
        break;
    }

    const lines = content.split('\n');
    lines.splice(position, 0, '', newContent, '');
    onContentChange(lines.join('\n'));
    setShowInsertMenu(false);
  };

  const updateElement = (elementId: string, newContent: string) => {
    const elementIndex = elements.findIndex(el => el.id === elementId);
    if (elementIndex === -1) return;

    const updatedElements = [...elements];
    updatedElements[elementIndex] = {
      ...updatedElements[elementIndex],
      content: newContent
    };

    const newMarkdown = updatedElements.map(el => el.content).join('\n\n');
    onContentChange(newMarkdown);
    setEditingElement(null);
  };

  const renderEditableElement = (element: EditableElement, index: number) => {
    const isCurrentlyEditing = editingElement === element.id;

    if (isCurrentlyEditing) {
      return (
        <div key={element.id} className="border-2 border-primary rounded-lg p-4 bg-background mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Editing {element.type}
            </div>
            <Button
              size="sm"
              onClick={() => setEditingElement(null)}
              className="h-6 px-2 text-xs"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
          <Textarea
            value={element.content}
            onChange={(e) => {
              // Update immediately for preview
              const updatedElements = [...elements];
              updatedElements[index] = { ...element, content: e.target.value };
              const newMarkdown = updatedElements.map(el => el.content).join('\n\n');
              onContentChange(newMarkdown);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setEditingElement(null);
              }
              if (e.key === 'Enter' && e.ctrlKey) {
                setEditingElement(null);
              }
            }}
            className="min-h-[100px] font-mono text-sm"
            autoFocus
          />
          <div className="mt-2 text-xs text-muted-foreground">
            Press Ctrl+Enter to finish editing, Esc to cancel
          </div>
        </div>
      );
    }

    return (
      <div
        key={element.id}
        className="relative group mb-4 p-2 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setEditingElement(element.id);
        }}
      >
        <div className="pointer-events-none">
          <HashnodeMarkdownRenderer content={element.content} />
        </div>
        
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setEditingElement(element.id);
            }}
            className="h-6 px-2 text-xs bg-background shadow-sm"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setInsertPosition(index + 1);
              setShowInsertMenu(true);
            }}
            className="h-6 px-2 text-xs bg-background shadow-sm"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">WYSIWYG Editor</div>
          <div className="text-xs text-muted-foreground">
            Click elements to edit • Hover for insert options
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setInsertPosition(0);
            setShowInsertMenu(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Element
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6" ref={containerRef}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-background rounded-lg border border-border p-6 shadow-sm">
            <div className="space-y-2">
              {elements.map((element, index) => renderEditableElement(element, index))}
              
              {elements.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="mb-4">
                    <Type className="h-12 w-12 mx-auto opacity-50" />
                  </div>
                  <p className="text-lg font-medium mb-2">Start creating content</p>
                  <p className="text-sm mb-4">Click "Add Element" to begin</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setInsertPosition(0);
                      setShowInsertMenu(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Element
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Insert Menu */}
      {showInsertMenu && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Insert Element</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-12"
                  onClick={() => insertElement('text', insertPosition)}
                >
                  <Type className="h-4 w-4" />
                  Text
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-12"
                  onClick={() => insertElement('heading', insertPosition)}
                >
                  <Hash className="h-4 w-4" />
                  Heading
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-12"
                  onClick={() => insertElement('image', insertPosition)}
                >
                  <ImageIcon className="h-4 w-4" />
                  Image
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-12"
                  onClick={() => insertElement('callout', insertPosition)}
                >
                  <AlertCircle className="h-4 w-4" />
                  Callout
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-12"
                  onClick={() => insertElement('card', insertPosition)}
                >
                  <Quote className="h-4 w-4" />
                  Card
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-12"
                  onClick={() => insertElement('steps', insertPosition)}
                >
                  <List className="h-4 w-4" />
                  Steps
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowInsertMenu(false)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
