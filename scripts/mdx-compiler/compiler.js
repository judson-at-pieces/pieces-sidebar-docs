
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

  processCustomSyntax(content) {
    // Transform callout syntax: :::info[Title] or :::warning{title="Warning"}
    content = content.replace(
      /:::(\w+)(?:\[([^\]]*)\]|\{title="([^"]*)"\})?\n([\s\S]*?):::/g,
      (_, type, title1, title2, innerContent) => {
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

  generateTSX(componentName, frontmatter, content) {
    console.log('🆕 Using NEW compiler generateTSX method for:', componentName);
    // Process the markdown content to convert custom syntax to JSX
    const processedContent = this.processCustomSyntax(content);
    
    return `import React from 'react';
import { Link } from 'react-router-dom';
import { ExpandableImage } from '@/components/markdown/ExpandableImage';
import { Callout } from '@/components/markdown/Callout';
import { Steps, Step } from '@/components/markdown/Steps';
import { MarkdownCard as Card } from '@/components/markdown/MarkdownCard';
import { CardGroup } from '@/components/markdown/CardGroup';
import Tabs, { TabItem } from '@/components/markdown/Tabs';
import { ComponentBasedMarkdownRenderer } from '@/components/ComponentBasedMarkdownRenderer';

export const frontmatter = ${JSON.stringify(frontmatter, null, 2)};

export default function ${componentName}() {
  const content = ${JSON.stringify(processedContent)};
  
  return (
    <ComponentBasedMarkdownRenderer 
      content={content}
      components={{
        Link,
        ExpandableImage,
        Callout,
        Steps,
        Step,
        Card,
        CardGroup,
        Tabs,
        TabItem
      }}
    />
  );
}

${componentName}.displayName = '${componentName}';
${componentName}.frontmatter = frontmatter;
`;
  }
}

// ES module export
export { MDXCompiler };

// CommonJS export for compatibility
module.exports = { MDXCompiler };
