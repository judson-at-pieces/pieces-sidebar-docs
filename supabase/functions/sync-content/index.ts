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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get the current user and verify they have admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has admin role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { files }: { files: ContentFile[] } = await req.json()

    if (!files || !Array.isArray(files)) {
      return new Response(
        JSON.stringify({ error: 'Invalid files array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📝 Writing ${files.length} content files...`)

    // Write files to the filesystem
    for (const file of files) {
      const filePath = `/tmp/public/content/${file.path}`
      
      // Ensure directory exists
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'))
      try {
        await Deno.mkdir(dirPath, { recursive: true })
      } catch (error) {
        // Directory might already exist
        if (!(error instanceof Deno.errors.AlreadyExists)) {
          throw error
        }
      }

      // Write file content
      await Deno.writeTextFile(filePath, file.content)
      console.log(`✅ Wrote: ${file.path}`)
    }

    // Copy files to actual public/content directory (this would need proper setup)
    // For now, we'll return success and handle this through the build system
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully wrote ${files.length} files`,
        filesWritten: files.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Sync content error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})