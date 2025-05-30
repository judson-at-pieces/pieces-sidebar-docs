
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
    
    console.log('Received access code:', access_code)

    // Find valid code
    const { data: codeRecord, error: codeError } = await supabaseAdmin
      .from('admin_access_codes')
      .select('*')
      .eq('code', access_code)
      .eq('is_active', true)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    console.log('Code query result:', { codeRecord, codeError })

    if (codeError || !codeRecord) {
      console.log('Code not found or invalid')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired access code',
          debug: { codeError: codeError?.message, foundRecord: !!codeRecord }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current user if authenticated using the regular client with the auth header
    const authHeader = req.headers.get('Authorization')
    let currentUserId = null
    
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      )
      
      // Set the auth header for this request
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
        authHeader.replace('Bearer ', '')
      )
      
      if (user && !userError) {
        currentUserId = user.id
        console.log('Current user ID:', currentUserId)
      } else {
        console.log('Error getting user:', userError?.message)
      }
    }

    // Mark code as used
    const { error: updateError } = await supabaseAdmin
      .from('admin_access_codes')
      .update({ 
        used_by: currentUserId,
        used_at: new Date().toISOString()
      })
      .eq('id', codeRecord.id)

    if (updateError) {
      console.error('Error updating code:', updateError)
    }

    // If user is authenticated, try to assign role
    if (currentUserId) {
      console.log('Attempting to assign editor role to user:', currentUserId)
      
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: currentUserId, role: 'editor' })
        
      if (roleError) {
        console.log('Role assignment error:', roleError.message)
        // Check if it's a duplicate key error (user already has the role)
        if (!roleError.message.includes('duplicate key')) {
          console.error('Unexpected role assignment error:', roleError)
        }
      } else {
        console.log('Successfully assigned editor role to user')
      }
    } else {
      console.log('No authenticated user found, skipping role assignment')
    }

    console.log('Success! Code validated.')
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Server error',
        debug: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
