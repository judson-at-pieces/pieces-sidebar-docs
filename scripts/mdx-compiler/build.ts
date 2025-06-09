
import path from 'path';
import { MDXCompiler } from './compiler';

const INPUT_DIR = path.join(process.cwd(), 'public/content');
const OUTPUT_DIR = path.join(process.cwd(), 'src/compiled-content');

async function build() {
  const compiler = new MDXCompiler({
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
  const compiler = new MDXCompiler({
    inputDir: INPUT_DIR,
    outputDir: OUTPUT_DIR,
  });

  // Initial build
  await build();

  // Note: Watch functionality would require chokidar
  console.log('📝 Single build completed. For watch mode, install chokidar dependency.');
}

// CLI handling
const command = process.argv[2];

if (command === 'watch') {
  watch();
} else {
  build();
}
