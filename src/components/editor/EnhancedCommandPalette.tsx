
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Type, Hash, Image as ImageIcon, AlertCircle, List, Quote, Code, Link,
  Table, Separator, FileText, Layout, Grid, Lightbulb, Zap, Star
} from 'lucide-react';

interface EnhancedCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
  position: { top: number; left: number };
}

const commands = [
  // Basic Elements
  {
    id: 'heading-1',
    label: 'Heading 1',
    icon: Hash,
    content: '# Your main heading here',
    description: 'Large page title',
    category: 'headings',
    tags: ['h1', 'title', 'heading']
  },
  {
    id: 'heading-2',
    label: 'Heading 2',
    icon: Hash,
    content: '## Your section heading here',
    description: 'Section heading',
    category: 'headings',
    tags: ['h2', 'section', 'heading']
  },
  {
    id: 'heading-3',
    label: 'Heading 3',
    icon: Hash,
    content: '### Your subsection heading here',
    description: 'Subsection heading',
    category: 'headings',
    tags: ['h3', 'subsection', 'heading']
  },
  {
    id: 'paragraph',
    label: 'Paragraph',
    icon: Type,
    content: 'Your paragraph text here. Add your content and format it as needed.',
    description: 'Regular text paragraph',
    category: 'text',
    tags: ['text', 'paragraph', 'content']
  },
  
  // Lists
  {
    id: 'bullet-list',
    label: 'Bullet List',
    icon: List,
    content: '- First item\n- Second item\n- Third item',
    description: 'Unordered list with bullets',
    category: 'lists',
    tags: ['list', 'bullet', 'items']
  },
  {
    id: 'numbered-list',
    label: 'Numbered List',
    icon: List,
    content: '1. First step\n2. Second step\n3. Third step',
    description: 'Ordered list with numbers',
    category: 'lists',
    tags: ['list', 'numbered', 'ordered', 'steps']
  },
  
  // Media
  {
    id: 'image',
    label: 'Image',
    icon: ImageIcon,
    content: '<Image src="https://your-image-url.com" alt="Description" align="center" fullwidth="false" />',
    description: 'Insert an image with alignment options',
    category: 'media',
    tags: ['image', 'media', 'visual']
  },
  
  // Components
  {
    id: 'callout-info',
    label: 'Info Callout',
    icon: AlertCircle,
    content: '<Callout type="info">\nYour information message here...\n</Callout>',
    description: 'Blue info callout box',
    category: 'components',
    tags: ['callout', 'info', 'note', 'highlight']
  },
  {
    id: 'callout-warning',
    label: 'Warning Callout',
    icon: AlertCircle,
    content: '<Callout type="warning">\nYour warning message here...\n</Callout>',
    description: 'Yellow warning callout box',
    category: 'components',
    tags: ['callout', 'warning', 'caution', 'alert']
  },
  {
    id: 'callout-tip',
    label: 'Tip Callout',
    icon: Lightbulb,
    content: '<Callout type="tip">\nYour helpful tip here...\n</Callout>',
    description: 'Green tip callout box',
    category: 'components',
    tags: ['callout', 'tip', 'advice', 'help']
  },
  
  // Cards
  {
    id: 'card',
    label: 'Card',
    icon: Quote,
    content: '<Card title="Card Title" image="https://image-url.com">\nCard content goes here. Add your description, links, and other details.\n</Card>',
    description: 'Content card with title and image',
    category: 'components',
    tags: ['card', 'container', 'content']
  },
  {
    id: 'card-group-2',
    label: 'Card Group (2 columns)',
    icon: Grid,
    content: '<CardGroup cols={2}>\n  <Card title="First Card">\n    Content for the first card\n  </Card>\n  <Card title="Second Card">\n    Content for the second card\n  </Card>\n</CardGroup>',
    description: 'Two cards side by side',
    category: 'components',
    tags: ['cards', 'grid', 'layout', 'columns']
  },
  {
    id: 'card-group-3',
    label: 'Card Group (3 columns)',
    icon: Grid,
    content: '<CardGroup cols={3}>\n  <Card title="Card 1">\n    Content 1\n  </Card>\n  <Card title="Card 2">\n    Content 2\n  </Card>\n  <Card title="Card 3">\n    Content 3\n  </Card>\n</CardGroup>',
    description: 'Three cards in a row',
    category: 'components',
    tags: ['cards', 'grid', 'layout', 'columns']
  },
  
  // Code
  {
    id: 'code-block',
    label: 'Code Block',
    icon: Code,
    content: '```javascript\n// Your code here\nconsole.log("Hello World");\n```',
    description: 'Syntax highlighted code block',
    category: 'code',
    tags: ['code', 'programming', 'syntax']
  },
  {
    id: 'inline-code',
    label: 'Inline Code',
    icon: Code,
    content: '`your code here`',
    description: 'Small inline code snippet',
    category: 'code',
    tags: ['code', 'inline', 'monospace']
  },
  
  // Layout
  {
    id: 'horizontal-rule',
    label: 'Horizontal Rule',
    icon: Separator,
    content: '---',
    description: 'Horizontal divider line',
    category: 'layout',
    tags: ['divider', 'separator', 'line']
  },
  {
    id: 'table',
    label: 'Table',
    icon: Table,
    content: '| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Row 1 Col 1 | Row 1 Col 2 | Row 1 Col 3 |\n| Row 2 Col 1 | Row 2 Col 2 | Row 2 Col 3 |',
    description: 'Data table with headers',
    category: 'layout',
    tags: ['table', 'data', 'grid', 'rows']
  },
  
  // Links
  {
    id: 'link',
    label: 'Link',
    icon: Link,
    content: '[Link text](https://example.com)',
    description: 'Hyperlink to external page',
    category: 'text',
    tags: ['link', 'url', 'hyperlink']
  },
  
  // Steps
  {
    id: 'steps',
    label: 'Steps',
    icon: List,
    content: '<Steps>\n  <Step title="First Step">\n    Description of the first step\n  </Step>\n  <Step title="Second Step">\n    Description of the second step\n  </Step>\n  <Step title="Third Step">\n    Description of the third step\n  </Step>\n</Steps>',
    description: 'Numbered step-by-step guide',
    category: 'components',
    tags: ['steps', 'tutorial', 'guide', 'process']
  }
];

const categories = {
  headings: { label: 'Headings', icon: Hash },
  text: { label: 'Text', icon: Type },
  lists: { label: 'Lists', icon: List },
  media: { label: 'Media', icon: ImageIcon },
  components: { label: 'Components', icon: Layout },
  code: { label: 'Code', icon: Code },
  layout: { label: 'Layout', icon: Grid }
};

export function EnhancedCommandPalette({ isOpen, onClose, onInsert, position }: EnhancedCommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCommands = commands.filter(cmd => {
    const matchesSearch = search === '' || 
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase()) ||
      cmd.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = !selectedCategory || cmd.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setSearch('');
      setSelectedCategory(null);
    }
  }, [isOpen]);

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
        <Card className="shadow-xl border-2 bg-background/95 backdrop-blur">
          <CardContent className="p-0">
            {/* Header */}
            <div className="p-4 border-b bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-sm">Insert Component</span>
              </div>
              
              <Input
                type="text"
                placeholder="Search components..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm"
                autoFocus
              />
            </div>
            
            {/* Categories */}
            <div className="p-2 border-b bg-background">
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={selectedCategory === null ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="h-7 px-2 text-xs"
                >
                  All
                </Button>
                {Object.entries(categories).map(([key, category]) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={key}
                      variant={selectedCategory === key ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedCategory(key)}
                      className="h-7 px-2 text-xs gap-1"
                    >
                      <Icon className="h-3 w-3" />
                      {category.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            {/* Commands List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredCommands.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No components found for "{search}"
                </div>
              ) : (
                filteredCommands.map((command, index) => {
                  const Icon = command.icon;
                  return (
                    <div
                      key={command.id}
                      className={`p-3 flex items-start gap-3 cursor-pointer transition-colors border-l-2 ${
                        index === selectedIndex 
                          ? 'bg-primary/10 border-l-primary' 
                          : 'hover:bg-muted/50 border-l-transparent'
                      }`}
                      onClick={() => onInsert(command.content)}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{command.label}</div>
                          <Badge variant="outline" className="text-xs">
                            {categories[command.category as keyof typeof categories]?.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {command.description}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Footer */}
            <div className="p-2 border-t bg-muted/50 text-xs text-muted-foreground text-center">
              <div className="flex justify-center gap-4">
                <span>↑↓ navigate</span>
                <span>Enter select</span>
                <span>Esc cancel</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
