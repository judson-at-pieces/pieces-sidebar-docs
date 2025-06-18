
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

  // Simple sequential processing approach
  let currentText = text;
  const elements: ProcessedMarkdown[] = [];
  
  // Process the text character by character to build elements
  let i = 0;
  let currentElement = '';
  
  while (i < currentText.length) {
    // Check for bold **text**
    if (currentText.substring(i, i + 2) === '**') {
      // Add any accumulated text
      if (currentElement) {
        elements.push({ type: 'text', content: currentElement });
        currentElement = '';
      }
      
      // Find the closing **
      let endIndex = currentText.indexOf('**', i + 2);
      if (endIndex !== -1) {
        const boldContent = currentText.substring(i + 2, endIndex);
        if (boldContent.trim()) {
          elements.push({ type: 'bold', content: boldContent });
        }
        i = endIndex + 2;
        continue;
      }
    }
    
    // Check for italic *text* (but not **)
    if (currentText[i] === '*' && currentText[i + 1] !== '*' && currentText[i - 1] !== '*') {
      // Add any accumulated text
      if (currentElement) {
        elements.push({ type: 'text', content: currentElement });
        currentElement = '';
      }
      
      // Find the closing *
      let endIndex = -1;
      for (let j = i + 1; j < currentText.length; j++) {
        if (currentText[j] === '*' && currentText[j + 1] !== '*' && currentText[j - 1] !== '*') {
          endIndex = j;
          break;
        }
      }
      
      if (endIndex !== -1) {
        const italicContent = currentText.substring(i + 1, endIndex);
        if (italicContent.trim()) {
          elements.push({ type: 'italic', content: italicContent });
        }
        i = endIndex + 1;
        continue;
      }
    }
    
    // Check for code `text`
    if (currentText[i] === '`') {
      // Add any accumulated text
      if (currentElement) {
        elements.push({ type: 'text', content: currentElement });
        currentElement = '';
      }
      
      // Find the closing `
      let endIndex = currentText.indexOf('`', i + 1);
      if (endIndex !== -1) {
        const codeContent = currentText.substring(i + 1, endIndex);
        if (codeContent.trim()) {
          elements.push({ type: 'code', content: codeContent });
        }
        i = endIndex + 1;
        continue;
      }
    }
    
    // Check for markdown links [text](url)
    if (currentText[i] === '[') {
      // Add any accumulated text
      if (currentElement) {
        elements.push({ type: 'text', content: currentElement });
        currentElement = '';
      }
      
      // Find the closing ] and opening (
      let textEnd = currentText.indexOf(']', i + 1);
      if (textEnd !== -1 && currentText[textEnd + 1] === '(') {
        let urlEnd = currentText.indexOf(')', textEnd + 2);
        if (urlEnd !== -1) {
          const linkText = currentText.substring(i + 1, textEnd);
          const linkUrl = currentText.substring(textEnd + 2, urlEnd);
          
          if (linkText.trim() && validateUrl(linkUrl)) {
            elements.push({ 
              type: 'link', 
              content: linkText.trim(), 
              href: linkUrl.trim() 
            });
            i = urlEnd + 1;
            continue;
          }
        }
      }
    }
    
    // Check for HTML links <a href="url">text</a>
    if (currentText.substring(i, i + 2) === '<a') {
      // Add any accumulated text
      if (currentElement) {
        elements.push({ type: 'text', content: currentElement });
        currentElement = '';
      }
      
      // Find the href attribute and closing tag
      let tagEnd = currentText.indexOf('>', i);
      if (tagEnd !== -1) {
        let closingTag = currentText.indexOf('</a>', tagEnd);
        if (closingTag !== -1) {
          const tagContent = currentText.substring(i, tagEnd + 1);
          const hrefMatch = tagContent.match(/href\s*=\s*["']([^"']+)["']/);
          const linkText = currentText.substring(tagEnd + 1, closingTag);
          
          if (hrefMatch && linkText.trim() && validateUrl(hrefMatch[1])) {
            elements.push({ 
              type: 'link', 
              content: linkText.trim(), 
              href: hrefMatch[1] 
            });
            i = closingTag + 4; // Skip </a>
            continue;
          }
        }
      }
    }
    
    // Regular character - add to current element
    currentElement += currentText[i];
    i++;
  }
  
  // Add any remaining text
  if (currentElement) {
    elements.push({ type: 'text', content: currentElement });
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
