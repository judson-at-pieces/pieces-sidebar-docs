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
  const inputRef = useRef<any>(null); // CommandInput uses a different ref type

  // Clear search when closing
  useEffect(() => {
    if (!isOpen) {
      console.debug("CommandPalette closed: clearing search state.");
      setSearch("");
    }
  }, [isOpen]);

  // Focus management with error handling
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        // Get the parent textarea's scroll position
        const textarea = commandRef.current?.closest('.relative')?.querySelector('textarea');
        const textareaScrollTop = textarea?.scrollTop || 0;
        
        const x = window.scrollX, y = window.scrollY;
        try {
          inputRef.current.focus({ preventScroll: true });
        } catch {
          // fallback: focus, but restore scroll
          inputRef.current.focus();
          window.scrollTo(x, y);
          // Also restore textarea scroll
          if (textarea) {
            textarea.scrollTop = textareaScrollTop;
          }
        }
      }, 50);
    }
  }, [isOpen]);

  // Handle click outside with better detection
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (commandRef.current && commandRef.current.contains(target)) {
        console.debug("Click detected inside CommandPalette; skipping close.");
        return;
      }
      console.debug("Click detected outside CommandPalette; triggering onClose.");
      onClose();
    };

    const textareaContainer = commandRef.current?.parentElement;
    if (textareaContainer) {
      textareaContainer.addEventListener('click', handleClickOutside);
      return () => {
        textareaContainer.removeEventListener('click', handleClickOutside);
      };
    } else {
      console.warn("CommandPalette parent container not found; outside click detection disabled.");
    }
  }, [isOpen, onClose]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        console.debug("Escape key pressed; triggering onClose.");
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const filteredFragments = MARKDOWN_FRAGMENTS.filter(fragment => {
    const titleMatch = fragment.title.toLowerCase().includes(search.toLowerCase());
    const descMatch = fragment.description.toLowerCase().includes(search.toLowerCase());
    return titleMatch || descMatch;
  });

  // Debug logging and improved viewport clamping with error handling
  let topPosition: number = position.top;
  try {
    console.debug("Original palette position:", { top: position.top, left: position.left });

    const viewportHeight = window.innerHeight || 0;
    const paletteHeight = 320; // match your max-height

    if (viewportHeight <= 0) {
      console.warn("Viewport height is zero or undefined; skipping clamping.");
    } else {
      const spaceBelow = viewportHeight - (position.top + paletteHeight);
      if (spaceBelow < 0) {
        // If not enough space below, try to position above cursor
        const potentialTop = position.top - paletteHeight;
        if (potentialTop >= 0) {
          topPosition = potentialTop;
          console.debug("Clamped palette above due to insufficient space below:", topPosition);
        } else {
          // If even above is offscreen, clamp to top of viewport
          topPosition = 0;
          console.debug("Clamped palette to top of viewport (0).");
        }
      } else {
        console.debug("Sufficient space below; no clamping needed.");
      }
    }
  } catch (clampError) {
    console.error("Error during viewport clamping logic:", clampError);
    // On error, fall back to original position without clamping
    topPosition = position.top;
  }

  return (
    <div
      ref={commandRef}
      className="absolute z-[100] w-80 bg-background border border-border rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        top: topPosition,
        left: position.left,
        maxHeight: '320px',
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <Command className="h-full max-h-[320px]" loop>
        <CommandInput
          ref={inputRef}
          placeholder="Search markdown snippets..."
          value={search}
          onValueChange={setSearch}
          className="border-0 focus:ring-0"
        />
        <CommandList className="max-h-[264px] overflow-y-auto">
          <CommandEmpty>No snippets found.</CommandEmpty>
          <CommandGroup heading="Markdown & Components">
            {filteredFragments.map((fragment) => {
              const Icon = fragment.icon;
              return (
                <CommandItem
                  key={fragment.id}
                  value={fragment.id}
                  onSelect={() => {
                    console.debug("Fragment selected:", fragment.id);
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