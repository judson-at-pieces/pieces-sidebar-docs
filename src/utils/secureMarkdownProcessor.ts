
export interface ProcessedMarkdown {
  type: 'text' | 'bold' | 'italic' | 'bold-italic' | 'code' | 'link' | 'image';
  content: string;
  href?: string;
  target?: string;
  src?: string;
  alt?: string;
  align?: 'left' | 'center' | 'right';
  fullwidth?: boolean;
}

export function sanitizeText(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Basic sanitization - remove potentially dangerous content
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '');
}

export function processInlineMarkdown(content: string): ProcessedMarkdown[] {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const elements: ProcessedMarkdown[] = [];
  let currentIndex = 0;

  // Process in order of precedence: bold-italic first, then bold, then italic
  const patterns = [
    // Bold italic with ***text*** (highest precedence)
    { type: 'bold-italic' as const, pattern: /\*\*\*([^*]+)\*\*\*/g },
    // Bold text with **text**
    { type: 'bold' as const, pattern: /\*\*([^*]+)\*\*/g },
    // Italic text with *text* (but not part of ** or ***)
    { type: 'italic' as const, pattern: /(?<!\*)\*([^*\s][^*]*[^*\s]|\S)\*(?!\*)/g },
    // Inline code with `code`
    { type: 'code' as const, pattern: /`([^`]+)`/g },
    // Links with [text](url)
    { type: 'link' as const, pattern: /\[([^\]]+)\]\(([^)]+)\)/g },
    // Images with ![alt](src)
    { type: 'image' as const, pattern: /!\[([^\]]*)\]\(([^)]+)\)/g }
  ];

  while (currentIndex < content.length) {
    let nearestMatch: { index: number; length: number; element: ProcessedMarkdown } | null = null;

    // Find the nearest pattern match
    for (const { type, pattern } of patterns) {
      pattern.lastIndex = 0; // Reset regex
      const match = pattern.exec(content.slice(currentIndex));
      
      if (match && match.index !== undefined) {
        const absoluteIndex = currentIndex + match.index;
        
        if (!nearestMatch || absoluteIndex < nearestMatch.index) {
          let element: ProcessedMarkdown;
          
          switch (type) {
            case 'bold':
            case 'italic':
            case 'bold-italic':
            case 'code':
              element = {
                type,
                content: match[1]
              };
              break;
            case 'link':
              element = {
                type,
                content: match[1],
                href: match[2],
                target: match[2].startsWith('http') ? '_blank' : undefined
              };
              break;
            case 'image':
              element = {
                type,
                content: match[1],
                src: match[2],
                alt: match[1]
              };
              break;
            default:
              element = {
                type: 'text',
                content: match[0]
              };
          }
          
          nearestMatch = {
            index: absoluteIndex,
            length: match[0].length,
            element
          };
        }
      }
    }

    if (nearestMatch) {
      // Add text before the match
      if (nearestMatch.index > currentIndex) {
        const textBefore = content.slice(currentIndex, nearestMatch.index);
        if (textBefore) {
          elements.push({
            type: 'text',
            content: textBefore
          });
        }
      }

      // Add the matched element
      elements.push(nearestMatch.element);
      currentIndex = nearestMatch.index + nearestMatch.length;
    } else {
      // No more matches, add remaining text
      const remainingText = content.slice(currentIndex);
      if (remainingText) {
        elements.push({
          type: 'text',
          content: remainingText
        });
      }
      break;
    }
  }

  return elements;
}
