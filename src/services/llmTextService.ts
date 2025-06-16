import { loadContentIndex } from '@/lib/content';

interface LLMTextContent {
  summary: string;
  full: string;
}

class LLMTextService {
  private cache: LLMTextContent | null = null;

  async generateLLMText(): Promise<LLMTextContent> {
    if (this.cache) {
      return this.cache;
    }

    try {
      const contentIndex = await loadContentIndex();
      const pages = Object.values(contentIndex);

      // Filter out non-public content
      const publicPages = pages.filter(page => 
        !page.slug.startsWith('admin/') && 
        !page.slug.startsWith('editor/') &&
        !page.slug.includes('/admin/') &&
        !page.slug.includes('/editor/')
      );

      // Sort pages alphabetically by slug
      publicPages.sort((a, b) => a.slug.localeCompare(b.slug));

      // Generate summary version (llms.txt)
      const summaryContent = this.generateSummary(publicPages);

      // Generate full version (llms-full.txt)
      const fullContent = this.generateFullContent(publicPages);

      this.cache = {
        summary: summaryContent,
        full: fullContent
      };

      return this.cache;
    } catch (error) {
      console.error('Error generating LLM text:', error);
      return {
        summary: 'Error: Unable to generate documentation summary',
        full: 'Error: Unable to generate full documentation'
      };
    }
  }

  private generateSummary(pages: any[]): string {
    const header = `# Pieces Documentation - Summary

This file contains a summary of all public documentation pages for Pieces.
Generated automatically from the documentation content.

Format: [Page Path] - [Title] - [Description]

---

`;

    const pageList = pages.map(page => {
      const path = `/${page.slug}`;
      const title = page.metadata.title || 'Untitled';
      const description = page.metadata.description || 'No description available';
      
      return `${path} - ${title} - ${description}`;
    }).join('\n');

    return header + pageList;
  }

  private generateFullContent(pages: any[]): string {
    const header = `# Pieces Documentation - Full Content

This file contains the complete content of all public documentation pages for Pieces.
Generated automatically from the documentation content.

---

`;

    const fullContent = pages.map(page => {
      const path = `/${page.slug}`;
      const title = page.metadata.title || 'Untitled';
      const content = this.cleanMarkdownForLLM(page.content);
      
      return `## ${title}\nPath: ${path}\n\n${content}\n\n---\n`;
    }).join('\n');

    return header + fullContent;
  }

  private cleanMarkdownForLLM(content: string): string {
    if (!content) return '';
    
    return content
      // Remove MDX imports and exports
      .replace(/^import\s+.*$/gm, '')
      .replace(/^export\s+.*$/gm, '')
      // Remove custom component tags but keep content
      .replace(/<([A-Z][A-Za-z0-9]*)[^>]*>/g, '')
      .replace(/<\/[A-Z][A-Za-z0-9]*>/g, '')
      // Clean up excessive whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  clearCache(): void {
    this.cache = null;
  }
}

export const llmTextService = new LLMTextService();
