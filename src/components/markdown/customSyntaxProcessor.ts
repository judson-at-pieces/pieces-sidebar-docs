
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

    // Fix malformed image tags like <Image or <img without closing >
    processedContent = processedContent.replace(
      /<(Image|img)\s+([^>]*?)(?:\s*\/?>|$)/gi,
      (match, tag, attributes) => {
        // Ensure the tag is properly closed
        if (!match.endsWith('>')) {
          return `<${tag} ${attributes} />`;
        }
        if (!match.endsWith('/>') && !match.endsWith('/ >')) {
          return match.replace(/\s*>$/, ' />');
        }
        return match;
      }
    );

    // Transform YouTube/video embeds
    processedContent = processedContent.replace(
      /<Embed\s+src="([^"]*)"(?:\s+title="([^"]*)")?(?:\s+[^>]*)?\s*\/?>/gi,
      (match, src, title) => {
        const safeSrc = validateUrl(src);
        if (!safeSrc) {
          console.warn('Invalid or unsafe embed URL:', src);
          return ''; // Remove invalid embeds
        }
        
        const safeTitle = sanitizeAttribute(title || '');
        
        // Check if it's a YouTube URL
        const youtubeMatch = safeSrc.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (youtubeMatch) {
          const videoId = youtubeMatch[1];
          return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="${safeTitle}" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>`;
        }
        
        return `<iframe src="${safeSrc}" title="${safeTitle}" width="100%" height="400" frameBorder="0"></iframe>`;
      }
    );

    // Handle YouTube URLs in markdown link format
    processedContent = processedContent.replace(
      /\[([^\]]*)\]\((https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)[^\)]*)\)/g,
      (match, title, url, videoId) => {
        const safeTitle = sanitizeAttribute(title || 'YouTube Video');
        return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="${safeTitle}" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>`;
      }
    );

    console.log('Custom syntax processing complete. Sample output:', processedContent.substring(0, 500));
    return processedContent;
  } catch (error) {
    console.error('Error processing custom syntax:', error);
    return content; // Return original content on error
  }
}
