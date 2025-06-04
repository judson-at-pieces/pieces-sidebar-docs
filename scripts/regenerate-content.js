
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Regenerating all compiled content...');

try {
  // Run the MDX compiler
  execSync(`npx tsx ${path.join(__dirname, 'mdx-compiler/build.ts')}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ All content regenerated successfully!');
} catch (error) {
  console.error('❌ Content regeneration failed:', error.message);
  process.exit(1);
}
