
import { useState, useEffect, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FileText, Hash, List, Quote, Table, Code, Image, AlertCircle, CheckCircle, Info, XCircle, LayoutGrid, ArrowRight } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
  position: { top: number; left: number };
}

const TSX_FRAGMENTS = [
  {
    id: 'heading',
    title: 'Heading',
    description: 'Add a heading element',
    icon: Hash,
    content: '<h2 className="text-2xl font-bold mb-4">Your Heading Here</h2>\n\n'
  },
  {
    id: 'paragraph',
    title: 'Paragraph',
    description: 'Add a paragraph element',
    icon: FileText,
    content: '<p className="mb-4">Your paragraph text here.</p>\n\n'
  },
  {
    id: 'list',
    title: 'Bullet List',
    description: 'Add a bullet list',
    icon: List,
    content: '<ul className="list-disc list-inside mb-4">\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>\n\n'
  },
  {
    id: 'ordered-list',
    title: 'Numbered List',
    description: 'Add a numbered list',
    icon: List,
    content: '<ol className="list-decimal list-inside mb-4">\n  <li>First item</li>\n  <li>Second item</li>\n  <li>Third item</li>\n</ol>\n\n'
  },
  {
    id: 'code-block',
    title: 'Code Block',
    description: 'Add a code block',
    icon: Code,
    content: '<pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">\n  <code className="text-sm">\n    {`// Your code here\nconsole.log("Hello World");`}\n  </code>\n</pre>\n\n'
  },
  {
    id: 'callout-info',
    title: 'Info Callout',
    description: 'Add an info callout',
    icon: Info,
    content: '<Callout type="info" className="mb-4">\n  This is an information callout. Use it to provide helpful context.\n</Callout>\n\n'
  },
  {
    id: 'callout-warning',
    title: 'Warning Callout',
    description: 'Add a warning callout',
    icon: AlertCircle,
    content: '<Callout type="warning" className="mb-4">\n  This is a warning callout. Use it to highlight important notices.\n</Callout>\n\n'
  },
  {
    id: 'callout-success',
    title: 'Success Callout',
    description: 'Add a success callout',
    icon: CheckCircle,
    content: '<Callout type="success" className="mb-4">\n  This is a success callout. Use it to highlight positive outcomes.\n</Callout>\n\n'
  },
  {
    id: 'callout-error',
    title: 'Error Callout',
    description: 'Add an error callout',
    icon: XCircle,
    content: '<Callout type="error" className="mb-4">\n  This is an error callout. Use it to highlight problems or issues.\n</Callout>\n\n'
  },
  {
    id: 'card',
    title: 'Card',
    description: 'Add a single card',
    icon: FileText,
    content: '<Card \n  title="Card Title"\n  description="Card description goes here"\n  href="/link-to-page"\n  className="mb-4"\n>\n  Additional card content\n</Card>\n\n'
  },
  {
    id: 'card-group',
    title: 'Card Group',
    description: 'Add a group of cards',
    icon: LayoutGrid,
    content: '<CardGroup className="mb-6">\n  <Card \n    title="First Card"\n    description="Description for the first card"\n    href="/first-link"\n  />\n  <Card \n    title="Second Card"\n    description="Description for the second card"\n    href="/second-link"\n  />\n  <Card \n    title="Third Card"\n    description="Description for the third card"\n    href="/third-link"\n  />\n</CardGroup>\n\n'
  },
  {
    id: 'steps',
    title: 'Steps',
    description: 'Add a steps component',
    icon: ArrowRight,
    content: '<Steps className="mb-6">\n  <Step title="Step 1">\n    Description for the first step.\n  </Step>\n  <Step title="Step 2">\n    Description for the second step.\n  </Step>\n  <Step title="Step 3">\n    Description for the third step.\n  </Step>\n</Steps>\n\n'
  },
  {
    id: 'table',
    title: 'Table',
    description: 'Add a table',
    icon: Table,
    content: '<div className="overflow-x-auto mb-4">\n  <table className="min-w-full border-collapse border border-gray-300">\n    <thead>\n      <tr className="bg-gray-50 dark:bg-gray-800">\n        <th className="border border-gray-300 px-4 py-2 text-left">Column 1</th>\n        <th className="border border-gray-300 px-4 py-2 text-left">Column 2</th>\n        <th className="border border-gray-300 px-4 py-2 text-left">Column 3</th>\n      </tr>\n    </thead>\n    <tbody>\n      <tr>\n        <td className="border border-gray-300 px-4 py-2">Cell 1</td>\n        <td className="border border-gray-300 px-4 py-2">Cell 2</td>\n        <td className="border border-gray-300 px-4 py-2">Cell 3</td>\n      </tr>\n      <tr>\n        <td className="border border-gray-300 px-4 py-2">Cell 4</td>\n        <td className="border border-gray-300 px-4 py-2">Cell 5</td>\n        <td className="border border-gray-300 px-4 py-2">Cell 6</td>\n      </tr>\n    </tbody>\n  </table>\n</div>\n\n'
  },
  {
    id: 'image',
    title: 'Image',
    description: 'Add an expandable image',
    icon: Image,
    content: '<ExpandableImage \n  src="/placeholder.svg"\n  alt="Description of the image"\n  className="mb-4"\n/>\n\n'
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

  const filteredFragments = TSX_FRAGMENTS.filter(fragment =>
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
          placeholder="Search TSX fragments..."
          value={search}
          onValueChange={setSearch}
          className="border-0"
        />
        <CommandList className="max-h-60">
          <CommandEmpty>No fragments found.</CommandEmpty>
          <CommandGroup heading="TSX Components">
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
