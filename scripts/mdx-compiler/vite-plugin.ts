
import type { Plugin } from 'vite';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function mdxCompilerPlugin(): Plugin {
  return {
    name: 'mdx-compiler',
    async buildStart() {
      // Only run in development mode with the environment variable set
      if (process.env.NODE_ENV === 'development' && process.env.VITE_USE_COMPILED_MDX === 'true') {
        console.log('🔄 Building MDX content...');
        try {
          await execAsync('npm run build:mdx');
          console.log('✅ MDX content built successfully');
        } catch (error) {
          console.error('❌ Error building MDX content:', error);
        }
      }
    }
  };
}
