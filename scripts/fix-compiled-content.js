
const { MDXCompiler } = require('./mdx-compiler/compiler.js');
const path = require('path');

async function fixCompiledContent() {
  console.log('🔧 Fixing compiled content with proper TypeScript...');
  
  const compiler = new MDXCompiler({
    inputDir: path.join(process.cwd(), 'public/content'),
    outputDir: path.join(process.cwd(), 'src/compiled-content')
  });
  
  try {
    await compiler.compile();
    console.log('✅ Compiled content fixed successfully!');
  } catch (error) {
    console.error('❌ Failed to fix compiled content:', error);
    process.exit(1);
  }
}

fixCompiledContent();
