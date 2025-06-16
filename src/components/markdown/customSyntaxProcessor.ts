
/**
 * Custom syntax processor for markdown content
 * Handles special syntax elements before they reach the main markdown renderer
 */

export const processCustomSyntax = (content: string): string => {
  console.log('🔧 processCustomSyntax: Processing content with length:', content.length);
  
  if (!content || typeof content !== 'string') {
    return '';
  }

  let processed = content;

  // Process Image tags - ensure they maintain proper format
  // Handle both <Image ...> and Image ... formats
  processed = processed.replace(
    /(?:<)?Image\s+([^>\/]*)\s*\/?(?:>)?/g, 
    (match, attributes) => {
      console.log('🖼️ Found Image tag:', match);
      // Ensure it has proper angle brackets
      return `<Image ${attributes} />`;
    }
  );

  // Process other custom elements similarly
  processed = processed.replace(
    /(?:<)?CardGroup\s+([^>]*?)>([\s\S]*?)(?:<\/)?CardGroup(?:>)?/g,
    '<CardGroup $1>$2</CardGroup>'
  );

  processed = processed.replace(
    /(?:<)?Steps(?:\s+[^>]*)?>?([\s\S]*?)(?:<\/)?Steps(?:>)?/g,
    '<Steps>$1</Steps>'
  );

  processed = processed.replace(
    /(?:<)?Callout\s+([^>]*?)>([\s\S]*?)(?:<\/)?Callout(?:>)?/g,
    '<Callout $1>$2</Callout>'
  );

  console.log('🔧 processCustomSyntax: Completed processing');
  return processed;
};
