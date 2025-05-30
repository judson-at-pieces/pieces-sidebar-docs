
export function processCustomSyntax(content: string): string {
  // Transform callout syntax: :::info[Title] or :::warning{title="Warning"}
  content = content.replace(
    /:::(\w+)(?:\[([^\]]*)\]|\{title="([^"]*)"\})?\n([\s\S]*?):::/g,
    (match, type, title1, title2, innerContent) => {
      const title = title1 || title2 || '';
      // Convert to HTML that ReactMarkdown can process
      return `<div data-callout="${type}" data-title="${title}">\n\n${innerContent.trim()}\n\n</div>`;
    }
  );

  // Transform simple callout syntax: :::info
  content = content.replace(
    /:::(\w+)\n([\s\S]*?):::/g,
    (_, type, innerContent) => {
      return `<div data-callout="${type}">\n\n${innerContent.trim()}\n\n</div>`;
    }
  );

  // Transform CardGroup components to HTML
  content = content.replace(/<CardGroup\s+cols=\{(\d+)\}>/gi, (_, cols) => {
    return `<div data-cardgroup="true" data-cols="${cols}">`;
  });
  content = content.replace(/<CardGroup>/gi, () => {
    return '<div data-cardgroup="true" data-cols="2">';
  });
  content = content.replace(/<\/CardGroup>/gi, () => {
    return '</div>';
  });

  // Transform Card components to HTML - handle multiple attributes
  content = content.replace(/<Card\s+([^>]*)>/gi, (match, attributes) => {
    const titleMatch = attributes.match(/title="([^"]*)"/);
    const imageMatch = attributes.match(/image="([^"]*)"/);
    const hrefMatch = attributes.match(/href="([^"]*)"/);
    const externalMatch = attributes.match(/external="([^"]*)"/);
    
    const title = titleMatch ? titleMatch[1] : '';
    const image = imageMatch ? imageMatch[1] : '';
    const href = hrefMatch ? hrefMatch[1] : '';
    const external = externalMatch ? externalMatch[1] : '';
    
    return `<div data-card="true" data-title="${title}" data-image="${image}" data-href="${href}" data-external="${external}">`;
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
  content = content.replace(/<Step\s+number="(\d+)"(?:\s+title="([^"]*)")?>/gi, (_, number, title) => {
    return `<div data-step="${number}" data-step-title="${title || ''}">`;
  });
  content = content.replace(/<\/Step>/gi, () => {
    return '</div>';
  });

  // Transform ExpandableImage components to HTML
  content = content.replace(/<ExpandableImage\s+src="([^"]*)"(?:\s+alt="([^"]*)")?(?:\s+caption="([^"]*)")?\/>/gi, (_, src, alt, caption) => {
    // Ensure caption is preserved in both data-caption and alt attributes
    const safeAlt = alt || '';
    const safeCaption = caption || '';
    return `<img src="${src}" alt="${safeAlt}" data-caption="${safeCaption}" />`;
  });

  // Transform Image components to HTML - handle various attribute formats
  content = content.replace(/<Image\s+([^>]+)\/>/gi, (match, attributes) => {
    // Parse attributes
    const srcMatch = attributes.match(/src="([^"]*)"/);
    const altMatch = attributes.match(/alt="([^"]*)"/);
    const captionMatch = attributes.match(/caption="([^"]*)"/);
    const alignMatch = attributes.match(/align="([^"]*)"/);
    const fullwidthMatch = attributes.match(/fullwidth="([^"]*)"/);
    const titleMatch = attributes.match(/title="([^"]*)"/);
    
    const src = srcMatch ? srcMatch[1] : '';
    const alt = altMatch ? altMatch[1] : (titleMatch ? titleMatch[1] : '');
    const caption = captionMatch ? captionMatch[1] : (titleMatch ? titleMatch[1] : '');
    const align = alignMatch ? alignMatch[1] : 'left';
    const fullwidth = fullwidthMatch ? fullwidthMatch[1] : 'false';
    
    return `<div data-image="true" data-src="${src}" data-alt="${alt}" data-caption="${caption}" data-align="${align}" data-fullwidth="${fullwidth}"></div>`;
  });

  // Transform pieces-cloud-models component
  content = content.replace(/<pieces-cloud-models\s*\/>/gi, () => {
    return '<div data-pieces-cloud-models="true"></div>';
  });

  // Transform pieces-local-models component
  content = content.replace(/<pieces-local-models\s*\/>/gi, () => {
    return '<div data-pieces-local-models="true"></div>';
  });

  // Transform glossary-all component
  content = content.replace(/<glossary-all\s*\/>/gi, () => {
    return '<div data-glossary-all="true"></div>';
  });

  return content;
}
