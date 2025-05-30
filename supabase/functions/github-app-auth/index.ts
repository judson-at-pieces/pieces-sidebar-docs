
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// GitHub App credentials
const APP_ID = '1341292'
const GITHUB_API_BASE = 'https://api.github.com'

async function getJWT(): Promise<string> {
  const privateKeyPem = Deno.env.get('GITHUB_APP_PRIVATE_KEY')
  if (!privateKeyPem) {
    throw new Error('GITHUB_APP_PRIVATE_KEY not configured')
  }

  // Clean up the private key format
  let cleanKey = privateKeyPem
  if (!cleanKey.includes('-----BEGIN')) {
    cleanKey = `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`
  }

  try {
    // Import the private key
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      new TextEncoder().encode(cleanKey),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    )

    // Create JWT payload
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iat: now - 60, // Issued at time, 60 seconds in the past
      exp: now + (10 * 60), // Expires in 10 minutes
      iss: APP_ID, // GitHub App ID
    }

    // Create JWT header
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    }

    // Encode header and payload
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    // Create signature
    const signatureData = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, signatureData)
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
  } catch (error) {
    console.error('Error creating JWT:', error)
    throw new Error(`Failed to create JWT: ${error.message}`)
  }
}

async function getInstallationToken(installationId: number): Promise<string> {
  const jwt = await getJWT()
  
  const response = await fetch(`${GITHUB_API_BASE}/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Pieces-Documentation-Bot/1.0',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('GitHub API error:', response.status, errorText)
    throw new Error(`Failed to get installation token: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data.token
}

async function listInstallations(): Promise<any[]> {
  const jwt = await getJWT()
  
  const response = await fetch(`${GITHUB_API_BASE}/app/installations`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Pieces-Documentation-Bot/1.0',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('GitHub API error:', response.status, errorText)
    throw new Error(`Failed to list installations: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { installationId, action } = await req.json()
    
    if (action === 'list-installations') {
      console.log('Listing installations...')
      const installations = await listInstallations()
      return new Response(JSON.stringify({ installations }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    if (!installationId) {
      return new Response('Installation ID required', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    const token = await getInstallationToken(installationId)

    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in github-app-auth:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
