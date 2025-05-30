
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-github-event, x-hub-signature-256',
}

async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const expectedHex = 'sha256=' + Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return expectedHex === signature
}

Deno.serve(async (req) => {
  console.log('GitHub webhook called:', req.method, req.url)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const webhookSecret = Deno.env.get('GITHUB_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('GITHUB_WEBHOOK_SECRET not configured')
      return new Response('Webhook secret not configured', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    const signature = req.headers.get('x-hub-signature-256')
    const eventType = req.headers.get('x-github-event')
    const payload = await req.text()

    console.log('Webhook event type:', eventType)
    console.log('Signature present:', !!signature)
    console.log('Payload length:', payload.length)

    if (!signature) {
      console.error('No signature provided')
      return new Response('No signature provided', { 
        status: 401,
        headers: corsHeaders 
      })
    }

    if (!await verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return new Response('Invalid signature', { 
        status: 401,
        headers: corsHeaders 
      })
    }

    const event = JSON.parse(payload)
    console.log('Processing webhook event:', eventType, event.action)

    // Handle installation events
    if (eventType === 'installation') {
      if (event.action === 'created') {
        console.log('App installed by:', event.installation.account.login)
        console.log('Installation ID:', event.installation.id)
        
        // Store installation info
        const { error } = await supabase
          .from('github_installations')
          .insert({
            installation_id: event.installation.id,
            account_login: event.installation.account.login,
            account_type: event.installation.account.type,
            installed_at: new Date().toISOString()
          })

        if (error) {
          console.error('Error storing installation:', error)
          return new Response('Error storing installation', { 
            status: 500,
            headers: corsHeaders 
          })
        }

        console.log('Successfully stored installation')
      } else if (event.action === 'deleted') {
        console.log('App uninstalled from:', event.installation.account.login)
        
        // Remove installation info
        const { error } = await supabase
          .from('github_installations')
          .delete()
          .eq('installation_id', event.installation.id)

        if (error) {
          console.error('Error removing installation:', error)
          return new Response('Error removing installation', { 
            status: 500,
            headers: corsHeaders 
          })
        }

        console.log('Successfully removed installation')
      }
    }

    // Handle installation_repositories events
    if (eventType === 'installation_repositories') {
      console.log('Repository access changed for installation:', event.installation.id)
      // Could update which repositories are available for each installation
    }

    return new Response('Webhook processed successfully', { 
      status: 200,
      headers: corsHeaders 
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(`Internal error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders 
    })
  }
})
