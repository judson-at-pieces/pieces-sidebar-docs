
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { exec } from "child_process";
import { promisify } from "util";
import type { Plugin, ViteDevServer } from "vite";
// import { watch } from "fs"; // Disabled due to platform compatibility
import { mdxCompilerPlugin } from "./scripts/mdx-compiler/vite-plugin";

const execAsync = promisify(exec);

// Plugin to build content index during development and watch for changes
function contentBuilderPlugin(): Plugin {
  return {
    name: 'content-builder',
    async buildStart() {
      // Build content index at startup
      console.log('Building content index...');
      try {
        await execAsync('node scripts/build-content.js');
        console.log('Content index built successfully');
      } catch (error) {
        console.error('Error building content:', error);
      }
    },
    configureServer(_server: ViteDevServer) {
      // File watching disabled to prevent platform compatibility issues
      console.log('File watching disabled. Run `npm run build:mdx` manually after content changes.');
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mdxCompilerPlugin(),
    contentBuilderPlugin(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
