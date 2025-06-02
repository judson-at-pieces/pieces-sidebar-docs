
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

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

export class SimpleMarkdownCompiler {
  private options: CompilerOptions;

  constructor(options: CompilerOptions) {
    this.options = options;
  }

  async compile(): Promise<void> {
    console.log('🚀 Starting simple markdown compilation...');
    
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
    
    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Parse frontmatter
    const { data: frontmatter, content: markdownContent } = matter(content);
    
    // Process custom syntax
    const processedContent = this.processCustomSyntax(markdownContent);
    
    // Generate TSX component
    const tsxContent = this.generateTSXComponent(
      filePath,
      processedContent,
      frontmatter as FrontMatter
    );
    
    // Write output file
    const outputPath = this.getOutputPath(filePath);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, tsxContent);
  }

  private processCustomSyntax(content: string): string {
    // Transform callout syntax
    content = content.replace(
      /:::(\w+)(?:\[([^\]]*)\]|\{title="([^"]*)"\})?\n([\s\S]*?):::/g,
      (match, type, title1, title2, innerContent) => {
        const title = title1 || title2 || '';
        return `<Callout type="${type}" title="${title}">\n${innerContent.trim()}\n</Callout>`;
      }
    );

    // Transform simple callout syntax
    content = content.replace(
      /:::(\w+)\n([\s\S]*?):::/g,
      (_, type, innerContent) => {
        return `<Callout type="${type}">\n${innerContent.trim()}\n</Callout>`;
      }
    );

    // Transform Image components - handle all attributes
    content = content.replace(
      /<Image\s+([^>]*)\s*\/?>/gi,
      (match, attributes) => {
        const srcMatch = attributes.match(/src="([^"]*)"/);
        const altMatch = attributes.match(/alt="([^"]*)"/);
        const captionMatch = attributes.match(/caption="([^"]*)"/);
        const alignMatch = attributes.match(/align="([^"]*)"/);
        const fullwidthMatch = attributes.match(/fullwidth="([^"]*)"/);
        const titleMatch = attributes.match(/title="([^"]*)"/);
        
        const src = srcMatch ? srcMatch[1] : '';
        const alt = altMatch ? altMatch[1] : '';
        const caption = captionMatch ? captionMatch[1] : '';
        const align = alignMatch ? alignMatch[1] : 'left';
        const fullwidth = fullwidthMatch ? fullwidthMatch[1] : 'false';
        const title = titleMatch ? titleMatch[1] : '';
        
        return `<Image src="${src}" alt="${alt}" caption="${caption}" align="${align}" fullwidth="${fullwidth}" title="${title}" />`;
      }
    );

    // Transform Card components
    content = content.replace(
      /<Card\s+([^>]*)>([\s\S]*?)<\/Card>/gi,
      (match, attributes, innerContent) => {
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
        
        return `<Card title="${title}" image="${image}" icon="${icon}" href="${href}" external="${external}">\n${innerContent.trim()}\n</Card>`;
      }
    );

    // Transform CardGroup components
    content = content.replace(
      /<CardGroup\s*(?:cols="(\d+)")?\s*>([\s\S]*?)<\/CardGroup>/gi,
      (match, cols, innerContent) => {
        const colsValue = cols || '2';
        return `<CardGroup cols="${colsValue}">\n${innerContent.trim()}\n</CardGroup>`;
      }
    );

    // Transform Steps components
    content = content.replace(
      /<Steps>([\s\S]*?)<\/Steps>/gi,
      (match, innerContent) => {
        return `<Steps>\n${innerContent.trim()}\n</Steps>`;
      }
    );

    // Transform Step components
    content = content.replace(
      /<Step\s+number="(\d+)"(?:\s+title="([^"]*)")?>([\s\S]*?)<\/Step>/gi,
      (match, number, title, innerContent) => {
        const stepTitle = title || '';
        return `<Step number={${number}} title="${stepTitle}">\n${innerContent.trim()}\n</Step>`;
      }
    );

    // Handle regular markdown images and convert to ExpandableImage
    content = content.replace(
      /!\[([^\]]*)\]\(([^)]+)\)(?:\s*"([^"]*)")?/g,
      (_, alt, src, caption) => {
        if (caption) {
          return `<ExpandableImage src="${src}" alt="${alt}" caption="${caption}" />`;
        }
        return `<ExpandableImage src="${src}" alt="${alt}" />`;
      }
    );

    return content;
  }

  private generateTSXComponent(
    filePath: string,
    processedContent: string,
    frontmatter: FrontMatter
  ): string {
    const componentName = this.getComponentName(filePath);
    
    return `import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export interface ${componentName}Props {
  components?: Record<string, React.ComponentType<any>>;
}

export const frontmatter = ${JSON.stringify(frontmatter, null, 2)};

const markdownContent = \`${processedContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;

export default function ${componentName}({ components = {} }: ${componentName}Props) {
  return (
    <div className="compiled-mdx-content">
      <MarkdownRenderer content={markdownContent} />
    </div>
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
