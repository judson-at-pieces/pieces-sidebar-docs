import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeReact from 'rehype-react';
import { visit } from 'unist-util-visit';
import type { Node, Parent } from 'unist';
import * as prod from 'react/jsx-runtime';

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

// Custom remark plugin to transform custom syntax
function remarkCustomSyntax() {
  return (tree: Node) => {
    visit(tree, 'paragraph', (node: any, index: number | null, parent: Parent | null) => {
      if (node.children && node.children.length > 0) {
        const firstChild = node.children[0];
        
        // Transform callout syntax
        if (firstChild.type === 'text' && firstChild.value.startsWith(':::')) {
          const calloutMatch = firstChild.value.match(/^:::(\w+)(?:\[([^\]]*)\]|\{title="([^"]*)"\})?/);
          if (calloutMatch) {
            const [, type, title1, title2] = calloutMatch;
            const title = title1 || title2 || '';
            
            // Find the closing ::: 
            let content = '';
            let foundEnd = false;
            
            for (let i = 0; i < node.children.length; i++) {
              const child = node.children[i];
              if (child.type === 'text') {
                const endMatch = child.value.match(/\n:::/);
                if (endMatch) {
                  content += child.value.substring(0, endMatch.index);
                  foundEnd = true;
                  break;
                } else {
                  content += child.value;
                }
              }
            }
            
            if (foundEnd && parent && typeof index === 'number') {
              // Replace with custom callout node
              const calloutNode = {
                type: 'html',
                value: `<Callout type="${type}" title="${title}">${content.replace(calloutMatch[0], '').trim()}</Callout>`
              };
              parent.children[index] = calloutNode;
            }
          }
        }
      }
    });

    // Transform image nodes to ExpandableImage
    visit(tree, 'image', (node: any) => {
      const caption = node.title || '';
      node.type = 'html';
      node.value = `<ExpandableImage src="${node.url}" alt="${node.alt || ''}" caption="${caption}" />`;
    });
  };
}

export class MDXToTSXCompiler {
  private options: CompilerOptions;

  constructor(options: CompilerOptions) {
    this.options = options;
  }

  async compile(): Promise<void> {
    console.log('🚀 Starting MDX to TSX compilation...');
    
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
    
    // Process custom syntax before markdown parsing
    const processedContent = this.processCustomSyntax(markdownContent);
    
    // Convert markdown to TSX string
    const tsxContent = await this.markdownToTSX(processedContent);
    
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
  }

  private processCustomSyntax(content: string): string {
    // Pre-process CardGroup and Card components
    content = content.replace(/<CardGroup\s+cols=\{(\d+)\}>/gi, (_, cols) => {
      return `<CardGroup cols={${cols}}>`;
    });
    
    // Process Card components with attributes
    content = content.replace(/<Card\s+([^>]*)>/gi, (match, attributes) => {
      // Parse attributes
      const attrMap: Record<string, string> = {};
      const attrRegex = /(\w+)="([^"]*)"/g;
      let attrMatch;
      
      while ((attrMatch = attrRegex.exec(attributes)) !== null) {
        attrMap[attrMatch[1]] = attrMatch[2];
      }
      
      // Build JSX attributes
      const jsxAttrs = Object.entries(attrMap)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      
      return `<Card ${jsxAttrs}>`;
    });
    
    // Process Steps and Step components
    content = content.replace(/<Step\s+number="(\d+)"(?:\s+title="([^"]*)")?>/gi, (_, number, title) => {
      return `<Step number={${number}} title="${title || ''}">`;
    });
    
    return content;
  }

  private async markdownToTSX(markdown: string): Promise<string> {
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkCustomSyntax)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeReact, {
        // @ts-ignore
        jsx: prod.jsx,
        jsxs: prod.jsxs,
        Fragment: prod.Fragment,
        createElement: (type: string, props: any, ...children: any[]) => {
          // Convert HTML elements to our custom components
          const componentMap: Record<string, string> = {
            'a': '_components.a',
            'table': '_components.table',
            'thead': '_components.thead',
            'tbody': '_components.tbody',
            'tr': '_components.tr',
            'th': '_components.th',
            'td': '_components.td',
            'h1': '_components.h1',
            'h2': '_components.h2',
            'h3': '_components.h3',
            'h4': '_components.h4',
            'pre': '_components.pre',
            'code': '_components.code',
            'ul': '_components.ul',
            'ol': '_components.ol',
            'li': '_components.li',
            'blockquote': '_components.blockquote',
            'p': '_components.p',
            'hr': '_components.hr',
          };
          
          const component = componentMap[type] || type;
          
          // Generate JSX string
          const propsStr = props ? 
            Object.entries(props)
              .filter(([key]) => key !== 'children')
              .map(([key, value]) => {
                if (typeof value === 'string') {
                  return `${key}="${value}"`;
                } else if (typeof value === 'number' || typeof value === 'boolean') {
                  return `${key}={${value}}`;
                } else {
                  return `${key}={${JSON.stringify(value)}}`;
                }
              })
              .join(' ') : '';
          
          const childrenStr = children.join('');
          
          if (childrenStr) {
            return `<${component}${propsStr ? ' ' + propsStr : ''}>${childrenStr}</${component}>`;
          } else {
            return `<${component}${propsStr ? ' ' + propsStr : ''} />`;
          }
        },
        components: {}
      });

    const result = await processor.process(markdown);
    
    // The result is a React element, we need to serialize it to JSX string
    // For now, we'll use a simplified approach
    return this.serializeToJSX(result.result);
  }

  private serializeToJSX(element: any): string {
    if (typeof element === 'string') {
      return element;
    }
    
    if (Array.isArray(element)) {
      return element.map(el => this.serializeToJSX(el)).join('\n');
    }
    
    if (element && typeof element === 'object') {
      // This is a simplified serialization - in production you'd want more robust handling
      return element.toString();
    }
    
    return '';
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

export interface ${componentName}Props {}

export const frontmatter = ${JSON.stringify(frontmatter, null, 2)};

export default function ${componentName}(props: ${componentName}Props) {
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
  };

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