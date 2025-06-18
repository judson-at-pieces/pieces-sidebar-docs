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

    // Transform raw HTML anchor tags FIRST before other processing
    processedContent = processedContent.replace(
      /<a\s+([^>]*?)>(.*?)<\/a>/gi,
      (match, attributes, linkText) => {
        try {
          console.log('Processing raw HTML anchor:', { match, attributes, linkText });
          
          // Extract href
          const hrefMatch = attributes.match(/href\s*=\s*["']([^"']+)["']/i);
          const href = hrefMatch ? hrefMatch[1] : '';
          
          // Extract target
          const targetMatch = attributes.match(/target\s*=\s*["']([^"']+)["']/i);
          const target = targetMatch ? targetMatch[1] : '';
          
          // Validate URL
          const safeHref = validateUrl(href);
          if (!safeHref) {
            console.warn('Invalid URL in anchor tag:', href);
            return linkText; // Return just the text if URL is invalid
          }
          
          // Convert to markdown link format that will be processed correctly
          const targetAttr = target === '_blank' ? ' target="_blank" rel="noopener noreferrer"' : '';
          return `<a href="${safeHref}"${targetAttr}>${linkText}</a>`;
        } catch (error) {
          console.warn('Error processing anchor tag:', error);
          return match; // Return original if parsing fails
        }
      }
    );

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

    // Transform CardGroup components - KEEP AS JSX for proper processing
    processedContent = processedContent.replace(/<CardGroup\s+cols=\{(\d+)\}>/gi, (match, cols) => {
      const numCols = parseInt(cols, 10);
      if (isNaN(numCols) || numCols < 1 || numCols > 6) {
        return '<CardGroup cols={2}>'; // Default fallback
      }
      return `<CardGroup cols={${numCols}}>`;
    });
    
    processedContent = processedContent.replace(/<CardGroup>/gi, () => {
      return '<CardGroup cols={2}>';
    });
    
    processedContent = processedContent.replace(/<\/CardGroup>/gi, () => {
      return '</CardGroup>';
    });

    // Transform Card components with content - PRESERVE AS JSX with BETTER href handling
    processedContent = processedContent.replace(/<Card\s+([^>]*?)>([\s\S]*?)<\/Card>/gi, (match, attributes, innerContent) => {
      try {
        console.log('🃏 Processing Card with content:', { attributes, innerContent: innerContent.substring(0, 100) });
        
        // Extract all attributes properly including href
        const titleMatch = attributes.match(/title\s*=\s*"([^"]*)"/);
        const imageMatch = attributes.match(/image\s*=\s*"([^"]*)"/);
        const hrefMatch = attributes.match(/href\s*=\s*"([^"]*)"/);
        const externalMatch = attributes.match(/external\s*=\s*"([^"]*)"/);
        
        const title = titleMatch ? titleMatch[1] : '';
        const image = imageMatch ? imageMatch[1] : '';
        const href = hrefMatch ? hrefMatch[1] : '';
        const external = externalMatch ? externalMatch[1] : '';
        
        // Don't validate href too strictly - just check it exists
        console.log('🃏 Parsed Card attributes:', { title, image, href, external });
        
        // PRESERVE the inner content exactly as is
        const preservedContent = innerContent || '';
        
        // Keep as Card component (will be mapped to MarkdownCard)
        if (href) {
          return `<Card title="${title}" image="${image}" href="${href}">\n${preservedContent}\n</Card>`;
        } else {
          return `<Card title="${title}" image="${image}">\n${preservedContent}\n</Card>`;
        }
      } catch (error) {
        console.warn('Error parsing Card attributes:', error);
        return `<Card>\n${innerContent || ''}\n</Card>`;
      }
    });

    // Transform self-closing Card components - PRESERVE AS JSX with BETTER href handling
    processedContent = processedContent.replace(/<Card\s+([^>]*?)\/>/gi, (match, attributes) => {
      try {
        console.log('🃏 Processing self-closing Card:', { attributes });
        
        // Extract all attributes properly including href
        const titleMatch = attributes.match(/title\s*=\s*"([^"]*)"/);
        const imageMatch = attributes.match(/image\s*=\s*"([^"]*)"/);
        const hrefMatch = attributes.match(/href\s*=\s*"([^"]*)"/);
        const externalMatch = attributes.match(/external\s*=\s*"([^"]*)"/);
        
        const title = titleMatch ? titleMatch[1] : '';
        const image = imageMatch ? imageMatch[1] : '';
        const href = hrefMatch ? hrefMatch[1] : '';
        const external = externalMatch ? externalMatch[1] : '';
        
        console.log('🃏 Parsed self-closing Card attributes:', { title, image, href, external });
        
        // Keep as Card component (will be mapped to MarkdownCard)
        if (href) {
          return `<Card title="${title}" image="${image}" href="${href}" />`;
        } else {
          return `<Card title="${title}" image="${image}" />`;
        }
      } catch (error) {
        console.warn('Error parsing Card attributes:', error);
        return '<Card />';
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

    console.log('🔧 Custom syntax processing complete. Card transformations preserved as JSX with href.');
    return processedContent;
  } catch (error) {
    console.error('Error processing custom syntax:', error);
    return content; // Return original content on error
  }
}
