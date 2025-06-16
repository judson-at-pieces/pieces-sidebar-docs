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

    console.log('🔧 processCustomSyntax: Starting with content length:', content.length);

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
        
        return `<Callout type="${safeType}" title="${safeTitle}">\n\n${safeContent}\n\n</Callout>`;
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
        
        return `<Callout type="${safeType}">\n\n${safeContent}\n\n</Callout>`;
      }
    );

    // Transform CardGroup components to HTML with proper closing tag handling
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
    
    // Don't replace </CardGroup> - keep it as is

    // Transform Card components - preserve original JSX syntax
    processedContent = processedContent.replace(/<Card\s+([^>]*?)\/>/gi, (match, attributes) => {
      try {
        const titleMatch = attributes.match(/title="([^"]*)"/);
        const imageMatch = attributes.match(/image="([^"]*)"/);
        const hrefMatch = attributes.match(/href="([^"]*)"/);
        const externalMatch = attributes.match(/external=["']([^"']*)["']/);
        const iconMatch = attributes.match(/icon="([^"]*)"/);
        
        const title = titleMatch ? titleMatch[1] : '';
        const image = imageMatch ? imageMatch[1] : '';
        const href = hrefMatch ? hrefMatch[1] : '';
        const external = externalMatch ? externalMatch[1] : '';
        const icon = iconMatch ? iconMatch[1] : '';
        
        let cardProps = '';
        if (title) cardProps += ` title="${title}"`;
        if (image) cardProps += ` image="${image}"`;
        if (href) cardProps += ` href="${href}"`;
        if (external) cardProps += ` external="${external}"`;
        if (icon) cardProps += ` icon="${icon}"`;
        
        return `<Card${cardProps} />`;
      } catch (error) {
        console.warn('Error parsing Card attributes:', error);
        return '<Card />';
      }
    });

    // Transform Card components with content - preserve JSX
    processedContent = processedContent.replace(/<Card\s+([^>]*?)>([\s\S]*?)<\/Card>/gi, (match, attributes, innerContent) => {
      try {
        console.log('🔧 Processing Card with content:', { attributes, innerContent: innerContent.substring(0, 100) });
        
        const titleMatch = attributes.match(/title="([^"]*)"/);
        const imageMatch = attributes.match(/image="([^"]*)"/);
        const hrefMatch = attributes.match(/href="([^"]*)"/);
        const externalMatch = attributes.match(/external=["']([^"']*)["']/);
        const iconMatch = attributes.match(/icon="([^"]*)"/);
        
        const title = titleMatch ? titleMatch[1] : '';
        const image = imageMatch ? imageMatch[1] : '';
        const href = hrefMatch ? hrefMatch[1] : '';
        const external = externalMatch ? externalMatch[1] : '';
        const icon = iconMatch ? iconMatch[1] : '';
        
        let cardProps = '';
        if (title) cardProps += ` title="${title}"`;
        if (image) cardProps += ` image="${image}"`;
        if (href) cardProps += ` href="${href}"`;
        if (external) cardProps += ` external="${external}"`;
        if (icon) cardProps += ` icon="${icon}"`;
        
        // PRESERVE the inner content exactly as is
        const preservedContent = innerContent || '';
        
        console.log('🔧 Card transformation result:', { title, image, href, external, icon, contentLength: preservedContent.length });
        
        return `<Card${cardProps}>\n\n${preservedContent}\n\n</Card>`;
      } catch (error) {
        console.warn('Error parsing Card attributes:', error);
        return `<Card>\n\n${innerContent || ''}\n\n</Card>`;
      }
    });

    // Transform Steps and Step components to JSX
    processedContent = processedContent.replace(/<Steps>/gi, () => {
      return '<Steps>';
    });
    
    // Don't replace </Steps> - keep it as is
    
    processedContent = processedContent.replace(/<Step\s+([^>]*)>([\s\S]*?)<\/Step>/gi, (match, attributes, innerContent) => {
      const titleMatch = attributes.match(/title="([^"]*)"/);
      const title = titleMatch ? titleMatch[1] : '';
      const safeContent = innerContent ? innerContent.trim() : '';
      
      return `<Step title="${title}">\n\n${safeContent}\n\n</Step>`;
    });

    // Transform Image components - ENSURE they have proper opening brackets and preserve as JSX
    processedContent = processedContent.replace(
      /(?<!<)Image\s+([^>]*?)\/>/gi,
      '<Image $1/>'
    );
    
    // Transform Image components - keep as JSX
    processedContent = processedContent.replace(
      /<Image\s+([^>]*?)\/>/gi,
      (match, attributes) => {
        try {
          console.log('🔧 Processing Image component:', attributes);
          
          const srcMatch = attributes.match(/src="([^"]*)"/);
          const altMatch = attributes.match(/alt="([^"]*)"/);
          const alignMatch = attributes.match(/align="([^"]*)"/);
          const fullwidthMatch = attributes.match(/fullwidth="([^"]*)"/);
          
          const src = srcMatch ? srcMatch[1] : '';
          const alt = altMatch ? altMatch[1] : '';
          const align = alignMatch ? alignMatch[1] : 'center';
          const fullwidth = fullwidthMatch ? fullwidthMatch[1] : 'false';
          
          if (!src) {
            console.warn('Image missing src:', attributes);
            return '';
          }
          
          console.log('🔧 Image transformation result:', { src, alt, align, fullwidth });
          
          return `<Image src="${src}" alt="${alt}" align="${align}" fullwidth="${fullwidth}" />`;
        } catch (error) {
          console.warn('Error parsing Image attributes:', error);
          return match;
        }
      }
    );

    // Transform ExpandableImage components to JSX
    processedContent = processedContent.replace(
      /<ExpandableImage\s+src="([^"]*)"(?:\s+alt="([^"]*)")?(?:\s+caption="([^"]*)")?\/>/gi, 
      (match, src, alt, caption) => {
        if (!src) {
          console.warn('ExpandableImage missing src');
          return '';
        }
        
        const safeAlt = alt || '';
        const safeCaption = caption || '';
        
        return `<ExpandableImage src="${src}" alt="${safeAlt}" caption="${safeCaption}" />`;
      }
    );

    // Transform Embed components to JSX (for YouTube)
    processedContent = processedContent.replace(
      /<Embed\s+src="([^"]*)"(?:\s+title="([^"]*)")?\/>/gi,
      (match, src, title) => {
        if (!src) {
          console.warn('Embed missing src');
          return '';
        }
        
        const safeTitle = title || '';
        
        return `<Embed src="${src}" title="${safeTitle}" />`;
      }
    );

    console.log('🔧 Custom syntax processing complete. Sample output:', processedContent.substring(0, 500));
    return processedContent;
  } catch (error) {
    console.error('Error processing custom syntax:', error);
    return content; // Return original content on error
  }
}
