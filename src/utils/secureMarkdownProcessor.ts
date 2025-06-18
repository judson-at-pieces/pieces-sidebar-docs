
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
  let currentIndex = 0;

  // Enhanced regex patterns for better matching
  const patterns = [
    { regex: /`([^`]+)`/g, type: 'code' as const },
    { regex: /\*\*(.*?)\*\*/g, type: 'bold' as const },
    { regex: /(?<!\*)\*([^*]+)\*(?!\*)/g, type: 'italic' as const },
    // More comprehensive regex for HTML anchor tags
    { regex: /<a\s+([^>]*?)>(.*?)<\/a>/gi, type: 'link' as const },
    // Standard markdown links with better handling
    { regex: /\[([^\]]*(?:\\.[^\]]*)*)\]\(([^)]+)\)/g, type: 'link' as const },
    // Image tags
    { regex: /<Image\s+([^>]*?)\/>/g, type: 'image' as const }
  ];

  const matches: Array<{ match: RegExpMatchArray; type: ProcessedMarkdown['type'] }> = [];

  // Find all matches
  patterns.forEach(({ regex, type }) => {
    let match;
    // Reset regex lastIndex to ensure we find all matches
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      matches.push({ match, type });
    }
  });

  // Sort matches by position
  matches.sort((a, b) => (a.match.index || 0) - (b.match.index || 0));

  console.log('🔄 processInlineMarkdown: Found matches:', matches.length, matches.map(m => ({ type: m.type, text: m.match[0].substring(0, 50) })));

  // Process text with matches
  for (const { match, type } of matches) {
    const matchStart = match.index || 0;
    const matchEnd = matchStart + match[0].length;

    // Skip overlapping matches
    if (matchStart < currentIndex) {
      continue;
    }

    // Add text before match
    if (matchStart > currentIndex) {
      const textContent = text.slice(currentIndex, matchStart);
      if (textContent) {
        elements.push({ type: 'text', content: textContent });
      }
    }

    // Add the matched element
    if (type === 'image') {
      const attributes = match[1];
      
      // Extract image attributes
      const srcMatch = attributes.match(/src=["']([^"']+)["']/);
      const altMatch = attributes.match(/alt=["']([^"']*)["']/);
      const alignMatch = attributes.match(/align=["']([^"']*)["']/);
      const fullwidthMatch = attributes.match(/fullwidth=["']([^"']*)["']/);
      
      const imageSrc = srcMatch ? srcMatch[1] : '';
      const imageAlt = altMatch ? altMatch[1] : '';
      const imageAlign = alignMatch ? alignMatch[1] : 'center';
      const imageFullwidth = fullwidthMatch ? fullwidthMatch[1] === 'true' : false;
      
      if (validateUrl(imageSrc)) {
        elements.push({ 
          type: 'image', 
          content: imageAlt,
          src: imageSrc,
          alt: imageAlt,
          align: imageAlign,
          fullwidth: imageFullwidth
        });
      } else {
        // If URL is invalid, treat as plain text
        elements.push({ type: 'text', content: match[0] });
      }
    } else if (type === 'link') {
      let linkText = '';
      let linkHref = '';
      let linkTarget = '';
      
      if (match[0].toLowerCase().includes('<a')) {
        // HTML anchor tag
        linkText = match[2] || ''; // Content between <a> and </a>
        const attributes = match[1] || '';
        
        console.log('🔗 Processing HTML anchor:', { fullMatch: match[0], attributes, linkText });
        
        // Extract href with flexible matching
        const hrefMatch = attributes.match(/href\s*=\s*["']([^"']+)["']/i);
        linkHref = hrefMatch ? hrefMatch[1] : '';
        
        // Extract target
        const targetMatch = attributes.match(/target\s*=\s*["']([^"']+)["']/i);
        linkTarget = targetMatch ? targetMatch[1] : '';
        
        console.log('🔗 Extracted HTML link data:', { linkText, linkHref, linkTarget });
      } else {
        // Standard markdown link [text](url)
        linkText = (match[1] || '').replace(/\\(.)/g, '$1'); // Unescape characters
        linkHref = match[2] || '';
        
        console.log('🔗 Processing markdown link:', { linkText, linkHref });
      }
      
      if (validateUrl(linkHref) && linkText.trim()) {
        elements.push({ 
          type: 'link', 
          content: linkText.trim(), 
          href: linkHref,
          target: linkTarget
        });
        console.log('🔗 Added link element:', { linkText: linkText.trim(), linkHref, linkTarget });
      } else {
        // If URL is invalid or no text, treat as plain text
        console.log('🔗 Invalid link, treating as text:', { linkHref, linkText, isValidUrl: validateUrl(linkHref) });
        elements.push({ type: 'text', content: match[0] });
      }
    } else {
      // Bold, italic, code
      const content = match[1] || '';
      if (content.trim()) {
        elements.push({ 
          type, 
          content: content.trim()
        });
      }
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

  console.log('🔄 processInlineMarkdown: Final elements:', elements.length, elements.map(e => ({ type: e.type, content: e.content?.substring(0, 30) })));
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
