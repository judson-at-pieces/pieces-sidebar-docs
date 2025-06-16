
import { supabase } from '@/integrations/supabase/client';

interface ContentPage {
  slug: string;
  metadata: {
    title: string;
    description?: string;
    visibility: string;
  };
  content: string;
}

class LLMTextService {
  
  async generateLLMText(includeContent: boolean = false): Promise<string> {
    try {
      console.log('Generating LLM text export...');
      
      // Fetch all public content from content-index.json
      const response = await fetch('/content-index.json');
      if (!response.ok) {
        throw new Error('Failed to load content index');
      }
      
      const contentIndex: Record<string, ContentPage> = await response.json();
      
      // Filter for public content only
      const publicContent = Object.values(contentIndex).filter(
        page => page.metadata.visibility === 'PUBLIC'
      );
      
      console.log(`Found ${publicContent.length} public pages`);
      
      // Sort by path for consistent output
      publicContent.sort((a, b) => a.slug.localeCompare(b.slug));
      
      let output = '';
      
      // Add header
      output += '# Pieces for Developers Documentation\n\n';
      output += `Generated: ${new Date().toISOString()}\n`;
      output += `Total Pages: ${publicContent.length}\n`;
      output += `Content Level: ${includeContent ? 'Full Content' : 'Summaries Only'}\n\n`;
      output += '---\n\n';
      
      // Process each page
      for (const page of publicContent) {
        output += `## ${page.metadata.title}\n`;
        output += `Path: ${page.slug}\n`;
        
        if (page.metadata.description) {
          output += `Description: ${page.metadata.description}\n`;
        }
        
        output += '\n';
        
        if (includeContent && page.content) {
          // Clean the markdown content for LLM consumption
          const cleanContent = this.cleanMarkdownForLLM(page.content);
          output += cleanContent;
          output += '\n\n';
        }
        
        output += '---\n\n';
      }
      
      return output;
      
    } catch (error) {
      console.error('Failed to generate LLM text:', error);
      throw error;
    }
  }
  
  private cleanMarkdownForLLM(content: string): string {
    // Remove frontmatter if present
    let cleaned = content.replace(/^---[\s\S]*?---\n?/, '');
    
    // Convert markdown images to text descriptions
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '[Image: $1]');
    
    // Convert markdown links to text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    // Remove HTML comments
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
    
    // Convert headers to plain text with structure
    cleaned = cleaned.replace(/^#{6}\s+(.+)$/gm, '      • $1');
    cleaned = cleaned.replace(/^#{5}\s+(.+)$/gm, '     • $1');
    cleaned = cleaned.replace(/^#{4}\s+(.+)$/gm, '    • $1');
    cleaned = cleaned.replace(/^#{3}\s+(.+)$/gm, '   • $1');
    cleaned = cleaned.replace(/^#{2}\s+(.+)$/gm, '  • $1');
    cleaned = cleaned.replace(/^#{1}\s+(.+)$/gm, ' • $1');
    
    // Convert code blocks to indented text
    cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
      const lines = match.split('\n').slice(1, -1); // Remove ``` lines
      return lines.map(line => `    ${line}`).join('\n');
    });
    
    // Convert inline code
    cleaned = cleaned.replace(/`([^`]+)`/g, '"$1"');
    
    // Convert bold/italic to plain text
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
    cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
    cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
    
    // Clean up multiple newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();
    
    return cleaned;
  }
}

// Export singleton instance
export const llmTextService = new LLMTextService();
