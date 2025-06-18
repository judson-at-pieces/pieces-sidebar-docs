
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Type, Hash, Image as ImageIcon, AlertCircle, List, Quote, Code, Link, 
  FileText, Table, Calendar, Tag, Zap, Star, Layers, Box, Grid3x3,
  ChevronRight, Search, Sparkles
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  content: string;
  description: string;
  category: string;
  keywords: string[];
}

interface EnhancedCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
  position: { top: number; left: number };
}

const commands: Command[] = [
  // Text Elements
  {
    id: 'h1',
    label: 'Heading 1',
    icon: Hash,
    content: '# Your main heading here',
    description: 'Large page title',
    category: 'Text',
    keywords: ['heading', 'title', 'h1', 'large']
  },
  {
    id: 'h2',
    label: 'Heading 2',
    icon: Hash,
    content: '## Your section heading here',
    description: 'Section heading',
    category: 'Text',
    keywords: ['heading', 'section', 'h2']
  },
  {
    id: 'h3',
    label: 'Heading 3',
    icon: Hash,
    content: '### Your subsection heading here',
    description: 'Subsection heading',
    category: 'Text',
    keywords: ['heading', 'subsection', 'h3']
  },
  {
    id: 'paragraph',
    label: 'Paragraph',
    icon: Type,
    content: 'Your paragraph text here. You can write multiple sentences and they will flow naturally.',
    description: 'Regular text paragraph',
    category: 'Text',
    keywords: ['text', 'paragraph', 'content']
  },
  {
    id: 'bold',
    label: 'Bold Text',
    icon: Type,
    content: '**Your bold text here**',
    description: 'Bold emphasis',
    category: 'Text',
    keywords: ['bold', 'strong', 'emphasis']
  },
  {
    id: 'italic',
    label: 'Italic Text',
    icon: Type,
    content: '_Your italic text here_',
    description: 'Italic emphasis',
    category: 'Text',
    keywords: ['italic', 'emphasis']
  },

  // Lists
  {
    id: 'bullet-list',
    label: 'Bullet List',
    icon: List,
    content: '- First item\n- Second item\n- Third item',
    description: 'Bulleted list',
    category: 'Lists',
    keywords: ['list', 'bullet', 'items']
  },
  {
    id: 'numbered-list',
    label: 'Numbered List',
    icon: List,
    content: '1. First item\n2. Second item\n3. Third item',
    description: 'Numbered list',
    category: 'Lists',
    keywords: ['list', 'numbered', 'ordered']
  },
  {
    id: 'checklist',
    label: 'Checklist',
    icon: List,
    content: '- [ ] Unchecked item\n- [x] Checked item\n- [ ] Another unchecked item',
    description: 'Task checklist',
    category: 'Lists',
    keywords: ['checklist', 'todo', 'tasks']
  },

  // Media
  {
    id: 'image',
    label: 'Image',
    icon: ImageIcon,
    content: '<Image src="https://your-image-url.com" alt="Description" align="center" fullwidth="false" />',
    description: 'Insert an image',
    category: 'Media',
    keywords: ['image', 'picture', 'media']
  },
  {
    id: 'simple-image',
    label: 'Simple Image',
    icon: ImageIcon,
    content: '![Alt text](https://your-image-url.com)',
    description: 'Basic markdown image',
    category: 'Media',
    keywords: ['image', 'markdown', 'simple']
  },

  // Components
  {
    id: 'callout-info',
    label: 'Info Callout',
    icon: AlertCircle,
    content: ':::info\nYour important information here...\n:::',
    description: 'Information callout box',
    category: 'Components',
    keywords: ['callout', 'info', 'note']
  },
  {
    id: 'callout-warning',
    label: 'Warning Callout',
    icon: AlertCircle,
    content: ':::warning\nYour warning message here...\n:::',
    description: 'Warning callout box',
    category: 'Components',
    keywords: ['callout', 'warning', 'alert']
  },
  {
    id: 'callout-error',
    label: 'Error Callout',
    icon: AlertCircle,
    content: ':::error\nYour error message here...\n:::',
    description: 'Error callout box',
    category: 'Components',
    keywords: ['callout', 'error', 'danger']
  },
  {
    id: 'card',
    label: 'Card',
    icon: Box,
    content: '<Card title="Card Title" image="https://image-url.com">\nCard content goes here...\n</Card>',
    description: 'Content card component',
    category: 'Components',
    keywords: ['card', 'component', 'container']
  },
  {
    id: 'card-group',
    label: 'Card Group',
    icon: Grid3x3,
    content: '<CardGroup cols={2}>\n  <Card title="Card 1">\n    Content 1\n  </Card>\n  <Card title="Card 2">\n    Content 2\n  </Card>\n</CardGroup>',
    description: 'Group of cards',
    category: 'Components',
    keywords: ['cards', 'group', 'grid']
  },

  // Code
  {
    id: 'inline-code',
    label: 'Inline Code',
    icon: Code,
    content: '`your code here`',
    description: 'Inline code snippet',
    category: 'Code',
    keywords: ['code', 'inline', 'snippet']
  },
  {
    id: 'code-block',
    label: 'Code Block',
    icon: Code,
    content: '```javascript\n// Your code here\nconsole.log("Hello World");\n```',
    description: 'Multi-line code block',
    category: 'Code',
    keywords: ['code', 'block', 'javascript']
  },
  {
    id: 'code-typescript',
    label: 'TypeScript Code',
    icon: Code,
    content: '```typescript\ninterface User {\n  id: number;\n  name: string;\n}\n```',
    description: 'TypeScript code block',
    category: 'Code',
    keywords: ['code', 'typescript', 'ts']
  },

  // Links & Navigation
  {
    id: 'link',
    label: 'Link',
    icon: Link,
    content: '[Link text](https://example.com)',
    description: 'External or internal link',
    category: 'Links',
    keywords: ['link', 'url', 'navigation']
  },
  {
    id: 'internal-link',
    label: 'Internal Link',
    icon: Link,
    content: '[Page title](/internal-page)',
    description: 'Link to another page',
    category: 'Links',
    keywords: ['link', 'internal', 'page']
  },

  // Structure
  {
    id: 'table',
    label: 'Table',
    icon: Table,
    content: '| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Row 1    | Data     | Data     |\n| Row 2    | Data     | Data     |',
    description: 'Data table',
    category: 'Structure',
    keywords: ['table', 'data', 'columns']
  },
  {
    id: 'quote',
    label: 'Quote',
    icon: Quote,
    content: '> This is a quote or important statement that stands out from the rest of the content.',
    description: 'Blockquote',
    category: 'Structure',
    keywords: ['quote', 'blockquote', 'citation']
  },
  {
    id: 'horizontal-rule',
    label: 'Horizontal Rule',
    icon: Type,
    content: '---',
    description: 'Divider line',
    category: 'Structure',
    keywords: ['divider', 'separator', 'line']
  },

  // Advanced
  {
    id: 'steps',
    label: 'Steps',
    icon: Layers,
    content: '<Steps>\n  <Step>First step description</Step>\n  <Step>Second step description</Step>\n  <Step>Third step description</Step>\n</Steps>',
    description: 'Step-by-step instructions',
    category: 'Advanced',
    keywords: ['steps', 'instructions', 'tutorial']
  },
  {
    id: 'tabs',
    label: 'Tabs',
    icon: Layers,
    content: '<Tabs>\n  <Tab title="Tab 1">\n    Content for tab 1\n  </Tab>\n  <Tab title="Tab 2">\n    Content for tab 2\n  </Tab>\n</Tabs>',
    description: 'Tabbed content',
    category: 'Advanced',
    keywords: ['tabs', 'tabbed', 'content']
  }
];

const categories = ['All', 'Text', 'Lists', 'Media', 'Components', 'Code', 'Links', 'Structure', 'Advanced'];

export function EnhancedCommandPalette({ isOpen, onClose, onInsert, position }: EnhancedCommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredCommands = commands.filter(cmd => {
    const matchesSearch = cmd.label.toLowerCase().includes(search.toLowerCase()) ||
                         cmd.description.toLowerCase().includes(search.toLowerCase()) ||
                         cmd.keywords.some(keyword => keyword.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || cmd.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search, selectedCategory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onInsert(filteredCommands[selectedIndex].content);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onInsert, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-transparent" 
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div 
        className="fixed z-50 w-96"
        style={{ 
          top: Math.min(position.top, window.innerHeight - 500),
          left: Math.min(position.left, window.innerWidth - 400)
        }}
      >
        <Card className="shadow-2xl border-2 bg-background/95 backdrop-blur-sm">
          <CardContent className="p-0">
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-lg">Content Library</span>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search components and elements..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-background/50"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Categories */}
            <div className="p-2 border-b bg-muted/20">
              <div className="flex flex-wrap gap-1">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="h-7 px-2 text-xs"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Commands List */}
            <div className="max-h-80 overflow-y-auto">
              {filteredCommands.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No components found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                filteredCommands.map((command, index) => {
                  const Icon = command.icon;
                  return (
                    <div
                      key={command.id}
                      className={`p-3 flex items-start gap-3 cursor-pointer transition-all duration-150 ${
                        index === selectedIndex 
                          ? 'bg-primary/10 border-l-2 border-primary' 
                          : 'hover:bg-muted/50 border-l-2 border-transparent'
                      }`}
                      onClick={() => onInsert(command.content)}
                    >
                      <div className={`p-1.5 rounded-md ${
                        index === selectedIndex ? 'bg-primary/20' : 'bg-muted/30'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{command.label}</span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {command.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {command.description}
                        </p>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-50" />
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Footer */}
            <div className="p-3 border-t bg-muted/10 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>↑↓ navigate • Enter select • Esc cancel</span>
                <span className="text-purple-600 font-medium">{filteredCommands.length} items</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
