
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      return new Response('Webhook secret not configured', { status: 500 })
    }

    const signature = req.headers.get('x-hub-signature-256')
    const payload = await req.text()

    if (!signature || !await verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return new Response('Invalid signature', { status: 401 })
    }

    const event = JSON.parse(payload)
    const eventType = req.headers.get('x-github-event')

    console.log('GitHub webhook event:', eventType, event.action)

    // Handle installation events
    if (eventType === 'installation') {
      if (event.action === 'created') {
        // App was installed
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
        }
      } else if (event.action === 'deleted') {
        // App was uninstalled
        console.log('App uninstalled from:', event.installation.account.login)
        
        // Remove installation info
        const { error } = await supabase
          .from('github_installations')
          .delete()
          .eq('installation_id', event.installation.id)

        if (error) {
          console.error('Error removing installation:', error)
        }
      }
    }

    // Handle installation_repositories events
    if (eventType === 'installation_repositories') {
      console.log('Repository access changed for installation:', event.installation.id)
      // Could update which repositories are available for each installation
    }

    return new Response('Webhook processed', { 
      status: 200,
      headers: corsHeaders 
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})
