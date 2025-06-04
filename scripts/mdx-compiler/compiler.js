
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
}

module.exports = { MDXCompiler };
