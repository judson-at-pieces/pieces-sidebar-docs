
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { access_code } = await req.json()

    // Find valid code
    const { data: codeRecord, error: codeError } = await supabaseAdmin
      .from('admin_access_codes')
      .select('*')
      .eq('code', access_code)
      .eq('is_active', true)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (codeError || !codeRecord) {
      return new Response(
        JSON.stringify({ success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current user if authenticated
    const authHeader = req.headers.get('Authorization')
    let currentUserId = null
    
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )
      
      const { data: { user } } = await supabaseClient.auth.getUser()
      currentUserId = user?.id
    }

    // Mark code as used
    await supabaseAdmin
      .from('admin_access_codes')
      .update({ 
        used_by: currentUserId,
        used_at: new Date().toISOString()
      })
      .eq('id', codeRecord.id)

    // If user is authenticated, try to assign role
    if (currentUserId) {
      await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: currentUserId, role: 'editor' })
        .select()
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
