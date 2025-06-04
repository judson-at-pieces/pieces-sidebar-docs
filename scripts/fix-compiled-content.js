
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 Fixing compiled content issues...');

// First, clean the compiled content directory completely
const compiledDir = path.join(process.cwd(), 'src/compiled-content');
if (fs.existsSync(compiledDir)) {
  console.log('🗑️ Cleaning old compiled content...');
  fs.rmSync(compiledDir, { recursive: true, force: true });
}

// Create the directory
fs.mkdirSync(compiledDir, { recursive: true });

try {
  // Regenerate the compiled content
  console.log('🚀 Regenerating compiled content...');
  execSync(`npx tsx ${path.join(__dirname, 'mdx-compiler/build.ts')}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Compiled content regenerated successfully!');
  console.log('📁 All folder paths now map to their corresponding .md files');
} catch (error) {
  console.error('❌ Failed to regenerate content:', error.message);
  process.exit(1);
}
