import { createClient } from '@supabase/supabase-js';
import { githubAppService } from './githubAppService';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface ContentSyncResult {
  success: boolean;
  message: string;
  filesUpdated: number;
  errors?: string[];
}

export class ContentSyncService {
  private static instance: ContentSyncService;

  public static getInstance(): ContentSyncService {
    if (!ContentSyncService.instance) {
      ContentSyncService.instance = new ContentSyncService();
    }
    return ContentSyncService.instance;
  }

  /**
   * Sync content from the configured GitHub repository to /public/content
   */
  async syncContentFromRepo(): Promise<ContentSyncResult> {
    try {
      console.log('🔄 Starting content sync from GitHub repository...');

      // Get the configured repository
      const repoConfig = await this.getRepoConfig();
      if (!repoConfig) {
        return {
          success: false,
          message: 'No repository configured. Please configure a repository in admin settings.',
          filesUpdated: 0
        };
      }

      // Get GitHub App access token
      const accessToken = await githubAppService.getInstallationToken(repoConfig.installation_id);
      if (!accessToken) {
        return {
          success: false,
          message: 'Failed to get GitHub access token',
          filesUpdated: 0
        };
      }

      // Fetch content from GitHub repo
      const contentFiles = await this.fetchRepositoryContent(
        repoConfig.repo_owner,
        repoConfig.repo_name,
        accessToken
      );

      if (contentFiles.length === 0) {
        return {
          success: false,
          message: 'No content files found in /public/content directory of the repository',
          filesUpdated: 0
        };
      }

      // Write files to local /public/content directory
      const writeResults = await this.writeContentFiles(contentFiles);
      
      // Trigger TSX recompilation
      const compilationResult = await this.triggerContentCompilation();

      return {
        success: true,
        message: `Successfully synced ${contentFiles.length} files and recompiled content`,
        filesUpdated: contentFiles.length,
        errors: compilationResult.success ? undefined : [compilationResult.message]
      };

    } catch (error) {
      console.error('Content sync failed:', error);
      return {
        success: false,
        message: `Content sync failed: ${error.message}`,
        filesUpdated: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Get the configured repository from database
   */
  private async getRepoConfig() {
    const { data, error } = await supabase
      .from('github_config')
      .select('repo_owner, repo_name, installation_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Failed to get repo config:', error);
      return null;
    }

    return data;
  }

  /**
   * Fetch all content files from GitHub repository's /public/content directory
   */
  private async fetchRepositoryContent(
    owner: string,
    repo: string,
    accessToken: string
  ): Promise<Array<{ path: string; content: string }>> {
    const files: Array<{ path: string; content: string }> = [];
    
    try {
      // Recursively fetch all files from /public/content
      await this.fetchDirectoryContents(
        owner,
        repo,
        'public/content',
        accessToken,
        files
      );

      return files;
    } catch (error) {
      console.error('Failed to fetch repository content:', error);
      throw error;
    }
  }

  /**
   * Recursively fetch directory contents from GitHub
   */
  private async fetchDirectoryContents(
    owner: string,
    repo: string,
    path: string,
    accessToken: string,
    files: Array<{ path: string; content: string }>
  ): Promise<void> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Directory ${path} not found in repository`);
        return;
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const contents = await response.json();
    
    for (const item of contents) {
      if (item.type === 'file' && (item.name.endsWith('.md') || item.name.endsWith('.mdx'))) {
        // Fetch file content
        const fileResponse = await fetch(item.download_url);
        const fileContent = await fileResponse.text();
        
        // Remove 'public/content/' prefix to get relative path
        const relativePath = item.path.replace('public/content/', '');
        files.push({
          path: relativePath,
          content: fileContent
        });
      } else if (item.type === 'dir') {
        // Recursively fetch subdirectory
        await this.fetchDirectoryContents(
          owner,
          repo,
          item.path,
          accessToken,
          files
        );
      }
    }
  }

  /**
   * Write content files to local /public/content directory
   */
  private async writeContentFiles(
    files: Array<{ path: string; content: string }>
  ): Promise<void> {
    // This would need to be implemented as a server-side function
    // since we can't write files directly from the browser
    
    // For now, we'll call a Supabase Edge Function to handle this
    const { data, error } = await supabase.functions.invoke('sync-content', {
      body: { files }
    });

    if (error) {
      throw new Error(`Failed to write content files: ${error.message}`);
    }

    console.log(`✅ Successfully wrote ${files.length} content files`);
  }

  /**
   * Trigger TSX content compilation
   */
  private async triggerContentCompilation(): Promise<{ success: boolean; message: string }> {
    try {
      // Call compilation edge function
      const { data, error } = await supabase.functions.invoke('compile-content', {
        body: {}
      });

      if (error) {
        return {
          success: false,
          message: `Compilation failed: ${error.message}`
        };
      }

      console.log('✅ Content compilation completed successfully');
      return {
        success: true,
        message: 'Content compiled successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Compilation error: ${error.message}`
      };
    }
  }

  /**
   * Check if repository has /public/content directory
   */
  async validateRepositoryStructure(
    owner: string,
    repo: string,
    accessToken: string
  ): Promise<{ valid: boolean; message: string }> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/public/content`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        return {
          valid: true,
          message: 'Repository has /public/content directory'
        };
      } else if (response.status === 404) {
        return {
          valid: false,
          message: 'Repository does not have /public/content directory'
        };
      } else {
        return {
          valid: false,
          message: `Failed to check repository structure: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        valid: false,
        message: `Error validating repository: ${error.message}`
      };
    }
  }
}

export const contentSyncService = ContentSyncService.getInstance();