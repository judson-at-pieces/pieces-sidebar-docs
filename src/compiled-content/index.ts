
// Auto-generated compiled content index
// This file is generated by the MDX compiler - do not edit manually

import React from 'react';

export interface CompiledContentModule {
  default: React.ComponentType;
  frontmatter: {
    title?: string;
    description?: string;
    author?: string;
    lastModified?: string;
    path?: string;
    visibility?: string;
  };
}

// Content registry populated by the build script
const contentRegistry: Record<string, CompiledContentModule> = {};

// Function to get compiled content from registry
export function getCompiledContent(path: string): CompiledContentModule | null {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  console.log('Looking for compiled content at path:', normalizedPath);
  console.log('Available paths:', Object.keys(contentRegistry));
  return contentRegistry[normalizedPath] || null;
}

// Get all available compiled content paths
export function getAllCompiledPaths(): string[] {
  return Object.keys(contentRegistry);
}

// Register content function (used by build script)
export function registerContent(path: string, module: CompiledContentModule): void {
  contentRegistry[path] = module;
}

// For development - populate with some basic content if registry is empty
if (Object.keys(contentRegistry).length === 0) {
  console.log('No compiled content found. The MDX compiler may need to be run.');
  
  // Register the cloud-models content that exists
  const cloudModelsModule = {
    default: () => {
      return React.createElement('div', { className: 'markdown-content' }, 
        React.createElement('h1', null, 'Cloud Models'),
        React.createElement('p', null, '#Testing')
      );
    },
    frontmatter: {
      title: 'Cloud Models',
      path: '/large-language-models/cloud-models',
      visibility: 'PUBLIC'
    }
  } as CompiledContentModule;
  
  registerContent('/large-language-models/cloud-models', cloudModelsModule);

  // Add a sample macOS installation guide content for testing
  const macosInstallationModule = {
    default: () => {
      return React.createElement('div', { className: 'markdown-content' }, 
        React.createElement('h1', null, 'macOS Installation Guide'),
        React.createElement('p', null, 'This is a placeholder for the macOS installation guide.')
      );
    },
    frontmatter: {
      title: 'macOS Installation Guide',
      path: '/meet-pieces/macos-installation-guide',
      visibility: 'PUBLIC'
    }
  } as CompiledContentModule;
  
  registerContent('/meet-pieces/macos-installation-guide', macosInstallationModule);
}

// Export the registry at the end to ensure it's available
export { contentRegistry };
