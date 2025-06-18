
/**
 * Secure markdown processing utilities
 * Replaces dangerouslySetInnerHTML with safe React components
 */

export interface ProcessedMarkdown {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'image';
  content: string;
  href?: string;
  target?: string;
  src?: string;
  alt?: string;
  align?: string;
  fullwidth?: boolean;
}

// Allowlist of safe URL protocols
const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Validates URL to prevent XSS through javascript: protocols
 */
export const validateUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Handle relative URLs
    if (url.startsWith('/') || url.startsWith('#') || url.startsWith('?')) {
      return true;
    }
    
    const parsedUrl = new URL(url);
    return SAFE_PROTOCOLS.includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

/**
 * Safely processes inline markdown without using dangerouslySetInnerHTML
 */
export const processInlineMarkdown = (text: string): ProcessedMarkdown[] => {
  if (!text || typeof text !== 'string') {
    return [{ type: 'text', content: '' }];
  }

  console.log('🔄 processInlineMarkdown input:', text.substring(0, 200));

  const elements: ProcessedMarkdown[] = [];
  let processedText = text;

  // Simple regex patterns for inline markdown
  const patterns = [
    // Code blocks first (to avoid conflicts)
    {
      regex: /`([^`]+)`/g,
      type: 'code' as const,
      process: (match: string, content: string) => ({ type: 'code' as const, content: content.trim() })
    },
    // Links - both markdown and HTML
    {
      regex: /<a\s+href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gi,
      type: 'link' as const,
      process: (match: string, href: string, linkText: string) => {
        if (validateUrl(href) && linkText.trim()) {
          return { type: 'link' as const, content: linkText.trim(), href };
        }
        return { type: 'text' as const, content: match };
      }
    },
    {
      regex: /\[([^\]]*)\]\(([^)]+)\)/g,
      type: 'link' as const,
      process: (match: string, linkText: string, href: string) => {
        const cleanText = linkText.replace(/\\(.)/g, '$1'); // Unescape characters
        if (validateUrl(href) && cleanText.trim()) {
          return { type: 'link' as const, content: cleanText.trim(), href };
        }
        return { type: 'text' as const, content: match };
      }
    },
    // Bold
    {
      regex: /\*\*(.*?)\*\*/g,
      type: 'bold' as const,
      process: (match: string, content: string) => {
        if (content.trim()) {
          return { type: 'bold' as const, content: content.trim() };
        }
        return { type: 'text' as const, content: match };
      }
    },
    // Italic (but not if it's part of **)
    {
      regex: /(?<!\*)\*([^*]+)\*(?!\*)/g,
      type: 'italic' as const,
      process: (match: string, content: string) => {
        if (content.trim()) {
          return { type: 'italic' as const, content: content.trim() };
        }
        return { type: 'text' as const, content: match };
      }
    }
  ];

  // Process patterns one by one
  const foundElements: Array<{ start: number; end: number; element: ProcessedMarkdown }> = [];

  patterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    
    while ((match = regex.exec(text)) !== null) {
      const element = pattern.process(match[0], match[1], match[2]);
      if (element.type !== 'text' || element.content !== match[0]) {
        foundElements.push({
          start: match.index!,
          end: match.index! + match[0].length,
          element
        });
      }
    }
  });

  // Sort by position and resolve overlaps
  foundElements.sort((a, b) => a.start - b.start);
  
  const resolvedElements: Array<{ start: number; end: number; element: ProcessedMarkdown }> = [];
  
  for (const current of foundElements) {
    // Check if this element overlaps with any already resolved element
    const hasOverlap = resolvedElements.some(resolved => 
      (current.start < resolved.end && current.end > resolved.start)
    );
    
    if (!hasOverlap) {
      resolvedElements.push(current);
    }
  }

  // Build final elements array
  let lastIndex = 0;
  
  for (const { start, end, element } of resolvedElements) {
    // Add text before this element
    if (start > lastIndex) {
      const textContent = text.slice(lastIndex, start);
      if (textContent) {
        elements.push({ type: 'text', content: textContent });
      }
    }
    
    // Add the processed element
    elements.push(element);
    lastIndex = end;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      elements.push({ type: 'text', content: remainingText });
    }
  }

  // If no elements were processed, return the original text
  if (elements.length === 0) {
    elements.push({ type: 'text', content: text });
  }

  console.log('🔄 processInlineMarkdown: Final elements:', elements.length, elements.map(e => ({ type: e.type, content: e.content?.substring(0, 30) })));
  return elements;
};

/**
 * Sanitizes text content to prevent XSS
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 10000); // Limit length
};
