
import { useState, useEffect, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FileText, Hash, List, Quote, Table, Code, Image, AlertCircle, CheckCircle, Info, XCircle, LayoutGrid, ArrowRight, Bold, Italic, Link } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
  position: { top: number; left: number };
}

const MARKDOWN_FRAGMENTS = [
  {
    id: 'heading',
    title: 'Heading',
    description: 'Add a heading',
    icon: Hash,
    content: '\n## Your Heading Here\n\n'
  },
  {
    id: 'subheading',
    title: 'Subheading',
    description: 'Add a subheading',
    icon: Hash,
    content: '\n### Your Subheading Here\n\n'
  },
  {
    id: 'paragraph',
    title: 'Paragraph',
    description: 'Add a paragraph',
    icon: FileText,
    content: '\nYour paragraph text here.\n\n'
  },
  {
    id: 'bold',
    title: 'Bold Text',
    description: 'Add bold text',
    icon: Bold,
    content: '**bold text**'
  },
  {
    id: 'italic',
    title: 'Italic Text',
    description: 'Add italic text',
    icon: Italic,
    content: '*italic text*'
  },
  {
    id: 'link',
    title: 'Link',
    description: 'Add a link',
    icon: Link,
    content: '[link text](https://example.com)'
  },
  {
    id: 'list',
    title: 'Bullet List',
    description: 'Add a bullet list',
    icon: List,
    content: '\n- Item 1\n- Item 2\n- Item 3\n\n'
  },
  {
    id: 'ordered-list',
    title: 'Numbered List',
    description: 'Add a numbered list',
    icon: List,
    content: '\n1. First item\n2. Second item\n3. Third item\n\n'
  },
  {
    id: 'code-inline',
    title: 'Inline Code',
    description: 'Add inline code',
    icon: Code,
    content: '`your code here`'
  },
  {
    id: 'code-block',
    title: 'Code Block',
    description: 'Add a code block',
    icon: Code,
    content: '\n```javascript\n// Your code here\nconsole.log("Hello World");\n```\n\n'
  },
  {
    id: 'callout-info',
    title: 'Info Callout',
    description: 'Add an info callout',
    icon: Info,
    content: '\n:::info\nThis is an information callout. Use it to provide helpful context.\n:::\n\n'
  },
  {
    id: 'callout-warning',
    title: 'Warning Callout',
    description: 'Add a warning callout',
    icon: AlertCircle,
    content: '\n:::warning\nThis is a warning callout. Use it to highlight important notices.\n:::\n\n'
  },
  {
    id: 'callout-success',
    title: 'Success Callout',
    description: 'Add a success callout',
    icon: CheckCircle,
    content: '\n:::success\nThis is a success callout. Use it to highlight positive outcomes.\n:::\n\n'
  },
  {
    id: 'callout-error',
    title: 'Error Callout',
    description: 'Add an error callout',
    icon: XCircle,
    content: '\n:::error\nThis is an error callout. Use it to highlight problems or issues.\n:::\n\n'
  },
  {
    id: 'card',
    title: 'Card',
    description: 'Add a single card',
    icon: FileText,
    content: '\n:::card{title="Card Title" href="/link-to-page"}\nCard description goes here\n:::\n\n'
  },
  {
    id: 'card-group',
    title: 'Card Group',
    description: 'Add a group of cards',
    icon: LayoutGrid,
    content: '\n:::card-group\n:::card{title="First Card" href="/first-link"}\nDescription for the first card\n:::\n:::card{title="Second Card" href="/second-link"}\nDescription for the second card\n:::\n:::card{title="Third Card" href="/third-link"}\nDescription for the third card\n:::\n:::\n\n'
  },
  {
    id: 'steps',
    title: 'Steps',
    description: 'Add a steps component',
    icon: ArrowRight,
    content: '\n:::steps\n1. **Step 1** - Description for the first step\n2. **Step 2** - Description for the second step\n3. **Step 3** - Description for the third step\n:::\n\n'
  },
  {
    id: 'table',
    title: 'Table',
    description: 'Add a table',
    icon: Table,
    content: '\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n\n'
  },
  {
    id: 'image',
    title: 'Image',
    description: 'Add an image',
    icon: Image,
    content: '\n![Alt text](/path/to/image.png)\n\n'
  },
  {
    id: 'expandable-image',
    title: 'Expandable Image',
    description: 'Add an expandable image',
    icon: Image,
    content: '\n:::image{src="/placeholder.svg" alt="Description of the image"}\n:::\n\n'
  },
  {
    id: 'quote',
    title: 'Quote',
    description: 'Add a blockquote',
    icon: Quote,
    content: '\n> This is a blockquote. Use it to highlight important text or quotes.\n\n'
  }
];

export function CommandPalette({ isOpen, onClose, onInsert, position }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const commandRef = useRef<HTMLDivElement>(null);

  // Clear search when closing
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && commandRef.current) {
      // Focus the command input specifically
      const input = commandRef.current.querySelector('input');
      if (input) {
        input.focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking on scrollbar or command palette itself
      const target = event.target as HTMLElement;
      if (commandRef.current && !commandRef.current.contains(target)) {
        // Check if the click was on a scrollbar
        const isScrollbar = target === document.documentElement || 
                           target === document.body ||
                           (target.scrollHeight > target.clientHeight && 
                            event.clientX >= target.offsetWidth + target.offsetLeft);
        
        if (!isScrollbar) {
          onClose();
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      // Use a slight delay to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredFragments = MARKDOWN_FRAGMENTS.filter(fragment =>
    fragment.title.toLowerCase().includes(search.toLowerCase()) ||
    fragment.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      ref={commandRef}
      className="fixed z-50 w-80 bg-background border border-border rounded-lg shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        top: Math.max(0, position.top),
        left: Math.max(0, position.left),
        maxHeight: '280px',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Command className="h-auto">
        <CommandInput
          placeholder="Search markdown snippets..."
          value={search}
          onValueChange={setSearch}
          className="border-0 focus:ring-0"
        />
        <CommandList className="max-h-64" onPointerDownOutside={(e) => e.preventDefault()}>
          <CommandEmpty>No snippets found.</CommandEmpty>
          <CommandGroup heading="Markdown & Components">
            {filteredFragments.map((fragment) => {
              const Icon = fragment.icon;
              return (
                <CommandItem
                  key={fragment.id}
                  onSelect={() => {
                    onInsert(fragment.content);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent rounded-md"
                >
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{fragment.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{fragment.description}</div>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
