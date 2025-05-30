
import { useState, useEffect } from 'react';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export function useFileStructure() {
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to load the actual file structure from your content directory
      // This will need to be adjusted based on how your content is served
      const response = await fetch('/api/content-structure');
      
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        try {
          const structure = await response.json();
          setFileStructure(structure);
          return;
        } catch (jsonError) {
          console.warn('Failed to parse JSON from API response:', jsonError);
        }
      }
      
      // Fallback to building structure from known content files
      console.log('No valid API endpoint found, using fallback structure generation');
      const structure = await buildFileStructureFromContent();
      setFileStructure(structure);
      
    } catch (err) {
      console.warn('Failed to load file structure, using mock data:', err);
      // Use the actual file structure that matches your public/content directory
      const mockStructure: FileNode[] = [
        {
          name: 'meet-pieces',
          path: 'meet-pieces',
          type: 'folder',
          children: [
            { name: 'fundamentals.md', path: 'meet-pieces/fundamentals.md', type: 'file' },
            { name: 'linux-installation-guide.md', path: 'meet-pieces/linux-installation-guide.md', type: 'file' },
            { name: 'macos-installation-guide.md', path: 'meet-pieces/macos-installation-guide.md', type: 'file' },
            { name: 'windows-installation-guide.md', path: 'meet-pieces/windows-installation-guide.md', type: 'file' },
            {
              name: 'troubleshooting',
              path: 'meet-pieces/troubleshooting',
              type: 'folder',
              children: [
                { name: 'cross-platform.md', path: 'meet-pieces/troubleshooting/cross-platform.md', type: 'file' },
                { name: 'linux.md', path: 'meet-pieces/troubleshooting/linux.md', type: 'file' },
                { name: 'macos.md', path: 'meet-pieces/troubleshooting/macos.md', type: 'file' },
                { name: 'windows.md', path: 'meet-pieces/troubleshooting/windows.md', type: 'file' }
              ]
            }
          ]
        },
        {
          name: 'obsidian',
          path: 'obsidian',
          type: 'folder',
          children: [
            { name: 'commands.md', path: 'obsidian/commands.md', type: 'file' },
            { name: 'configuration.md', path: 'obsidian/configuration.md', type: 'file' },
            { name: 'get-started.md', path: 'obsidian/get-started.md', type: 'file' },
            { name: 'troubleshooting.md', path: 'obsidian/troubleshooting.md', type: 'file' },
            {
              name: 'copilot',
              path: 'obsidian/copilot',
              type: 'folder',
              children: [
                { name: 'chat.md', path: 'obsidian/copilot/chat.md', type: 'file' },
                { name: 'llm-settings.md', path: 'obsidian/copilot/llm-settings.md', type: 'file' }
              ]
            },
            {
              name: 'drive',
              path: 'obsidian/drive',
              type: 'folder',
              children: [
                { name: 'edit-update.md', path: 'obsidian/drive/edit-update.md', type: 'file' },
                { name: 'save-snippets.md', path: 'obsidian/drive/save-snippets.md', type: 'file' },
                { name: 'search-reuse.md', path: 'obsidian/drive/search-reuse.md', type: 'file' },
                { name: 'sharing.md', path: 'obsidian/drive/sharing.md', type: 'file' }
              ]
            }
          ]
        },
        {
          name: 'large-language-models',
          path: 'large-language-models',
          type: 'folder',
          children: [
            { name: 'cloud-models.md', path: 'large-language-models/cloud-models.md', type: 'file' },
            { name: 'local-models.md', path: 'large-language-models/local-models.md', type: 'file' }
          ]
        },
        {
          name: 'desktop',
          path: 'desktop',
          type: 'folder',
          children: [
            { name: 'download.md', path: 'desktop/download.md', type: 'file' },
            { name: 'onboarding.md', path: 'desktop/onboarding.md', type: 'file' },
            { name: 'navigation.md', path: 'desktop/navigation.md', type: 'file' },
            { name: 'actions.md', path: 'desktop/actions.md', type: 'file' },
            { name: 'configuration.md', path: 'desktop/configuration.md', type: 'file' },
            { name: 'copilot.md', path: 'desktop/copilot.md', type: 'file' },
            { name: 'drive.md', path: 'desktop/drive.md', type: 'file' },
            { name: 'troubleshooting.md', path: 'desktop/troubleshooting.md', type: 'file' },
            { name: 'workstream-activity.md', path: 'desktop/workstream-activity.md', type: 'file' }
          ]
        }
      ];
      
      setFileStructure(mockStructure);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to build file structure from content
  const buildFileStructureFromContent = async (): Promise<FileNode[]> => {
    // This could be enhanced to dynamically discover files
    // For now, return the structure that matches your actual content
    return [];
  };

  useEffect(() => {
    refetch();
  }, []);

  return {
    fileStructure,
    isLoading,
    error,
    refetch
  };
}
