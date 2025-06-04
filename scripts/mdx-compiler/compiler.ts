
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

export class MDXCompiler {
  private options: CompilerOptions;

  constructor(options: CompilerOptions) {
    this.options = options;
  }

  async compile(): Promise<void> {
    console.log('🚀 Starting MDX compilation...');
    
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
    
    // Generate TSX component that uses HashnodeMarkdownRenderer
    const tsxContent = this.generateTSXComponent(
      filePath,
      markdownContent,
      frontmatter as FrontMatter
    );
    
    // Write output file
    const outputPath = this.getOutputPath(filePath);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, tsxContent);
  }

  private generateTSXComponent(
    filePath: string,
    content: string,
    frontmatter: FrontMatter
  ): string {
    const componentName = this.getComponentName(filePath);
    
    return `import React from 'react';
import { MDXProps } from '@/utils/mdxUtils';
import HashnodeMarkdownRenderer from '@/components/markdown/HashnodeMarkdownRenderer';

export interface ${componentName}Props extends MDXProps {}

export const frontmatter = ${JSON.stringify(frontmatter, null, 2)};

// Export our wrapper component
export default function ${componentName}({ components = {} }: ${componentName}Props) {
  console.log('🚀 Rendering ${componentName} component');
  
  const combinedContent = \`---
\${Object.entries(frontmatter).map(([key, value]) => \`\${key}: "\${value}"\`).join('\\n')}
---
***
\${${JSON.stringify(content)}}
\`;

  return <HashnodeMarkdownRenderer content={combinedContent} />;
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
      
      // Add the original file path
      exports.push(`  '${relativePath}': { component: ${componentName}, frontmatter: ${componentName}_frontmatter },`);
      
      // If the file ends with .md, also add folder path mappings
      if (relativePath.endsWith('.md')) {
        const folderPath = relativePath.replace(/\.md$/, '');
        
        // Add folder path without leading slash
        exports.push(`  '${folderPath}': { component: ${componentName}, frontmatter: ${componentName}_frontmatter },`);
        
        // Add folder path with leading slash for routes like /cli
        exports.push(`  '/${folderPath}': { component: ${componentName}, frontmatter: ${componentName}_frontmatter },`);
        
        // Add with /docs prefix
        exports.push(`  '/docs/${folderPath}': { component: ${componentName}, frontmatter: ${componentName}_frontmatter },`);
      }
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
