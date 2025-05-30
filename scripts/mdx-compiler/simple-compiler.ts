import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

interface FrontMatter {
  title: string;
  path: string;
  visibility?: string;
  slug?: string; // Custom URL slug for routing
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
    console.log('🚀 Starting Simple Markdown to TSX compilation...');
    
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
      
      // For now, just render the markdown content in a pre tag
      // This ensures valid JSX while we work on proper parsing
      const tsxContent = this.escapeForJSX(markdownContent);
      
      // Generate TSX component
      const componentCode = this.generateTSXComponent(
        filePath,
        tsxContent,
        frontmatter as FrontMatter
      );
      
      // Write output file
      const outputPath = this.getOutputPath(filePath);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, componentCode);
    } catch (error) {
      console.error(`Error compiling ${filePath}:`, error);
      // Create a fallback component
      const fallbackComponent = this.generateFallbackComponent(filePath, error as Error);
      const outputPath = this.getOutputPath(filePath);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, fallbackComponent);
    }
  }

  private escapeForJSX(content: string): string {
    // For now, just escape the content to be safe
    return content
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');
  }

  private generateTSXComponent(
    filePath: string,
    content: string,
    frontmatter: FrontMatter
  ): string {
    const componentName = this.getComponentName(filePath);
    
    // For now, use the MarkdownRenderer component
    return `import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = ${JSON.stringify(frontmatter, null, 2)};

const markdownContent = \`${content}\`;

export default function ${componentName}() {
  return <MarkdownRenderer content={markdownContent} />;
}

${componentName}.displayName = '${componentName}';
${componentName}.frontmatter = frontmatter;
`;
  }

  private generateFallbackComponent(filePath: string, error: Error): string {
    const componentName = this.getComponentName(filePath);
    
    return `import React from 'react';

export const frontmatter = { title: 'Error', path: '${filePath}' };

export default function ${componentName}() {
  return (
    <div className="text-red-600">
      <h1>Error loading content</h1>
      <p>Failed to compile: ${filePath}</p>
      <pre>${error.message}</pre>
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
    const allPaths: string[] = [];
    
    for (const file of files) {
      const componentName = this.getComponentName(file);
      const relativePath = path.relative(this.options.inputDir, file);
      const importPath = './' + relativePath.replace(/\.(md|mdx)$/, '');
      const outputRelativePath = relativePath.replace(/\.(md|mdx)$/, '');
      
      imports.push(`import ${componentName}, { frontmatter as ${componentName}_frontmatter } from '${importPath}';`);
      exports.push(`  '${relativePath}': { component: ${componentName}, frontmatter: ${componentName}_frontmatter },`);
      allPaths.push(`'${outputRelativePath}'`);
    }
    
    const indexContent = `// Auto-generated file. Do not edit manually.
${imports.join('\n')}

export const contentComponents = {
${exports.join('\n')}
};

// All available content paths for slug mapping
export const allContentPaths = [
  ${allPaths.join(',\n  ')}
];

export type ContentComponent = {
  component: React.ComponentType<any>;
  frontmatter: {
    title: string;
    path: string;
    visibility?: string;
    slug?: string;
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