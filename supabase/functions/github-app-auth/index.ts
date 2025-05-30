
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to create JWT token for GitHub App authentication
async function createAppJWT(): Promise<string> {
  const appId = '1341292'
  const privateKeyPem = Deno.env.get('GITHUB_APP_PRIVATE_KEY')
  
  if (!privateKeyPem) {
    throw new Error('GITHUB_APP_PRIVATE_KEY not configured')
  }

  // Convert PEM to CryptoKey
  const pemContents = privateKeyPem
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, '')
    .replace(/-----END RSA PRIVATE KEY-----/, '')
    .replace(/\s/g, '')

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
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
    iss: appId,
    iat: now - 60, // 1 minute ago
    exp: now + (10 * 60), // 10 minutes from now
  }

  // Create JWT header
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  // Encode header and payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/[=]/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/[=]/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  // Create signature
  const signatureInput = `${encodedHeader}.${encodedPayload}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  )
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/[=]/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${signatureInput}.${encodedSignature}`
}

// Function to get installation access token
async function getInstallationToken(installationId: number): Promise<string> {
  const jwt = await createAppJWT()
  
  const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Accept': 'application/vnd.github.v3+json',
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { installationId } = await req.json()
    
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
    console.error('Error getting installation token:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
