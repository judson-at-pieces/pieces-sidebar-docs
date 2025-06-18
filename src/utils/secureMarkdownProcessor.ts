
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

  // Process in order of precedence to avoid conflicts
  // 1. Code blocks first (highest precedence)
  // 2. Links (including complex markdown links)
  // 3. Bold and italic
  // 4. Images

  // Step 1: Extract and replace code blocks
  const codeBlocks: { placeholder: string; content: string }[] = [];
  let codeIndex = 0;
  
  processedText = processedText.replace(/`([^`]+)`/g, (match, content) => {
    const placeholder = `__CODE_BLOCK_${codeIndex}__`;
    codeBlocks.push({ placeholder, content: content.trim() });
    codeIndex++;
    return placeholder;
  });

  // Step 2: Extract and replace links (both markdown and HTML)
  const links: { placeholder: string; text: string; href: string; target?: string }[] = [];
  let linkIndex = 0;

  // Handle HTML anchor tags first
  processedText = processedText.replace(/<a\s+([^>]*?)>(.*?)<\/a>/gi, (match, attributes, linkText) => {
    const placeholder = `__LINK_${linkIndex}__`;
    
    // Extract href
    const hrefMatch = attributes.match(/href\s*=\s*["']([^"']+)["']/i);
    const href = hrefMatch ? hrefMatch[1] : '';
    
    // Extract target
    const targetMatch = attributes.match(/target\s*=\s*["']([^"']+)["']/i);
    const target = targetMatch ? targetMatch[1] : '';
    
    if (validateUrl(href) && linkText.trim()) {
      links.push({ placeholder, text: linkText.trim(), href, target });
      linkIndex++;
      return placeholder;
    }
    
    return match; // Return original if invalid
  });

  // Handle markdown links
  processedText = processedText.replace(/\[([^\]]*(?:\\.[^\]]*)*)\]\(([^)]+)\)/g, (match, linkText, href) => {
    const placeholder = `__LINK_${linkIndex}__`;
    const cleanText = linkText.replace(/\\(.)/g, '$1'); // Unescape characters
    
    if (validateUrl(href) && cleanText.trim()) {
      links.push({ placeholder, text: cleanText.trim(), href });
      linkIndex++;
      return placeholder;
    }
    
    return match; // Return original if invalid
  });

  // Step 3: Extract and replace images
  const images: { placeholder: string; src: string; alt: string; align: string; fullwidth: boolean }[] = [];
  let imageIndex = 0;
  
  processedText = processedText.replace(/<Image\s+([^>]*?)\/>/g, (match, attributes) => {
    const placeholder = `__IMAGE_${imageIndex}__`;
    
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
      images.push({ placeholder, src: imageSrc, alt: imageAlt, align: imageAlign, fullwidth: imageFullwidth });
      imageIndex++;
      return placeholder;
    }
    
    return match; // Return original if invalid
  });

  // Step 4: Process bold and italic (order matters - bold first to avoid conflicts)
  const textStyles: { placeholder: string; type: 'bold' | 'italic'; content: string }[] = [];
  let styleIndex = 0;

  // Bold (**text**)
  processedText = processedText.replace(/\*\*(.*?)\*\*/g, (match, content) => {
    if (content.trim()) {
      const placeholder = `__BOLD_${styleIndex}__`;
      textStyles.push({ placeholder, type: 'bold', content: content.trim() });
      styleIndex++;
      return placeholder;
    }
    return match;
  });

  // Italic (*text*) - but not if it's part of **
  processedText = processedText.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (match, content) => {
    if (content.trim()) {
      const placeholder = `__ITALIC_${styleIndex}__`;
      textStyles.push({ placeholder, type: 'italic', content: content.trim() });
      styleIndex++;
      return placeholder;
    }
    return match;
  });

  // Step 5: Split the processed text and rebuild with elements
  const tokens = processedText.split(/(__(?:CODE_BLOCK|LINK|IMAGE|BOLD|ITALIC)_\d+__)/);
  
  for (const token of tokens) {
    if (!token) continue;

    // Check for placeholders and replace with appropriate elements
    const codeBlock = codeBlocks.find(cb => cb.placeholder === token);
    if (codeBlock) {
      elements.push({ type: 'code', content: codeBlock.content });
      continue;
    }

    const link = links.find(l => l.placeholder === token);
    if (link) {
      elements.push({ 
        type: 'link', 
        content: link.text, 
        href: link.href,
        target: link.target
      });
      continue;
    }

    const image = images.find(img => img.placeholder === token);
    if (image) {
      elements.push({ 
        type: 'image', 
        content: image.alt,
        src: image.src,
        alt: image.alt,
        align: image.align,
        fullwidth: image.fullwidth
      });
      continue;
    }

    const style = textStyles.find(s => s.placeholder === token);
    if (style) {
      elements.push({ type: style.type, content: style.content });
      continue;
    }

    // Regular text
    if (token.trim()) {
      elements.push({ type: 'text', content: token });
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
