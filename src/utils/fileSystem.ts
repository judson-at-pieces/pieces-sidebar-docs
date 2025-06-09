
import fs from 'fs/promises';
import path from 'path';

import { contentComponents } from '@/compiled-content';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export interface ContentIndexItem {
  name: string;
  path: string;
}

export type ContentIndex = ContentIndexItem[];

export interface FileStructure {
  [key: string]: FileNode;
}

export const getFiles = async (dir: string): Promise<string[]> => {
  const files: string[] = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      const results = await getFiles(`${dir}/${item.name}`);
      results.forEach(file => files.push(file));
    } else {
      files.push(`${dir}/${item.name}`);
    }
  }

  return files;
};

export const generateContentIndex = async (directoryPath: string): Promise<ContentIndex> => {
  try {
    const files = await getFiles(directoryPath);

    // Filter out non-markdown files
    const markdownFiles = files.filter(file => file.endsWith('.md'));

    // Convert file paths to URL paths and extract names
    const contentIndex: ContentIndex = markdownFiles.map(file => {
      const filePath = file.slice(directoryPath.length);
      const name = path.basename(filePath, '.md');
      const urlPath = filePath.replace(/\.md$/, '');

      return {
        name: name,
        path: urlPath
      };
    });

    return contentIndex;
  } catch (error) {
    console.error('Error generating content index:', error);
    return [];
  }
};

export const generateFileStructure = (contentIndex: ContentIndex): FileNode[] => {
  const grouped: { [key: string]: ContentIndexItem[] } = {};

  contentIndex.forEach(item => {
    const parts = item.path.split('/').filter(part => part !== '');
    const folder = parts.length > 1 ? parts[0] : 'root';

    if (!grouped[folder]) {
      grouped[folder] = [];
    }

    grouped[folder].push(item);
  });

  return Object.entries(grouped).map(([folder, items]) => ({
    name: folder,
    path: `/${folder}`,
    type: 'folder' as const,
    children: items.map(item => ({
      name: item.name,
      path: item.path,
      type: 'file' as const
    }))
  }));
};

export const loadContentStructure = async (): Promise<FileNode[]> => {
  try {
    // Try to load from content-index.json first
    const response = await fetch('/content-index.json');
    if (response.ok) {
      const data = await response.json();
      const contentIndex: ContentIndex = Object.entries(data).map(([path, info]: [string, any]) => ({
        name: info.title || path.split('/').pop() || 'Unknown',
        path: path
      }));
      return generateFileStructure(contentIndex);
    }
  } catch (error) {
    console.warn('Failed to load content-index.json:', error);
  }

  // Fallback to compiled content
  const contentIndex: ContentIndex = Object.keys(contentComponents).map(path => ({
    name: path.split('/').pop() || 'Unknown',
    path: path
  }));

  return generateFileStructure(contentIndex);
};

export const getAllFilePaths = (structure: FileNode[]): string[] => {
  const paths: string[] = [];
  
  const traverse = (nodes: FileNode[]) => {
    nodes.forEach(node => {
      if (node.type === 'file') {
        paths.push(node.path);
      } else if (node.children) {
        traverse(node.children);
      }
    });
  };
  
  traverse(structure);
  return paths;
};
