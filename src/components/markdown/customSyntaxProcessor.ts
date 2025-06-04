
// Client-side processor for custom markdown syntax

// Security utilities for safe HTML attribute handling
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeAttribute(value?: string): string {
  if (!value || typeof value !== 'string') return '';
  // Remove any potential XSS vectors and limit length
  return escapeHtml(value.slice(0, 500).replace(/[<>"'&]/g, ''));
}

function validateUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  
  try {
    // Allow relative URLs and common protocols
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return url;
    }
    
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    
    if (allowedProtocols.includes(parsed.protocol)) {
      return url;
    }
  } catch {
    // Invalid URL, return empty
  }
  
  return '';
}

export function processCustomSyntax(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  try {
    let processedContent = content;

    // Transform callout syntax: :::info[Title] or :::warning{title="Warning"}
    processedContent = processedContent.replace(
      /:::(\w+)(?:\[([^\]]*)\]|\{title="([^"]*)"\})?\n([\s\S]*?):::/g,
      (match, type, title1, title2, innerContent) => {
        const safeType = sanitizeAttribute(type);
        const safeTitle = sanitizeAttribute(title1 || title2 || '');
        const safeContent = innerContent ? innerContent.trim() : '';
        
        // Validate callout type
        const allowedTypes = ['info', 'warning', 'error', 'success', 'tip', 'alert'];
        if (!allowedTypes.includes(safeType)) {
          return match; // Return original if invalid type
        }
        
        return `<div data-callout="${safeType}" data-title="${safeTitle}">\n\n${safeContent}\n\n</div>`;
      }
    );

    // Transform simple callout syntax: :::info
    processedContent = processedContent.replace(
      /:::(\w+)\n([\s\S]*?):::/g,
      (match, type, innerContent) => {
        const safeType = sanitizeAttribute(type);
        const safeContent = innerContent ? innerContent.trim() : '';
        
        // Validate callout type
        const allowedTypes = ['info', 'warning', 'error', 'success', 'tip', 'alert'];
        if (!allowedTypes.includes(safeType)) {
          return match; // Return original if invalid type
        }
        
        return `<div data-callout="${safeType}">\n\n${safeContent}\n\n</div>`;
      }
    );

    // Transform CardGroup components to HTML with proper closing tag handling
    processedContent = processedContent.replace(/<CardGroup\s+cols=\{(\d+)\}>/gi, (match, cols) => {
      const numCols = parseInt(cols, 10);
      if (isNaN(numCols) || numCols < 1 || numCols > 6) {
        return '<div data-cardgroup="true" data-cols="2">'; // Default fallback
      }
      return `<div data-cardgroup="true" data-cols="${numCols}">`;
    });
    
    processedContent = processedContent.replace(/<CardGroup>/gi, () => {
      return '<div data-cardgroup="true" data-cols="2">';
    });
    
    processedContent = processedContent.replace(/<\/CardGroup>/gi, () => {
      return '</div>';
    });

    // Transform Card components - Use direct HTML instead of special syntax
    // First handle self-closing cards
    processedContent = processedContent.replace(/<Card\s+([^>]*?)\/>/gi, (match, attributes) => {
      try {
        const titleMatch = attributes.match(/title="([^"]*)"/);
        const imageMatch = attributes.match(/image="([^"]*)"/);
        const hrefMatch = attributes.match(/href="([^"]*)"/);
        const externalMatch = attributes.match(/external=["']([^"']*)["']/);
        const iconMatch = attributes.match(/icon="([^"]*)"/);
        
        const title = sanitizeAttribute(titleMatch ? titleMatch[1] : '');
        const image = validateUrl(imageMatch ? imageMatch[1] : '');
        const href = validateUrl(hrefMatch ? hrefMatch[1] : '');
        const external = sanitizeAttribute(externalMatch ? externalMatch[1] : '');
        const icon = sanitizeAttribute(iconMatch ? iconMatch[1] : '');
        
        return `<div data-card="true" data-title="${title}" data-image="${image}" data-href="${href}" data-external="${external}" data-icon="${icon}"></div>`;
      } catch (error) {
        console.warn('Error parsing Card attributes:', error);
        return '<div data-card="true"></div>';
      }
    });

    // Then handle Card components with content - Use direct HTML
    processedContent = processedContent.replace(/<Card\s+([^>]*?)>([\s\S]*?)<\/Card>/gi, (match, attributes, innerContent) => {
      try {
        console.log('Processing Card with content:', { attributes, innerContent: innerContent.substring(0, 100) });
        
        const titleMatch = attributes.match(/title="([^"]*)"/);
        const imageMatch = attributes.match(/image="([^"]*)"/);
        const hrefMatch = attributes.match(/href="([^"]*)"/);
        const externalMatch = attributes.match(/external=["']([^"']*)["']/);
        const iconMatch = attributes.match(/icon="([^"]*)"/);
        
        const title = sanitizeAttribute(titleMatch ? titleMatch[1] : '');
        const image = validateUrl(imageMatch ? imageMatch[1] : '');
        const href = validateUrl(hrefMatch ? hrefMatch[1] : '');
        const external = sanitizeAttribute(externalMatch ? externalMatch[1] : '');
        const icon = sanitizeAttribute(iconMatch ? iconMatch[1] : '');
        
        // PRESERVE the inner content exactly as is - this is crucial for markdown processing
        const preservedContent = innerContent || '';
        
        console.log('Card transformation result:', { title, image, href, external, icon, contentLength: preservedContent.length });
        
        // Use direct HTML that will be processed by ReactMarkdown
        return `<div data-card="true" data-title="${title}" data-image="${image}" data-href="${href}" data-external="${external}" data-icon="${icon}">\n\n${preservedContent}\n\n</div>`;
      } catch (error) {
        console.warn('Error parsing Card attributes:', error);
        return `<div data-card="true">\n\n${innerContent || ''}\n\n</div>`;
      }
    });

    // Transform Steps and Step components to HTML
    processedContent = processedContent.replace(/<Steps>/gi, () => {
      return '<div data-steps="true">';
    });
    
    processedContent = processedContent.replace(/<\/Steps>/gi, () => {
      return '</div>';
    });
    
    processedContent = processedContent.replace(/<Step\s+([^>]*)>([\s\S]*?)<\/Step>/gi, (match, attributes, innerContent) => {
      const numberMatch = attributes.match(/number="(\d+)"/);
      const titleMatch = attributes.match(/title="([^"]*)"/);
      
      const stepNum = parseInt(numberMatch ? numberMatch[1] : '1', 10);
      if (isNaN(stepNum) || stepNum < 1 || stepNum > 999) {
        return match; // Return original if invalid number
      }
      
      const safeTitle = sanitizeAttribute(titleMatch ? titleMatch[1] : '');
      const safeContent = innerContent ? innerContent.trim() : '';
      
      return `<div data-step="${stepNum}" data-step-title="${safeTitle}">\n\n${safeContent}\n\n</div>`;
    });

    // Transform ExpandableImage components to HTML
    processedContent = processedContent.replace(
      /<ExpandableImage\s+src="([^"]*)"(?:\s+alt="([^"]*)")?(?:\s+caption="([^"]*)")?\/>/gi, 
      (match, src, alt, caption) => {
        const safeSrc = validateUrl(src);
        if (!safeSrc) {
          console.warn('Invalid or unsafe image URL:', src);
          return ''; // Remove invalid images
        }
        
        const safeAlt = sanitizeAttribute(alt || '');
        const safeCaption = sanitizeAttribute(caption || '');
        
        return `<img src="${safeSrc}" alt="${safeAlt}" data-caption="${safeCaption}" />`;
      }
    );

    console.log('Custom syntax processing complete. Sample output:', processedContent.substring(0, 500));
    return processedContent;
  } catch (error) {
    console.error('Error processing custom syntax:', error);
    return content; // Return original content on error
  }
}
