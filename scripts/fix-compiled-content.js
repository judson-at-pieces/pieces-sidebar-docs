
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 Fixing compiled content issues...');

// First, clean the compiled content directory
const compiledDir = path.join(process.cwd(), 'src/compiled-content');
if (fs.existsSync(compiledDir)) {
  fs.rmSync(compiledDir, { recursive: true, force: true });
  console.log('🗑️ Cleaned old compiled content');
}

try {
  // Regenerate the compiled content
  execSync(`npx tsx ${path.join(__dirname, 'mdx-compiler/build.ts')}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Compiled content regenerated successfully!');
} catch (error) {
  console.error('❌ Failed to regenerate content:', error.message);
  process.exit(1);
}
