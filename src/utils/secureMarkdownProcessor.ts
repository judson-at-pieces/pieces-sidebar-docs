
/**
 * Secure markdown processing utilities
 * Replaces dangerouslySetInnerHTML with safe React components
 */

export interface ProcessedMarkdown {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link';
  content: string;
  href?: string;
  target?: string;
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

  const elements: ProcessedMarkdown[] = [];
  let currentIndex = 0;

  // Process markdown patterns safely - including raw HTML anchor tags
  const patterns = [
    { regex: /`([^`]+)`/g, type: 'code' as const },
    { regex: /\*\*(.*?)\*\*/g, type: 'bold' as const },
    { regex: /(?<!\*)\*([^*]+)\*(?!\*)/g, type: 'italic' as const },
    // Updated regex to handle escaped brackets in markdown links
    { regex: /\[([^\]]*(?:\\.[^\]]*)*)\]\(([^)]+)\)/g, type: 'link' as const },
    // Add pattern for raw HTML anchor tags
    { regex: /<a\s+([^>]*?)>([^<]+)<\/a>/g, type: 'link' as const }
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
    if (type === 'link') {
      let linkText = '';
      let linkHref = '';
      let linkTarget = '';
      
      // Check if this is a raw HTML anchor tag
      if (match[0].startsWith('<a')) {
        linkText = match[2]; // Content between <a> and </a>
        const attributes = match[1];
        
        // Extract href
        const hrefMatch = attributes.match(/href=["']([^"']+)["']/);
        linkHref = hrefMatch ? hrefMatch[1] : '';
        
        // Extract target
        const targetMatch = attributes.match(/target=["']([^"']+)["']/);
        linkTarget = targetMatch ? targetMatch[1] : '';
      } else {
        // Standard markdown link [text](url) - handle escaped brackets
        linkText = match[1].replace(/\\(.)/g, '$1'); // Unescape characters
        linkHref = match[2];
      }
      
      if (validateUrl(linkHref)) {
        elements.push({ 
          type: 'link', 
          content: linkText, 
          href: linkHref,
          target: linkTarget
        });
      } else {
        // If URL is invalid, treat as plain text
        elements.push({ type: 'text', content: match[0] });
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
