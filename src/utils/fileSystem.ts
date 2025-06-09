
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

// Load content structure from the content-index.json file
export async function loadContentStructure(): Promise<FileNode[]> {
  try {
    console.log('🔍 Loading content structure...');
    
    const response = await fetch('/content-index.json');
    if (!response.ok) {
      console.warn('Failed to load content-index.json, generating structure from compiled content...');
      return await generateStructureFromCompiledContent();
    }
    
    const data = await response.json();
    console.log('📁 Raw content structure loaded:', data);
    
    if (Array.isArray(data)) {
      const structure = buildFileTree(data);
      console.log('🌳 Built file tree with', countFiles(structure), 'total files');
      return structure;
    } else if (data.files && Array.isArray(data.files)) {
      const structure = buildFileTree(data.files);
      console.log('🌳 Built file tree with', countFiles(structure), 'total files');
      return structure;
    } else {
      console.warn('Invalid content-index.json format, falling back to compiled content');
      return await generateStructureFromCompiledContent();
    }
  } catch (error) {
    console.error('Error loading content structure:', error);
    return await generateStructureFromCompiledContent();
  }
}

// Count total files in the structure for debugging
function countFiles(nodes: FileNode[]): number {
  return nodes.reduce((count, node) => {
    if (node.type === 'file') {
      return count + 1;
    } else if (node.children) {
      return count + countFiles(node.children);
    }
    return count;
  }, 0);
}

// Generate structure from compiled content as fallback
async function generateStructureFromCompiledContent(): Promise<FileNode[]> {
  try {
    console.log('🔄 Generating structure from compiled content...');
    
    // Try to dynamically import the compiled content index
    const { contentComponents } = await import('@/compiled-content');
    const paths = Object.keys(contentComponents);
    
    console.log('📄 Found compiled content paths:', paths.length);
    
    const structure = buildFileTree(paths);
    console.log('🌳 Generated structure with', countFiles(structure), 'files');
    return structure;
  } catch (error) {
    console.error('Failed to generate structure from compiled content:', error);
    return [];
  }
}

// Build a hierarchical file tree from flat paths
function buildFileTree(paths: string[]): FileNode[] {
  const root: { [key: string]: any } = {};
  
  // Filter and process paths to ensure they're markdown files
  const markdownPaths = paths
    .filter(path => {
      // Include .md files and paths that look like markdown content
      return path.endsWith('.md') || 
             (!path.includes('.') && path.length > 0) ||
             path.includes('/');
    })
    .map(path => {
      // Clean up duplicate path segments (e.g., /quick-guides/quick-guides -> /quick-guides)
      const cleanPath = path.replace(/\/([^\/]+)\/\1\//g, '/$1/').replace(/\/([^\/]+)\/\1$/, '/$1');
      
      // Ensure path ends with .md if it doesn't have an extension
      if (!cleanPath.includes('.') && !cleanPath.endsWith('/')) {
        return cleanPath + '.md';
      }
      return cleanPath;
    });
  
  console.log('📝 Processing markdown paths:', markdownPaths.length);
  
  for (const fullPath of markdownPaths) {
    // Remove leading slash and split by directory separator
    const cleanPath = fullPath.replace(/^\//, '');
    const parts = cleanPath.split('/');
    let current = root;
    
    // Build nested structure
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      
      if (!current[part]) {
        if (isLast && part.endsWith('.md')) {
          // This is a file
          current[part] = {
            type: 'file' as const,
            name: part,
            path: cleanPath
          };
        } else {
          // This is a directory
          current[part] = {
            type: 'folder' as const,
            name: part,
            path: parts.slice(0, i + 1).join('/'),
            children: {}
          };
        }
      }
      
      if (!isLast) {
        current = current[part].children;
      }
    }
  }
  
  // Convert nested object to FileNode array
  function convertToFileNodes(obj: any): FileNode[] {
    return Object.values(obj).map((item: any) => {
      if (item.type === 'file') {
        return {
          name: item.name,
          path: item.path,
          type: 'file' as const
        };
      } else {
        return {
          name: item.name,
          path: item.path,
          type: 'folder' as const,
          children: item.children ? convertToFileNodes(item.children) : []
        };
      }
    }).sort((a, b) => {
      // Sort folders first, then files, alphabetically
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }
  
  const result = convertToFileNodes(root);
  console.log('✅ File tree built successfully with', countFiles(result), 'files');
  return result;
}

// Check if a file exists in the structure
export function findFileInStructure(structure: FileNode[], targetPath: string): FileNode | null {
  for (const node of structure) {
    if (node.type === 'file' && node.path === targetPath) {
      return node;
    }
    if (node.type === 'folder' && node.children) {
      const found = findFileInStructure(node.children, targetPath);
      if (found) return found;
    }
  }
  return null;
}

// Get all file paths from structure
export function getAllFilePaths(structure: FileNode[]): string[] {
  const paths: string[] = [];
  
  function traverse(nodes: FileNode[]) {
    for (const node of nodes) {
      if (node.type === 'file') {
        paths.push(node.path);
      } else if (node.children) {
        traverse(node.children);
      }
    }
  }
  
  traverse(structure);
  return paths;
}
