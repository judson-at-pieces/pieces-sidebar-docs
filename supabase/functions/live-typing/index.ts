
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TypingEvent {
  file_path: string
  user_id: string
  content: string
  cursor_position: number
  timestamp?: string
  method?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const body: TypingEvent = await req.json()
      const { file_path, user_id, content, cursor_position, method } = body

      console.log('Received request:', { method: method || 'POST', file_path, user_id, content_length: content?.length, cursor_position })

      // Handle DELETE method sent in POST body
      if (method === 'DELETE') {
        console.log('Processing DELETE request for typing session')
        
        const { error } = await supabase
          .from('live_typing_sessions')
          .delete()
          .eq('file_path', file_path)
          .eq('user_id', user_id)

        if (error) {
          console.error('Error deleting typing session:', error)
          throw error
        }

        console.log('Typing session deleted successfully')
        return new Response(
          JSON.stringify({ success: true, message: 'Typing session cleaned up' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }

      // Regular POST - update typing session
      console.log('Processing typing event for real-time broadcast')

      // Upsert typing session - create or update
      const { error: upsertError } = await supabase
        .from('live_typing_sessions')
        .upsert({
          file_path,
          user_id,
          content,
          cursor_position,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'file_path,user_id'
        })

      if (upsertError) {
        console.error('Error upserting typing session:', upsertError)
        throw upsertError
      }

      console.log('Typing session updated successfully')
      return new Response(
        JSON.stringify({ success: true, message: 'Typing event processed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    )

  } catch (error) {
    console.error('Error in live-typing function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
