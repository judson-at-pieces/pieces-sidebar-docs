
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

class MDXCompiler {
  constructor(options) {
    this.inputDir = options.inputDir;
    this.outputDir = options.outputDir;
  }

  async compile() {
    console.log('🚀 Starting MDX compilation...');
    
    // Clean output directory
    if (fs.existsSync(this.outputDir)) {
      fs.rmSync(this.outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.outputDir, { recursive: true });

    await this.compileDirectory(this.inputDir, this.outputDir);
    console.log('✅ MDX compilation completed!');
  }

  async compileDirectory(inputDir, outputDir) {
    const entries = fs.readdirSync(inputDir);

    for (const entry of entries) {
      const inputPath = path.join(inputDir, entry);
      const stat = fs.statSync(inputPath);

      if (stat.isDirectory()) {
        const nestedOutputDir = path.join(outputDir, entry);
        fs.mkdirSync(nestedOutputDir, { recursive: true });
        await this.compileDirectory(inputPath, nestedOutputDir);
      } else if (entry.endsWith('.md')) {
        await this.compileFile(inputPath, outputDir);
      }
    }
  }

  async compileFile(inputPath, outputDir) {
    console.log(`📝 Compiling: ${inputPath}`);
    
    const content = fs.readFileSync(inputPath, 'utf-8');
    const { data: frontmatter, content: markdownContent } = matter(content);
    
    // Generate component name from file path
    const relativePath = path.relative(this.inputDir, inputPath);
    const componentName = this.generateComponentName(relativePath);
    const outputPath = path.join(outputDir, relativePath.replace('.md', '.tsx'));
    
    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    
    const tsxContent = this.generateTSX(componentName, frontmatter, markdownContent);
    fs.writeFileSync(outputPath, tsxContent);
    
    console.log(`✅ Generated: ${outputPath}`);
  }

  generateComponentName(relativePath) {
    return 'MDX_' + relativePath
      .replace(/\.md$/, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  generateTSX(componentName, frontmatter, content) {
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
import { MDXProps } from '@/utils/mdxUtils';
import HashnodeMarkdownRenderer from '@/components/markdown/HashnodeMarkdownRenderer';
import {jsx as _jsx} from "react/jsx-runtime";

export interface ${componentName}Props extends MDXProps {}

export const frontmatter = ${JSON.stringify(frontmatter, null, 2)};

// MDX compiled content
function _createMdxContent(props: MDXProps) {
  return _jsx(HashnodeMarkdownRenderer, {
    content: ${JSON.stringify(`---\n${Object.entries(frontmatter).map(([key, value]) => `${key}: "${value}"`).join('\n')}\n---\n***\n${content}`)}
  });
}

function MDXContent(props: MDXProps = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? _jsx(MDXLayout, {
    ...props,
    children: _jsx(_createMdxContent, {
      ...props
    })
  }) : _createMdxContent(props);
}

// Export our wrapper component
export default function ${componentName}({ components = {} }: ${componentName}Props) {
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
    Callout,
    Steps,
    Step,
    Card,
    CardGroup,
    ...components
  };
  
  return <MDXContent components={_components} />;
}

${componentName}.displayName = '${componentName}';
${componentName}.frontmatter = frontmatter;
`;
  }
}

module.exports = { MDXCompiler };
