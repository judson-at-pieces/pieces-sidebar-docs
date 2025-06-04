import fs from 'fs/promises';
import path from 'path';
import { compile } from '@mdx-js/mdx';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import type { Node } from 'unist';

interface FrontMatter {
  title: string;
  path: string;
  visibility?: string;
  [key: string]: any;
}

interface CompilerOptions {
  inputDir: string;
  outputDir: string;
  baseImportPath?: string;
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
    
    // Process custom syntax
    const processedContent = this.processCustomSyntax(markdownContent);
    
    // Compile MDX to JSX
    const compiled = await compile(processedContent, {
      outputFormat: 'program',
      development: false,
      remarkPlugins: [
        remarkGfm,
        this.createCustomComponentsPlugin.bind(this),
      ],
    });
    
    // Generate TSX component
    const tsxContent = this.generateTSXComponent(
      filePath,
      compiled.value.toString(),
      frontmatter as FrontMatter
    );
    
    // Write output file
    const outputPath = this.getOutputPath(filePath);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, tsxContent);
  }

  private processCustomSyntax(content: string): string {
    let processedContent = content;

    console.log('🔍 Processing custom syntax for content preview:', content.substring(0, 200));

    // Transform callout syntax: :::info[Title] or :::warning{title="Warning"}
    processedContent = processedContent.replace(
      /:::(\w+)(?:\[([^\]]*)\]|\{title="([^"]*)"\})?\n([\s\S]*?):::/g,
      (match, type, title1, title2, innerContent) => {
        const title = title1 || title2 || '';
        console.log('📝 Processing callout:', { type, title });
        return `<Callout type="${type}" title="${title}">\n\n${innerContent.trim()}\n\n</Callout>`;
      }
    );

    // Transform simple callout syntax: :::info
    processedContent = processedContent.replace(
      /:::(\w+)\n([\s\S]*?):::/g,
      (_, type, innerContent) => {
        console.log('📝 Processing simple callout:', { type });
        return `<Callout type="${type}">\n\n${innerContent.trim()}\n\n</Callout>`;
      }
    );

    // Robust CardGroup processing - handle both with and without cols attribute
    console.log('🃏 Starting CardGroup processing...');
    
    // First, handle CardGroup with cols attribute
    processedContent = processedContent.replace(
      /<CardGroup\s+cols=\{(\d+)\}>([\s\S]*?)<\/CardGroup>/g,
      (match, cols, innerContent) => {
        console.log(`🃏 Processing CardGroup with cols=${cols}:`);
        console.log('🃏 Inner content preview:', innerContent.substring(0, 200));
        
        // Process the inner Card elements
        const processedInner = this.processCardElements(innerContent.trim());
        console.log('🃏 Processed inner content preview:', processedInner.substring(0, 200));
        
        return `<CardGroup cols={${cols}}>\n${processedInner}\n</CardGroup>`;
      }
    );

    // Then handle CardGroup without cols (default to 2)
    processedContent = processedContent.replace(
      /<CardGroup>([\s\S]*?)<\/CardGroup>/g,
      (match, innerContent) => {
        console.log('🃏 Processing CardGroup with default cols=2:');
        console.log('🃏 Inner content preview:', innerContent.substring(0, 200));
        
        // Process the inner Card elements
        const processedInner = this.processCardElements(innerContent.trim());
        console.log('🃏 Processed inner content preview:', processedInner.substring(0, 200));
        
        return `<CardGroup cols={2}>\n${processedInner}\n</CardGroup>`;
      }
    );

    // Transform ExpandableImage components
    processedContent = processedContent.replace(
      /<ExpandableImage\s+src="([^"]*)"(?:\s+alt="([^"]*)")?(?:\s+caption="([^"]*)")?\/>/gi,
      (_, src, alt, caption) => {
        console.log('🖼️ Processing ExpandableImage:', { src, alt, caption });
        return `<ExpandableImage src="${src}" alt="${alt || ''}" caption="${caption || ''}" />`;
      }
    );

    // Handle regular images with captions
    processedContent = processedContent.replace(
      /!\[([^\]]*)\]\(([^)]+)\)(?:\s*"([^"]*)")?/g,
      (match, alt, src, caption) => {
        if (processedContent.includes(`<ExpandableImage src="${src}"`)) {
          return match;
        }
        console.log('🖼️ Processing regular image:', { src, alt, caption });
        if (caption) {
          return `<ExpandableImage src="${src}" alt="${alt}" caption="${caption}" />`;
        }
        return `<Image src="${src}" alt="${alt}" />`;
      }
    );

    console.log('✅ Custom syntax processing complete');
    return processedContent;
  }

  private processCardElements(content: string): string {
    console.log('🎯 Processing Card elements in content...');
    
    // Handle Card elements with various attribute combinations
    let processedContent = content;
    
    // Pattern to match Card with title and image attributes
    processedContent = processedContent.replace(
      /<Card\s+title="([^"]*)"(?:\s+image="([^"]*)")?>([\s\S]*?)<\/Card>/g,
      (match, title, image, innerContent) => {
        console.log(`🎯 Processing Card with title="${title}" image="${image || 'none'}"`);
        console.log('🎯 Card inner content preview:', innerContent.substring(0, 100));
        
        const imageAttr = image ? ` image="${image}"` : '';
        const processedInner = innerContent.trim();
        
        return `  <Card title="${title}"${imageAttr}>\n    ${processedInner}\n  </Card>`;
      }
    );

    // Handle Card with just title
    processedContent = processedContent.replace(
      /<Card\s+title="([^"]*)">([\s\S]*?)<\/Card>/g,
      (match, title, innerContent) => {
        console.log(`🎯 Processing Card with title="${title}" (no image)`);
        
        const processedInner = innerContent.trim();
        return `  <Card title="${title}">\n    ${processedInner}\n  </Card>`;
      }
    );

    console.log('🎯 Card processing complete');
    return processedContent;
  }

  private createCustomComponentsPlugin() {
    return () => {
      return (tree: Node) => {
        visit(tree, 'element', (node: any) => {
          // Log custom elements for debugging
          if (node.tagName === 'Card') {
            console.log('🎯 Remark plugin processing Card element:', node);
          }
          if (node.tagName === 'CardGroup') {
            console.log('🃏 Remark plugin processing CardGroup element:', node);
          }
          if (node.tagName === 'Steps' || 
              node.tagName === 'Step' ||
              node.tagName === 'ExpandableImage' ||
              node.tagName === 'Callout') {
            console.log(`🔧 Remark plugin processing ${node.tagName} element`);
          }
        });
      };
    };
  }

  private generateTSXComponent(
    filePath: string,
    compiledCode: string,
    frontmatter: FrontMatter
  ): string {
    const componentName = this.getComponentName(filePath);
    
    // Extract imports from compiled code
    const importRegex = /^(import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*)+/m;
    const importMatch = compiledCode.match(importRegex);
    const imports = importMatch ? importMatch[0].trim() : '';
    
    // Remove imports and export default, keep just the function body
    let codeWithoutImports = compiledCode.replace(importRegex, '').trim();
    
    // Replace the default export with our custom one
    codeWithoutImports = codeWithoutImports.replace(/export\s+default\s+function\s+MDXContent/g, 'function MDXContent');
    
    return `import React from 'react';
import { Link } from 'react-router-dom';
import { ExpandableImage } from '@/components/markdown/ExpandableImage';
import { Image } from '@/components/markdown/Image';
import { Callout } from '@/components/markdown/Callout';
import { Steps, Step } from '@/components/markdown/Steps';
import { MarkdownCard as Card } from '@/components/markdown/MarkdownCard';
import { CardGroup } from '@/components/markdown/CardGroup';
import { 
  CustomTable, 
  CustomTableHeader, 
  CustomTableBody, 
  CustomTableRow, 
  CustomTableHead, 
  CustomTableCell 
} from '@/components/markdown/CustomTable';
import { MDXProps } from '@/utils/mdxUtils';
${imports}

export interface ${componentName}Props extends MDXProps {}

export const frontmatter = ${JSON.stringify(frontmatter, null, 2)};

// MDX compiled content
${codeWithoutImports}

// Export our wrapper component
export default function ${componentName}({ components = {} }: ${componentName}Props) {
  console.log('🚀 Rendering ${componentName} component');
  
  const _components = {
    a: ({ href, children, ...props }: any) => {
      if (href?.startsWith('/')) {
        return <Link to={href} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" {...props}>{children}</Link>;
      }
      return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" {...props}>{children}</a>;
    },
    table: CustomTable,
    thead: CustomTableHeader,
    tbody: CustomTableBody,
    tr: CustomTableRow,
    th: CustomTableHead,
    td: CustomTableCell,
    h1: ({ children, ...props }: any) => <h1 className="scroll-m-20 text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight" {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 className="scroll-m-20 pb-2 text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight transition-colors first:mt-0" {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 className="scroll-m-20 pb-2 text-lg md:text-xl lg:text-2xl font-semibold tracking-tight transition-colors first:mt-0" {...props}>{children}</h3>,
    h4: ({ children, ...props }: any) => <h4 className="scroll-m-20 pb-2 text-xl font-semibold tracking-tight transition-colors first:mt-0" {...props}>{children}</h4>,
    pre: ({ children, ...props }: any) => <pre className="rounded-md border bg-secondary text-sm text-secondary-foreground" {...props}>{children}</pre>,
    code: ({ children, ...props }: any) => <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold" {...props}>{children}</code>,
    ul: ({ children, ...props }: any) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>{children}</ul>,
    ol: ({ children, ...props }: any) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>{children}</ol>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    blockquote: ({ children, ...props }: any) => <blockquote className="mt-6 border-l-2 pl-6 italic" {...props}>{children}</blockquote>,
    p: ({ children, ...props }: any) => <p className="leading-7 [&:not(:first-child)]:mt-6" {...props}>{children}</p>,
    hr: ({ ...props }: any) => <hr className="my-4 md:my-8" {...props} />,
    ExpandableImage,
    Image,
    Callout,
    Steps,
    Step,
    Card: ({ title, image, children, ...props }: any) => {
      console.log('🎯 Rendering Card component:', { title, image, hasChildren: !!children });
      return <Card title={title} image={image} {...props}>{children}</Card>;
    },
    CardGroup: ({ cols, children, ...props }: any) => {
      console.log('🃏 Rendering CardGroup component:', { cols, childrenCount: React.Children.count(children) });
      return <CardGroup cols={cols} {...props}>{children}</CardGroup>;
    },
    ...components
  };
  
  return <MDXContent components={_components} />;
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
