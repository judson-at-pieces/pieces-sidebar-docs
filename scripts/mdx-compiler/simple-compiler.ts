
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface CompilerOptions {
  inputDir: string;
  outputDir: string;
}

export class SimpleMarkdownCompiler {
  private options: CompilerOptions;

  constructor(options: CompilerOptions) {
    this.options = options;
  }

  async compile(): Promise<void> {
    // Clean output directory
    if (fs.existsSync(this.options.outputDir)) {
      fs.rmSync(this.options.outputDir, { recursive: true });
    }
    fs.mkdirSync(this.options.outputDir, { recursive: true });

    // Process all markdown files
    const contentMap: Record<string, any> = {};
    await this.processDirectory(this.options.inputDir, '', contentMap);

    // Generate individual TSX files
    await this.generateTsxFiles(contentMap);

    // Generate the index file
    await this.generateIndexFile(contentMap);

    console.log(`📦 Compiled ${Object.keys(contentMap).length} content files to TSX`);
  }

  private async processDirectory(
    dir: string,
    relativePath: string,
    contentMap: Record<string, any>
  ): Promise<void> {
    if (!fs.existsSync(dir)) {
      console.log(`Directory does not exist: ${dir}`);
      return;
    }

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        await this.processDirectory(itemPath, path.join(relativePath, item), contentMap);
      } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
        await this.processMarkdownFile(itemPath, relativePath, item, contentMap);
      }
    }
  }

  private async processMarkdownFile(
    filePath: string,
    relativePath: string,
    fileName: string,
    contentMap: Record<string, any>
  ): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { data: frontmatter, content: markdown } = matter(content);

      // Skip if not public
      if (frontmatter.visibility && frontmatter.visibility !== 'PUBLIC') {
        return;
      }

      // Generate the path key
      const baseName = fileName.replace(/\.(md|mdx)$/, '');
      let pathKey: string;
      
      if (relativePath) {
        pathKey = `/docs/${relativePath}/${baseName}`.replace(/\\/g, '/');
      } else {
        pathKey = `/docs/${baseName}`;
      }

      // Use frontmatter path if available
      if (frontmatter.path) {
        pathKey = frontmatter.path.startsWith('/') ? frontmatter.path : `/${frontmatter.path}`;
      }

      // Process the markdown content
      const processedContent = markdown.trim().replace(/^---[\s\S]*?---\s*/, '').replace(/^\*\*\*\s*/, '');

      // Store in content map
      contentMap[pathKey] = {
        frontmatter: {
          title: frontmatter.title || baseName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: frontmatter.description || null,
          author: frontmatter.author || null,
          lastModified: frontmatter.lastModified || null,
          path: pathKey,
          visibility: frontmatter.visibility || 'PUBLIC'
        },
        content: processedContent,
        filePath: this.getOutputPath(pathKey)
      };

      console.log(`✓ Processed: ${pathKey}`);
    } catch (error) {
      console.error(`✗ Error processing ${filePath}:`, error);
    }
  }

  private getOutputPath(pathKey: string): string {
    // Convert path to file system structure
    const cleanPath = pathKey.replace(/^\/docs\//, '').replace(/^\//, '');
    return path.join(this.options.outputDir, `${cleanPath}.tsx`);
  }

  private async generateTsxFiles(contentMap: Record<string, any>): Promise<void> {
    for (const [pathKey, data] of Object.entries(contentMap)) {
      const outputPath = data.filePath;
      const outputDir = path.dirname(outputPath);

      // Ensure directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate TSX content
      const tsxContent = this.generateTsxComponent(data);
      
      fs.writeFileSync(outputPath, tsxContent);
      console.log(`📝 Generated TSX: ${outputPath}`);
    }
  }

  private generateTsxComponent(data: any): string {
    // Escape content for JSX template literal
    const escapedContent = data.content
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\${/g, '\\${');

    return `import React from 'react';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';

export const frontmatter = ${JSON.stringify(data.frontmatter, null, 2)};

const content = \`${escapedContent}\`;

export default function CompiledContent() {
  return React.createElement(MarkdownRenderer, { content });
}
`;
  }

  private async generateIndexFile(contentMap: Record<string, any>): Promise<void> {
    const imports: string[] = [];
    const registryEntries: string[] = [];

    Object.entries(contentMap).forEach(([pathKey, data], index) => {
      const variableName = `content${index}`;
      const relativePath = path.relative(this.options.outputDir, data.filePath).replace(/\.tsx$/, '');
      const importPath = `./${relativePath.replace(/\\/g, '/')}`;
      
      imports.push(`import ${variableName}, { frontmatter as frontmatter${index} } from '${importPath}';`);
      registryEntries.push(`  '${pathKey}': {
    default: ${variableName},
    frontmatter: frontmatter${index}
  }`);
    });

    const indexContent = `// Auto-generated compiled content index
// This file is generated by the MDX compiler - do not edit manually

${imports.join('\n')}

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

// Content registry populated by the build script
export const contentRegistry: Record<string, CompiledContentModule> = {
${registryEntries.join(',\n')}
};

// Function to get compiled content from registry
export function getCompiledContent(path: string): CompiledContentModule | null {
  const normalizedPath = path.startsWith('/') ? path : \`/\${path}\`;
  return contentRegistry[normalizedPath] || null;
}

// Register content function (used by build script)
export function registerContent(path: string, module: CompiledContentModule): void {
  contentRegistry[path] = module;
}
`;

    const indexPath = path.join(this.options.outputDir, 'index.ts');
    fs.writeFileSync(indexPath, indexContent);
    
    console.log('📝 Generated compiled content index with TSX imports');
  }
}
