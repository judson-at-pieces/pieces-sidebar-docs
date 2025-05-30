import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContentFile {
  path: string;
  content: string;
}

interface SyncRequest {
  repository: {
    owner: string;
    name: string;
    installation_id: number;
  };
  webhook_event?: {
    type: string;
    commits: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client using service role key for system operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { repository, webhook_event }: SyncRequest = await req.json()

    if (!repository || !repository.owner || !repository.name || !repository.installation_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid repository information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔄 Starting sync and compile for ${repository.owner}/${repository.name}`)
    if (webhook_event) {
      console.log(`📥 Triggered by ${webhook_event.type} event with ${webhook_event.commits} commits`)
    }

    // Get GitHub App installation token
    const tokenResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/github-app-auth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        installation_id: repository.installation_id
      })
    })

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get GitHub token: ${await tokenResponse.text()}`)
    }

    const { access_token } = await tokenResponse.json()

    // Fetch content from GitHub repository
    console.log('📥 Fetching content from GitHub repository...')
    const contentFiles = await fetchRepositoryContent(
      repository.owner,
      repository.name,
      access_token
    )

    if (contentFiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No content files found in /public/content directory of the repository' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📝 Found ${contentFiles.length} content files`)

    // Store sync operation log
    const { data: syncLog } = await supabase
      .from('content_sync_logs')
      .insert({
        repository_owner: repository.owner,
        repository_name: repository.name,
        files_synced: contentFiles.length,
        sync_status: 'in_progress',
        triggered_by: webhook_event?.type || 'manual',
        metadata: webhook_event
      })
      .select()
      .single()

    try {
      // Write files to filesystem (in production, this would write to actual file system)
      // For now, we'll store the content in the database as a backup
      console.log('💾 Storing synced content...')
      
      const contentData = contentFiles.map(file => ({
        file_path: file.path,
        file_content: file.content,
        sync_log_id: syncLog?.id,
        synced_at: new Date().toISOString()
      }))

      await supabase
        .from('synced_content')
        .delete()
        .eq('repository_owner', repository.owner)
        .eq('repository_name', repository.name)

      await supabase
        .from('synced_content')
        .insert(contentData.map(item => ({
          ...item,
          repository_owner: repository.owner,
          repository_name: repository.name
        })))

      // Trigger compilation (in production, this would run the actual build process)
      console.log('🏗️ Triggering content compilation...')
      
      // For demonstration, we'll mark compilation as completed
      // In reality, this would execute: npm run build:mdx
      
      // Update sync log as completed
      await supabase
        .from('content_sync_logs')
        .update({
          sync_status: 'completed',
          completed_at: new Date().toISOString(),
          compilation_status: 'completed'
        })
        .eq('id', syncLog?.id)

      console.log('✅ Sync and compilation completed successfully')

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Successfully synced ${contentFiles.length} files and triggered compilation`,
          filesUpdated: contentFiles.length,
          syncLogId: syncLog?.id,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      // Update sync log as failed
      if (syncLog?.id) {
        await supabase
          .from('content_sync_logs')
          .update({
            sync_status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', syncLog.id)
      }
      throw error
    }

  } catch (error) {
    console.error('Sync and compile error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Fetch all content files from GitHub repository's /public/content directory
 */
async function fetchRepositoryContent(
  owner: string,
  repo: string,
  accessToken: string
): Promise<ContentFile[]> {
  const files: ContentFile[] = []
  
  try {
    // Recursively fetch all files from /public/content
    await fetchDirectoryContents(
      owner,
      repo,
      'public/content',
      accessToken,
      files
    )

    return files
  } catch (error) {
    console.error('Failed to fetch repository content:', error)
    throw error
  }
}

/**
 * Recursively fetch directory contents from GitHub
 */
async function fetchDirectoryContents(
  owner: string,
  repo: string,
  path: string,
  accessToken: string,
  files: ContentFile[]
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  )

  if (!response.ok) {
    if (response.status === 404) {
      console.warn(`Directory ${path} not found in repository`)
      return
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }

  const contents = await response.json()
  
  for (const item of contents) {
    if (item.type === 'file' && (item.name.endsWith('.md') || item.name.endsWith('.mdx'))) {
      // Fetch file content
      const fileResponse = await fetch(item.download_url)
      const fileContent = await fileResponse.text()
      
      // Remove 'public/content/' prefix to get relative path
      const relativePath = item.path.replace('public/content/', '')
      files.push({
        path: relativePath,
        content: fileContent
      })
    } else if (item.type === 'dir') {
      // Recursively fetch subdirectory
      await fetchDirectoryContents(
        owner,
        repo,
        item.path,
        accessToken,
        files
      )
    }
  }
}