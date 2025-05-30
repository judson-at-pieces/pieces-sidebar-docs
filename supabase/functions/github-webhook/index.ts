
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
  console.log('=== GitHub webhook called ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Headers:', Object.fromEntries(req.headers.entries()))
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Creating Supabase client...')
    // Create Supabase client using service role key for webhook operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const webhookSecret = Deno.env.get('GITHUB_WEBHOOK_SECRET')
    console.log('Webhook secret configured:', !!webhookSecret)
    
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

    console.log('Event type:', eventType)
    console.log('Signature present:', !!signature)
    console.log('Payload length:', payload.length)
    console.log('Payload preview:', payload.substring(0, 200) + '...')

    if (!signature) {
      console.error('No signature provided')
      return new Response('No signature provided', { 
        status: 401,
        headers: corsHeaders 
      })
    }

    console.log('Verifying webhook signature...')
    const isValidSignature = await verifyWebhookSignature(payload, signature, webhookSecret)
    console.log('Signature valid:', isValidSignature)
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature')
      return new Response('Invalid signature', { 
        status: 401,
        headers: corsHeaders 
      })
    }

    console.log('Parsing webhook payload...')
    const event = JSON.parse(payload)
    console.log('Processing webhook event:', eventType, event.action)

    // Handle installation events
    if (eventType === 'installation') {
      if (event.action === 'created') {
        console.log('Processing app installation...')
        console.log('Installed by:', event.installation.account.login)
        console.log('Installation ID:', event.installation.id)
        
        // Store installation info
        const installationData = {
          installation_id: event.installation.id,
          account_login: event.installation.account.login,
          account_type: event.installation.account.type,
          installed_at: new Date().toISOString()
        }
        
        console.log('Inserting installation data:', installationData)
        
        const { error } = await supabase
          .from('github_installations')
          .insert(installationData)

        if (error) {
          console.error('Error storing installation:', error)
          return new Response('Error storing installation', { 
            status: 500,
            headers: corsHeaders 
          })
        }

        console.log('Successfully stored installation')
        
      } else if (event.action === 'deleted') {
        console.log('Processing app uninstallation...')
        console.log('Uninstalled from:', event.installation.account.login)
        console.log('Installation ID:', event.installation.id)
        
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

    // Handle push events for content syncing
    if (eventType === 'push') {
      console.log('Processing push event...')
      console.log('Repository:', event.repository.full_name)
      console.log('Branch:', event.ref)
      console.log('Commits:', event.commits?.length || 0)
      
      // Check if this is the configured repository
      const { data: repoConfig } = await supabase
        .from('github_config')
        .select('repo_owner, repo_name, installation_id')
        .eq('repo_owner', event.repository.owner.login)
        .eq('repo_name', event.repository.name)
        .single()
      
      if (repoConfig && event.ref === 'refs/heads/main') {
        console.log('Push to configured repository main branch - triggering content sync')
        
        // Check if any commits affected the /public/content directory
        const hasContentChanges = event.commits?.some(commit => 
          commit.modified?.some(file => file.startsWith('public/content/')) ||
          commit.added?.some(file => file.startsWith('public/content/')) ||
          commit.removed?.some(file => file.startsWith('public/content/'))
        )
        
        if (hasContentChanges) {
          console.log('Content changes detected - triggering sync and compilation')
          
          // Trigger content sync and compilation
          try {
            // Call the content sync function
            const syncResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-and-compile`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                repository: {
                  owner: event.repository.owner.login,
                  name: event.repository.name,
                  installation_id: repoConfig.installation_id
                },
                webhook_event: {
                  type: 'push',
                  commits: event.commits?.length || 0
                }
              })
            })
            
            if (syncResponse.ok) {
              console.log('Content sync and compilation triggered successfully')
            } else {
              console.error('Failed to trigger content sync:', await syncResponse.text())
            }
          } catch (syncError) {
            console.error('Error triggering content sync:', syncError)
          }
        } else {
          console.log('No content changes detected in push')
        }
      } else {
        console.log('Push not from configured repository or not main branch')
      }
    }

    console.log('Webhook processed successfully')
    return new Response('Webhook processed successfully', { 
      status: 200,
      headers: corsHeaders 
    })
  } catch (error) {
    console.error('Webhook error:', error)
    console.error('Error stack:', error.stack)
    return new Response(`Internal error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders 
    })
  }
})
