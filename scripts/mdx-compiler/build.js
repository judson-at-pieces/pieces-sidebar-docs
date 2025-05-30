
const { execSync } = require('child_process');
const path = require('path');

// Run the TypeScript build script using tsx
try {
  execSync(`npx tsx ${path.join(__dirname, 'build.ts')}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
