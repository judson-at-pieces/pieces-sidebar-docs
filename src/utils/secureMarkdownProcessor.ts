/**
 * Secure markdown processing utilities
 * Replaces dangerouslySetInnerHTML with safe React components
 */

export interface ProcessedMarkdown {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'image';
  content: string;
  href?: string;
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
 * Parse HTML-style attributes from a tag string
 */
const parseAttributes = (attributeString: string): Record<string, string> => {
  const attributes: Record<string, string> = {};
  const regex = /(\w+)=["']([^"']*)["']/g;
  let match;
  
  while ((match = regex.exec(attributeString)) !== null) {
    attributes[match[1]] = match[2];
  }
  
  return attributes;
};

/**
 * Safely processes inline markdown without using dangerouslySetInnerHTML
 */
export const processInlineMarkdown = (text: string): ProcessedMarkdown[] => {
  if (!text || typeof text !== 'string') {
    return [{ type: 'text', content: '' }];
  }

  const elements: ProcessedMarkdown[] = [];
  let currentIndex = 0;

  // Process markdown patterns safely - Updated patterns to match actual content format
  const patterns = [
    // Match Image tags without opening bracket: Image src="..." /
    { regex: /Image\s+([^/]*)\s*\/>/g, type: 'image' as const },
    // Match HTML anchor tags: <a target="_blank" href="...">text</a>
    { regex: /<a\s+([^>]*?)>(.*?)<\/a>/g, type: 'link' as const },
    // Keep existing patterns
    { regex: /`([^`]+)`/g, type: 'code' as const },
    { regex: /\*\*(.*?)\*\*/g, type: 'bold' as const },
    { regex: /(?<!\*)\*([^*]+)\*(?!\*)/g, type: 'italic' as const },
    { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'link' as const }
  ];

  const matches: Array<{ match: RegExpMatchArray; type: ProcessedMarkdown['type'] }> = [];

  // Find all matches
  patterns.forEach(({ regex, type }) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({ match, type });
    }
  });

  // Sort matches by position
  matches.sort((a, b) => (a.match.index || 0) - (b.match.index || 0));

  // Process text with matches
  for (const { match, type } of matches) {
    const matchStart = match.index || 0;
    const matchEnd = matchStart + match[0].length;

    // Add text before match
    if (matchStart > currentIndex) {
      const textContent = text.slice(currentIndex, matchStart);
      if (textContent) {
        elements.push({ type: 'text', content: textContent });
      }
    }

    // Add the matched element
    if (type === 'image') {
      const attributeString = match[1];
      const attributes = parseAttributes(attributeString);
      
      if (attributes.src && validateUrl(attributes.src)) {
        elements.push({ 
          type: 'image', 
          content: '', 
          src: attributes.src,
          alt: attributes.alt || '',
          align: attributes.align || 'center',
          fullwidth: attributes.fullwidth === 'true'
        });
      } else {
        // If URL is invalid, treat as plain text
        elements.push({ type: 'text', content: match[0] });
      }
    } else if (type === 'link') {
      // Handle both HTML <a> tags and markdown links
      if (match[0].startsWith('<a')) {
        // HTML anchor tag
        const attributeString = match[1];
        const linkText = match[2];
        const attributes = parseAttributes(attributeString);
        const linkHref = attributes.href;
        
        if (linkHref && validateUrl(linkHref)) {
          elements.push({ 
            type: 'link', 
            content: linkText, 
            href: linkHref 
          });
        } else {
          // If URL is invalid, treat as plain text
          elements.push({ type: 'text', content: match[0] });
        }
      } else {
        // Markdown link
        const linkText = match[1];
        const linkHref = match[2];
        
        if (validateUrl(linkHref)) {
          elements.push({ 
            type: 'link', 
            content: linkText, 
            href: linkHref 
          });
        } else {
          // If URL is invalid, treat as plain text
          elements.push({ type: 'text', content: match[0] });
        }
      }
    } else {
      elements.push({ 
        type, 
        content: match[1] 
      });
    }

    currentIndex = matchEnd;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);
    if (remainingText) {
      elements.push({ type: 'text', content: remainingText });
    }
  }

  return elements.length > 0 ? elements : [{ type: 'text', content: text }];
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
