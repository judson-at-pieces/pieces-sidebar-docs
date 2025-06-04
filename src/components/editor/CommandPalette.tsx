
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Type, Hash, Image as ImageIcon, AlertCircle, List, Quote, Code, Link } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
  position: { top: number; left: number };
}

const commands = [
  {
    id: 'heading',
    label: 'Heading',
    icon: Hash,
    content: '## Your heading here',
    description: 'Add a section heading'
  },
  {
    id: 'text',
    label: 'Paragraph',
    icon: Type,
    content: 'Your paragraph text here...',
    description: 'Add a text paragraph'
  },
  {
    id: 'image',
    label: 'Image',
    icon: ImageIcon,
    content: '<Image src="https://your-image-url.com" alt="Description" align="center" fullwidth="false" />',
    description: 'Insert an image'
  },
  {
    id: 'callout',
    label: 'Callout',
    icon: AlertCircle,
    content: ':::info\nYour callout content here...\n:::',
    description: 'Add an info callout'
  },
  {
    id: 'card',
    label: 'Card',
    icon: Quote,
    content: '<Card title="Card Title" image="https://image-url.com">\nCard content goes here...\n</Card>',
    description: 'Insert a content card'
  },
  {
    id: 'cardgroup',
    label: 'Card Group',
    icon: Quote,
    content: '<CardGroup cols={2}>\n  <Card title="Card 1">\n    Content 1\n  </Card>\n  <Card title="Card 2">\n    Content 2\n  </Card>\n</CardGroup>',
    description: 'Insert a group of cards'
  },
  {
    id: 'list',
    label: 'List',
    icon: List,
    content: '- Item 1\n- Item 2\n- Item 3',
    description: 'Add a bulleted list'
  },
  {
    id: 'code',
    label: 'Code Block',
    icon: Code,
    content: '```javascript\n// Your code here\nconsole.log("Hello World");\n```',
    description: 'Insert a code block'
  },
  {
    id: 'link',
    label: 'Link',
    icon: Link,
    content: '[Link text](https://example.com)',
    description: 'Add a link'
  }
];

export function CommandPalette({ isOpen, onClose, onInsert, position }: CommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [search, setSearch] = useState('');

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setSearch('');
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
        className="fixed z-50 w-80"
        style={{ 
          top: Math.min(position.top, window.innerHeight - 400),
          left: Math.min(position.left, window.innerWidth - 320)
        }}
      >
        <Card className="shadow-lg border-2">
          <CardContent className="p-0">
            {/* Search Input */}
            <div className="p-3 border-b">
              <input
                type="text"
                placeholder="Search commands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-transparent border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            
            {/* Commands List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredCommands.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No commands found
                </div>
              ) : (
                filteredCommands.map((command, index) => {
                  const Icon = command.icon;
                  return (
                    <div
                      key={command.id}
                      className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                        index === selectedIndex ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => onInsert(command.content)}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{command.label}</div>
                        <div className="text-xs text-muted-foreground">{command.description}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Footer */}
            <div className="p-2 border-t bg-muted/50 text-xs text-muted-foreground text-center">
              ↑↓ to navigate • Enter to select • Esc to cancel
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
