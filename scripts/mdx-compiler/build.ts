
import path from 'path';
import { SimpleMarkdownCompiler } from './simple-compiler.js';
import chokidar from 'chokidar';

const INPUT_DIR = path.join(process.cwd(), 'public/content');
const OUTPUT_DIR = path.join(process.cwd(), 'src/compiled-content');

async function build() {
  const compiler = new SimpleMarkdownCompiler({
    inputDir: INPUT_DIR,
    outputDir: OUTPUT_DIR,
  });

  try {
    await compiler.compile();
    console.log('✅ MDX compilation completed successfully!');
  } catch (error) {
    console.error('❌ MDX compilation failed:', error);
    process.exit(1);
  }
}

async function watch() {
  const compiler = new SimpleMarkdownCompiler({
    inputDir: INPUT_DIR,
    outputDir: OUTPUT_DIR,
  });

  // Initial build
  await build();

  // Watch for changes
  console.log('👀 Watching for markdown changes...');
  
  const watcher = chokidar.watch(INPUT_DIR, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
  });

  let isCompiling = false;

  const recompile = async () => {
    if (isCompiling) return;
    
    isCompiling = true;
    console.log('🔄 Markdown changes detected, recompiling...');
    
    try {
      await compiler.compile();
      console.log('✅ MDX recompilation completed!');
    } catch (error) {
      console.error('❌ MDX recompilation failed:', error);
    }
    
    isCompiling = false;
  };

  watcher
    .on('add', recompile)
    .on('change', recompile)
    .on('unlink', recompile);
}

// CLI handling
const command = process.argv[2];

if (command === 'watch') {
  watch();
} else {
  build();
}
