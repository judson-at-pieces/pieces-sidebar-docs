import { Plugin } from 'vite';
import { spawn } from 'child_process';
import path from 'path';

export function mdxCompilerPlugin(): Plugin {
  let compilerProcess: ReturnType<typeof spawn> | null = null;

  return {
    name: 'vite-mdx-compiler',
    
    buildStart() {
      if (process.env.NODE_ENV === 'development') {
        // Start the MDX compiler in watch mode
        const scriptPath = path.join(__dirname, 'build.ts');
        compilerProcess = spawn('tsx', [scriptPath, 'watch'], {
          stdio: 'inherit',
          shell: true,
        });

        compilerProcess.on('error', (error) => {
          console.error('Failed to start MDX compiler:', error);
        });

        compilerProcess.on('exit', (code) => {
          if (code !== 0) {
            console.error(`MDX compiler exited with code ${code}`);
          }
        });
      }
    },

    buildEnd() {
      // Kill the compiler process when build ends
      if (compilerProcess) {
        compilerProcess.kill();
        compilerProcess = null;
      }
    },

    configureServer(server) {
      // Watch for changes in compiled content
      server.watcher.add(path.join(process.cwd(), 'src/compiled-content'));
      
      // Trigger HMR when compiled content changes
      server.watcher.on('change', (file) => {
        if (file.includes('src/compiled-content')) {
          server.ws.send({
            type: 'full-reload',
            path: '*',
          });
        }
      });
    },
  };
}