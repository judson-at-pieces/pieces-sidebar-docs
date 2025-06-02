
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
    // Transform Image components to HTML first (before other processing)
    content = content.replace(
      /<Image\s+([^>]*)\s*\/?>/gi,
      (match, attributes) => {
        const srcMatch = attributes.match(/src="([^"]*)"/);
        const altMatch = attributes.match(/alt="([^"]*)"/);
        const captionMatch = attributes.match(/caption="([^"]*)"/);
        const alignMatch = attributes.match(/align="([^"]*)"/);
        const fullwidthMatch = attributes.match(/fullwidth="([^"]*)"/);
        const titleMatch = attributes.match(/title="([^"]*)"/);
        
        const src = validateUrl(srcMatch ? srcMatch[1] : '');
        if (!src) {
          console.warn('Invalid or unsafe image URL:', srcMatch ? srcMatch[1] : 'no src');
          return '';
        }
        
        const alt = sanitizeAttribute(altMatch ? altMatch[1] : '');
        const caption = sanitizeAttribute(captionMatch ? captionMatch[1] : '');
        const align = sanitizeAttribute(alignMatch ? alignMatch[1] : 'left');
        const fullwidth = sanitizeAttribute(fullwidthMatch ? fullwidthMatch[1] : 'false');
        const title = sanitizeAttribute(titleMatch ? titleMatch[1] : '');
        
        return `<div data-image="true" data-src="${src}" data-alt="${alt}" data-caption="${caption}" data-align="${align}" data-fullwidth="${fullwidth}" data-title="${title}"></div>`;
      }
    );

    // Transform callout syntax: :::info[Title] or :::warning{title="Warning"}
    content = content.replace(
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
    content = content.replace(
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

    // Transform CardGroup components to HTML
    content = content.replace(/<CardGroup\s+cols=\{(\d+)\}>/gi, (match, cols) => {
      const numCols = parseInt(cols, 10);
      if (isNaN(numCols) || numCols < 1 || numCols > 6) {
        return '<div data-cardgroup="true" data-cols="2">'; // Default fallback
      }
      return `<div data-cardgroup="true" data-cols="${numCols}">`;
    });
    
    content = content.replace(/<CardGroup>/gi, () => {
      return '<div data-cardgroup="true" data-cols="2">';
    });
    
    content = content.replace(/<\/CardGroup>/gi, () => {
      return '</div>';
    });

    // Transform Card components to HTML - handle multiple attributes safely
    content = content.replace(/<Card\s+([^>]*)>/gi, (match, attributes) => {
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
        
        return `<div data-card="true" data-title="${title}" data-image="${image}" data-href="${href}" data-external="${external}" data-icon="${icon}">`;
      } catch (error) {
        console.warn('Error parsing Card attributes:', error);
        return '<div data-card="true">';
      }
    });
    
    content = content.replace(/<\/Card>/gi, () => {
      return '</div>';
    });

    // Transform Steps and Step components to HTML
    content = content.replace(/<Steps>/gi, () => {
      return '<div data-steps="true">';
    });
    
    content = content.replace(/<\/Steps>/gi, () => {
      return '</div>';
    });
    
    content = content.replace(/<Step\s+number="(\d+)"(?:\s+title="([^"]*)")?>/gi, (match, number, title) => {
      const stepNum = parseInt(number, 10);
      if (isNaN(stepNum) || stepNum < 1 || stepNum > 999) {
        return match; // Return original if invalid number
      }
      
      const safeTitle = sanitizeAttribute(title || '');
      return `<div data-step="${stepNum}" data-step-title="${safeTitle}">`;
    });
    
    content = content.replace(/<\/Step>/gi, () => {
      return '</div>';
    });

    // Transform ExpandableImage components to HTML
    content = content.replace(
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

    return content;
  } catch (error) {
    console.error('Error processing custom syntax:', error);
    return content; // Return original content on error
  }
}
