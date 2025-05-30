import path from 'path';
import { MDXCompiler } from './compiler';
import { MarkdownToTSXCompiler } from './markdown-to-tsx';
import { SimpleMarkdownCompiler } from './simple-compiler';
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
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
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
  console.log('👀 Watching for changes...');
  
  const watcher = chokidar.watch(INPUT_DIR, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
  });

  let isCompiling = false;

  const recompile = async () => {
    if (isCompiling) return;
    
    isCompiling = true;
    console.log('🔄 Changes detected, recompiling...');
    
    try {
      await compiler.compile();
      console.log('✅ Recompilation completed!');
    } catch (error) {
      console.error('❌ Recompilation failed:', error);
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