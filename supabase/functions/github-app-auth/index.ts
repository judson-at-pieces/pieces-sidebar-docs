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

  console.log('Private key length:', privateKeyPem.length)
  console.log('Private key starts with:', privateKeyPem.substring(0, 50))
  console.log('Private key ends with:', privateKeyPem.substring(privateKeyPem.length - 50))

  // Clean up the private key format
  let cleanKey = privateKeyPem.trim()
  
  // Replace any \n literals with actual newlines
  cleanKey = cleanKey.replace(/\\n/g, '\n')
  
  console.log('After replacing \\n, key starts with:', cleanKey.substring(0, 50))
  
  // If it doesn't have PEM headers, assume it's base64 encoded
  if (!cleanKey.includes('-----BEGIN')) {
    console.log('No PEM headers found, treating as base64')
    try {
      // Try to decode from base64
      cleanKey = atob(cleanKey)
      console.log('Successfully decoded from base64')
    } catch (e) {
      console.error('Failed to decode base64 private key:', e)
      throw new Error('Invalid base64 private key format')
    }
  }

  // Handle RSA PRIVATE KEY format by converting to standard format
  if (cleanKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    console.log('Detected RSA private key format, converting...')
    // Extract the base64 content
    const keyContent = cleanKey
      .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
      .replace(/-----END RSA PRIVATE KEY-----/g, '')
      .replace(/\s/g, '')
    
    // For RSA private keys, we need to use a different approach
    // Let's try using the RSA key directly with proper formatting
    cleanKey = `-----BEGIN RSA PRIVATE KEY-----\n${keyContent.match(/.{1,64}/g)?.join('\n') || keyContent}\n-----END RSA PRIVATE KEY-----`
    console.log('Formatted RSA key')
  } else if (!cleanKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('Formatting as PKCS#8 PEM')
    // Remove any existing headers/footers and whitespace
    const keyContent = cleanKey
      .replace(/-----BEGIN[^-]+-----/g, '')
      .replace(/-----END[^-]+-----/g, '')
      .replace(/\s/g, '')
    
    cleanKey = `-----BEGIN PRIVATE KEY-----\n${keyContent.match(/.{1,64}/g)?.join('\n') || keyContent}\n-----END PRIVATE KEY-----`
  }

  console.log('Final key format check - starts with:', cleanKey.substring(0, 50))
  console.log('Final key format check - ends with:', cleanKey.substring(cleanKey.length - 50))

  try {
    // For RSA private keys, we need to use a different import method
    const isRSAKey = cleanKey.includes('-----BEGIN RSA PRIVATE KEY-----')
    
    if (isRSAKey) {
      console.log('Importing RSA private key using alternative method')
      // For RSA keys, we'll use a simpler approach with importKey
      const keyData = new TextEncoder().encode(cleanKey)
      
      // Try importing as 'pkcs1' format (though this might not work in all environments)
      let privateKey;
      try {
        privateKey = await crypto.subtle.importKey(
          'pkcs8', // Try pkcs8 first
          keyData,
          {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256',
          },
          false,
          ['sign']
        )
        console.log('Successfully imported as PKCS#8')
      } catch (pkcs8Error) {
        console.log('PKCS#8 import failed, trying raw format:', pkcs8Error.message)
        
        // Convert RSA key to proper PKCS#8 format
        const keyContent = cleanKey
          .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
          .replace(/-----END RSA PRIVATE KEY-----/g, '')
          .replace(/\s/g, '')
        
        const pkcs8Key = `-----BEGIN PRIVATE KEY-----\n${keyContent.match(/.{1,64}/g)?.join('\n') || keyContent}\n-----END PRIVATE KEY-----`
        console.log('Converted to PKCS#8 format')
        
        const pkcs8Data = new TextEncoder().encode(pkcs8Key)
        privateKey = await crypto.subtle.importKey(
          'pkcs8',
          pkcs8Data,
          {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256',
          },
          false,
          ['sign']
        )
        console.log('Successfully imported converted PKCS#8 key')
      }

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

      // Base64URL encode
      const base64UrlEncode = (obj: any) => {
        return btoa(JSON.stringify(obj))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '')
      }

      const encodedHeader = base64UrlEncode(header)
      const encodedPayload = base64UrlEncode(payload)

      // Create signature
      const signatureData = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
      const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, signatureData)
      
      // Convert signature to base64url
      const signatureArray = new Uint8Array(signature)
      const signatureBase64 = btoa(String.fromCharCode(...signatureArray))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

      console.log('JWT created successfully')
      return `${encodedHeader}.${encodedPayload}.${signatureBase64}`
    } else {
      // Handle PKCS#8 format
      console.log('Importing PKCS#8 private key')
      const keyData = new TextEncoder().encode(cleanKey)
      
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      )

      console.log('Key imported successfully')

      // Create JWT payload
      const now = Math.floor(Date.now() / 1000)
      const payload = {
        iat: now - 60,
        exp: now + (10 * 60),
        iss: APP_ID,
      }

      // Create JWT header
      const header = {
        alg: 'RS256',
        typ: 'JWT',
      }

      // Base64URL encode
      const base64UrlEncode = (obj: any) => {
        return btoa(JSON.stringify(obj))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '')
      }

      const encodedHeader = base64UrlEncode(header)
      const encodedPayload = base64UrlEncode(payload)

      // Create signature
      const signatureData = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
      const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, signatureData)
      
      // Convert signature to base64url
      const signatureArray = new Uint8Array(signature)
      const signatureBase64 = btoa(String.fromCharCode(...signatureArray))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

      console.log('JWT created successfully')
      return `${encodedHeader}.${encodedPayload}.${signatureBase64}`
    }
  } catch (error) {
    console.error('Error creating JWT:', error)
    console.error('Error details:', error.message)
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
