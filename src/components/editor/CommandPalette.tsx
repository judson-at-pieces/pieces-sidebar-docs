
import { useState, useEffect, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FileText, Hash, List, Quote, Table, Code, Image, AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
  position: { top: number; left: number };
}

const CONTENT_FRAGMENTS = [
  {
    id: 'heading',
    title: 'Heading',
    description: 'Add a heading',
    icon: Hash,
    content: '## Your Heading Here\n\n'
  },
  {
    id: 'paragraph',
    title: 'Paragraph',
    description: 'Add a paragraph',
    icon: FileText,
    content: 'Your paragraph text here.\n\n'
  },
  {
    id: 'list',
    title: 'Bullet List',
    description: 'Add a bullet list',
    icon: List,
    content: '- Item 1\n- Item 2\n- Item 3\n\n'
  },
  {
    id: 'ordered-list',
    title: 'Numbered List',
    description: 'Add a numbered list',
    icon: List,
    content: '1. First item\n2. Second item\n3. Third item\n\n'
  },
  {
    id: 'code-block',
    title: 'Code Block',
    description: 'Add a code block',
    icon: Code,
    content: '```javascript\n// Your code here\nconsole.log("Hello World");\n```\n\n'
  },
  {
    id: 'quote',
    title: 'Quote',
    description: 'Add a blockquote',
    icon: Quote,
    content: '> This is a blockquote. You can use it to highlight important information.\n\n'
  },
  {
    id: 'table',
    title: 'Table',
    description: 'Add a table',
    icon: Table,
    content: '| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n\n'
  },
  {
    id: 'image',
    title: 'Image',
    description: 'Add an image',
    icon: Image,
    content: '![Alt text](image-url-here)\n\n'
  },
  {
    id: 'callout-info',
    title: 'Info Callout',
    description: 'Add an info callout',
    icon: Info,
    content: ':::info\nThis is an information callout. Use it to provide helpful context.\n:::\n\n'
  },
  {
    id: 'callout-warning',
    title: 'Warning Callout',
    description: 'Add a warning callout',
    icon: AlertCircle,
    content: ':::warning\nThis is a warning callout. Use it to highlight important notices.\n:::\n\n'
  },
  {
    id: 'callout-success',
    title: 'Success Callout',
    description: 'Add a success callout',
    icon: CheckCircle,
    content: ':::success\nThis is a success callout. Use it to highlight positive outcomes.\n:::\n\n'
  },
  {
    id: 'callout-error',
    title: 'Error Callout',
    description: 'Add an error callout',
    icon: XCircle,
    content: ':::error\nThis is an error callout. Use it to highlight problems or issues.\n:::\n\n'
  }
];

export function CommandPalette({ isOpen, onClose, onInsert, position }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const commandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && commandRef.current) {
      commandRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredFragments = CONTENT_FRAGMENTS.filter(fragment =>
    fragment.title.toLowerCase().includes(search.toLowerCase()) ||
    fragment.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      ref={commandRef}
      className="fixed z-50 w-80 bg-background border border-border rounded-lg shadow-lg"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <Command className="h-auto">
        <CommandInput
          placeholder="Search fragments..."
          value={search}
          onValueChange={setSearch}
          className="border-0"
        />
        <CommandList className="max-h-60">
          <CommandEmpty>No fragments found.</CommandEmpty>
          <CommandGroup heading="Content Fragments">
            {filteredFragments.map((fragment) => {
              const Icon = fragment.icon;
              return (
                <CommandItem
                  key={fragment.id}
                  onSelect={() => {
                    onInsert(fragment.content);
                    onClose();
                  }}
                  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{fragment.title}</div>
                    <div className="text-xs text-muted-foreground">{fragment.description}</div>
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
