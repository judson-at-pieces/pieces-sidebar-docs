
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { processCustomSyntax } from './custom-syntax-bridge.js';

export interface CompilerOptions {
  inputDir: string;
  outputDir: string;
}

export class SimpleMarkdownCompiler {
  private inputDir: string;
  private outputDir: string;

  constructor(options: CompilerOptions) {
    this.inputDir = options.inputDir;
    this.outputDir = options.outputDir;
  }

  async compile(): Promise<void> {
    console.log(`🔧 Starting compilation from ${this.inputDir} to ${this.outputDir}`);
    
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Find all markdown files
    const markdownFiles = await this.findMarkdownFiles(this.inputDir);
    console.log(`📄 Found ${markdownFiles.length} markdown files`);
    
    const registry: Record<string, string> = {};
    
    for (const filePath of markdownFiles) {
      try {
        const relativePath = path.relative(this.inputDir, filePath);
        const routePath = this.getRoutePath(relativePath);
        const tsxPath = await this.compileFile(filePath, routePath);
        
        if (tsxPath) {
          const importPath = path.relative(this.outputDir, tsxPath).replace(/\.tsx$/, '');
          registry[routePath] = `./${importPath}`;
          console.log(`✅ Compiled: ${relativePath} -> ${routePath}`);
        }
      } catch (error) {
        console.error(`❌ Error compiling ${filePath}:`, error);
      }
    }
    
    // Generate index file
    await this.generateIndex(registry);
    console.log(`📦 Generated index with ${Object.keys(registry).length} entries`);
  }

  private async findMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.findMarkdownFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}:`, error);
    }
    
    return files;
  }

  private getRoutePath(relativePath: string): string {
    // Convert file path to route path
    let routePath = relativePath
      .replace(/\.md$/, '')
      .replace(/\\/g, '/'); // Normalize path separators
    
    // Handle special cases for root-level files
    if (!routePath.includes('/')) {
      routePath = `/docs/${routePath}`;
    } else {
      routePath = `/${routePath}`;
    }
    
    return routePath;
  }

  private async compileFile(filePath: string, routePath: string): Promise<string | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { data: frontmatter, content: markdownContent } = matter(content);
      
      // Clean up the markdown content
      let cleanContent = markdownContent
        .replace(/^---[\s\S]*?---\s*/, '') // Remove any remaining frontmatter
        .replace(/^\*\*\*\s*/, '') // Remove *** separator
        .trim();
      
      // If content is empty or very minimal, create a basic structure
      if (!cleanContent || cleanContent.length < 10) {
        const title = frontmatter.title || 'Documentation Page';
        cleanContent = `# ${title}\n\nThis page is currently under development. Please check back soon for more content.`;
      }
      
      // Process custom syntax (Steps, Cards, Callouts, etc.)
      const processedContent = processCustomSyntax(cleanContent);
      
      // Generate TSX component
      const tsxContent = this.generateTSXComponent(processedContent, frontmatter, routePath);
      
      // Determine output path
      const relativePath = path.relative(this.inputDir, filePath);
      const outputPath = path.join(this.outputDir, relativePath.replace(/\.md$/, '.tsx'));
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // Write TSX file
      await fs.writeFile(outputPath, tsxContent, 'utf-8');
      
      return outputPath;
    } catch (error) {
      console.error(`Error compiling ${filePath}:`, error);
      return null;
    }
  }

  private generateTSXComponent(content: string, frontmatter: any, routePath: string): string {
    // Escape content for TSX - be more careful with escaping
    const escapedContent = content
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\${/g, '\\${')
      .replace(/"/g, '\\"'); // Also escape double quotes

    // Ensure we have a proper title
    const title = frontmatter.title || routePath.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Documentation';

    return `import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

const frontmatter = ${JSON.stringify({
  ...frontmatter,
  title: title,
  path: routePath,
}, null, 2)};

export { frontmatter };

export default function CompiledMarkdownContent() {
  const content = \`${escapedContent}\`;
  
  return <MarkdownRenderer content={content} />;
}
`;
  }

  private async generateIndex(registry: Record<string, string>): Promise<void> {
    const imports = Object.entries(registry)
      .map(([routePath, importPath], index) => 
        `import * as content${index} from '${importPath}';`
      )
      .join('\n');

    const registrations = Object.entries(registry)
      .map(([routePath, importPath], index) => 
        `  registerContent('${routePath}', content${index} as CompiledContentModule);`
      )
      .join('\n');

    const indexContent = `
// Auto-generated compiled content index
// This file is generated by the MDX compiler - do not edit manually

export interface CompiledContentModule {
  default: React.ComponentType;
  frontmatter: {
    title?: string;
    description?: string;
    author?: string;
    lastModified?: string;
    path?: string;
    visibility?: string;
  };
}

// Import all compiled content
${imports}

// Content registry populated by the build script
export const contentRegistry: Record<string, CompiledContentModule> = {};

// Register all content
${registrations}

// Function to get compiled content from registry
export function getCompiledContent(path: string): CompiledContentModule | null {
  const normalizedPath = path.startsWith('/') ? path : \`/\${path}\`;
  console.log('Looking for compiled content at path:', normalizedPath);
  console.log('Available paths:', Object.keys(contentRegistry));
  return contentRegistry[normalizedPath] || null;
}

// Get all available compiled content paths
export function getAllCompiledPaths(): string[] {
  return Object.keys(contentRegistry);
}

// Register content function (used by build script)
export function registerContent(path: string, module: CompiledContentModule): void {
  contentRegistry[path] = module;
}
`;

    const indexPath = path.join(this.outputDir, 'index.ts');
    await fs.writeFile(indexPath, indexContent, 'utf-8');
  }
}
