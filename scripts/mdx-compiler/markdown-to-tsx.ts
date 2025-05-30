import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';

interface FrontMatter {
  title: string;
  path: string;
  visibility?: string;
  [key: string]: any;
}

interface CompilerOptions {
  inputDir: string;
  outputDir: string;
}

export class MarkdownToTSXCompiler {
  private options: CompilerOptions;

  constructor(options: CompilerOptions) {
    this.options = options;
    
    // Configure marked
    marked.setOptions({
      gfm: true,
      breaks: false,
    });
  }

  async compile(): Promise<void> {
    console.log('🚀 Starting Markdown to TSX compilation...');
    
    // Clean output directory
    await this.cleanOutputDir();
    
    // Get all markdown files
    const files = await this.getAllMarkdownFiles(this.options.inputDir);
    
    // Compile each file
    for (const file of files) {
      await this.compileFile(file);
    }
    
    // Generate index file
    await this.generateIndex(files);
    
    console.log(`✅ Compiled ${files.length} files successfully!`);
  }

  private async cleanOutputDir(): Promise<void> {
    try {
      await fs.rm(this.options.outputDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
    await fs.mkdir(this.options.outputDir, { recursive: true });
  }

  private async getAllMarkdownFiles(dir: string, files: string[] = []): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await this.getAllMarkdownFiles(fullPath, files);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  private async compileFile(filePath: string): Promise<void> {
    console.log(`📄 Compiling: ${filePath}`);
    
    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Parse frontmatter
      const { data: frontmatter, content: markdownContent } = matter(content);
      
      // Process custom syntax
      const processedContent = this.processCustomSyntax(markdownContent);
      
      // Convert markdown to HTML
      const html = marked(processedContent);
      
      // Convert HTML to TSX
      const tsx = this.htmlToTSX(html);
      
      // Generate TSX component
      const componentCode = this.generateTSXComponent(
        filePath,
        tsx,
        frontmatter as FrontMatter
      );
      
      // Write output file
      const outputPath = this.getOutputPath(filePath);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, componentCode);
    } catch (error) {
      console.error(`Error compiling ${filePath}:`, error);
      throw error;
    }
  }

  private processCustomSyntax(content: string): string {
    // Transform callout syntax: :::info[Title] or :::warning{title="Warning"}
    content = content.replace(
      /:::(\w+)(?:\[([^\]]*)\]|\{title="([^"]*)"\})?\n([\s\S]*?):::/g,
      (match, type, title1, title2, innerContent) => {
        const title = title1 || title2 || '';
        return `<Callout type="${type}" title="${title}">\n\n${innerContent.trim()}\n\n</Callout>`;
      }
    );

    // Transform simple callout syntax: :::info
    content = content.replace(
      /:::(\w+)\n([\s\S]*?):::/g,
      (_, type, innerContent) => {
        return `<Callout type="${type}">\n\n${innerContent.trim()}\n\n</Callout>`;
      }
    );

    // Transform ExpandableImage components
    content = content.replace(
      /<ExpandableImage\s+src="([^"]*)"(?:\s+alt="([^"]*)")?(?:\s+caption="([^"]*)")?\/>/gi,
      (_, src, alt, caption) => {
        return `<ExpandableImage src="${src}" alt="${alt || ''}" caption="${caption || ''}" />`;
      }
    );

    return content;
  }

  private htmlToTSX(html: string): string {
    // Create a DOM from the HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Process all elements
    const tsx = this.processNode(document.body);
    
    // Clean up the result
    return tsx
      .replace(/<body>/g, '')
      .replace(/<\/body>/g, '')
      .trim();
  }

  private processNode(node: any): string {
    if (node.nodeType === 3) { // Text node
      return node.textContent;
    }
    
    if (node.nodeType === 1) { // Element node
      const tagName = node.tagName.toLowerCase();
      const attributes = this.getAttributes(node);
      const children = Array.from(node.childNodes)
        .map((child: any) => this.processNode(child))
        .join('');
      
      // Map HTML elements to custom components
      const componentMap: Record<string, string> = {
        'a': 'Link',
        'img': 'ExpandableImage',
        'callout': 'Callout',
        'card': 'Card',
        'cardgroup': 'CardGroup',
        'steps': 'Steps',
        'step': 'Step',
      };
      
      const component = componentMap[tagName] || tagName;
      
      // Special handling for certain elements
      if (tagName === 'a') {
        const href = node.getAttribute('href') || '';
        if (href.startsWith('/')) {
          return `<Link to="${href}"${attributes}>${children}</Link>`;
        } else {
          return `<a href="${href}" target="_blank" rel="noopener noreferrer"${attributes}>${children}</a>`;
        }
      }
      
      if (tagName === 'img') {
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || '';
        const title = node.getAttribute('title') || '';
        return `<ExpandableImage src="${src}" alt="${alt}" caption="${title}" />`;
      }
      
      // Handle self-closing tags
      if (['img', 'br', 'hr', 'input'].includes(tagName)) {
        return `<${component}${attributes} />`;
      }
      
      return `<${component}${attributes}>${children}</${component}>`;
    }
    
    return '';
  }

  private getAttributes(node: any): string {
    const attrs = Array.from(node.attributes || [])
      .filter((attr: any) => !['href', 'src', 'alt', 'title'].includes(attr.name))
      .map((attr: any) => {
        if (attr.name === 'class') {
          return `className="${attr.value}"`;
        }
        // Fix case sensitivity for React attributes
        if (attr.name.toLowerCase() === 'classname') {
          return `className="${attr.value}"`;
        }
        return `${attr.name}="${attr.value}"`;
      })
      .join(' ');
    
    return attrs ? ' ' + attrs : '';
  }

  private generateTSXComponent(
    filePath: string,
    tsxContent: string,
    frontmatter: FrontMatter
  ): string {
    const componentName = this.getComponentName(filePath);
    
    return `import React from 'react';
import { Link } from 'react-router-dom';
import { ExpandableImage } from '@/components/markdown/ExpandableImage';
import { Callout } from '@/components/markdown/Callout';
import { Steps, Step } from '@/components/markdown/Steps';
import { Card } from '@/components/markdown/Card';
import { CardGroup } from '@/components/markdown/CardGroup';

export const frontmatter = ${JSON.stringify(frontmatter, null, 2)};

export default function ${componentName}() {
  return (
    <>
      ${tsxContent}
    </>
  );
}

${componentName}.displayName = '${componentName}';
${componentName}.frontmatter = frontmatter;
`;
  }

  private getComponentName(filePath: string): string {
    const relativePath = path.relative(this.options.inputDir, filePath);
    const name = relativePath
      .replace(/[\/\\]/g, '_')
      .replace(/\.(md|mdx)$/, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '');
    
    // Ensure it starts with a letter
    return `MDX_${name}`;
  }

  private getOutputPath(inputPath: string): string {
    const relativePath = path.relative(this.options.inputDir, inputPath);
    const outputPath = path.join(
      this.options.outputDir,
      relativePath.replace(/\.(md|mdx)$/, '.tsx')
    );
    return outputPath;
  }

  private async generateIndex(files: string[]): Promise<void> {
    const imports: string[] = [];
    const exports: string[] = [];
    
    for (const file of files) {
      const componentName = this.getComponentName(file);
      const relativePath = path.relative(this.options.inputDir, file);
      const importPath = './' + relativePath.replace(/\.(md|mdx)$/, '');
      
      imports.push(`import ${componentName}, { frontmatter as ${componentName}_frontmatter } from '${importPath}';`);
      exports.push(`  '${relativePath}': { component: ${componentName}, frontmatter: ${componentName}_frontmatter },`);
    }
    
    const indexContent = `// Auto-generated file. Do not edit manually.
${imports.join('\n')}

export const contentComponents = {
${exports.join('\n')}
};

export type ContentComponent = {
  component: React.ComponentType<any>;
  frontmatter: {
    title: string;
    path: string;
    visibility?: string;
    [key: string]: any;
  };
};

export function getContentComponent(path: string): ContentComponent | undefined {
  return contentComponents[path];
}
`;
    
    await fs.writeFile(path.join(this.options.outputDir, 'index.ts'), indexContent);
  }
}