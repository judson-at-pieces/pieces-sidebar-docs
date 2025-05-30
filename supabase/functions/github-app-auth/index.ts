
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

  console.log('Processing GitHub App private key...')

  // Clean up the private key format
  let cleanKey = privateKeyPem.trim()
  
  // Replace any \n literals with actual newlines
  cleanKey = cleanKey.replace(/\\n/g, '\n')
  
  // Handle base64 encoded keys
  if (!cleanKey.includes('-----BEGIN')) {
    try {
      cleanKey = atob(cleanKey)
    } catch (e) {
      throw new Error('Invalid base64 private key format')
    }
  }

  // Convert PKCS#1 RSA private key to PKCS#8 format for Web Crypto API
  if (cleanKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    console.log('Converting RSA PKCS#1 key to PKCS#8 format...')
    
    // Extract the base64 content from the RSA key
    const rsaKeyContent = cleanKey
      .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
      .replace(/-----END RSA PRIVATE KEY-----/g, '')
      .replace(/\s/g, '')

    try {
      // Decode the base64 content to get the raw DER data
      const rsaDer = Uint8Array.from(atob(rsaKeyContent), c => c.charCodeAt(0))
      
      // Create PKCS#8 wrapper for RSA private key
      // This is a simplified approach - we'll wrap the RSA key in PKCS#8 format
      const pkcs8Header = new Uint8Array([
        0x30, 0x82, // SEQUENCE, length will be calculated
        0x00, 0x00, // Length placeholder (will be filled)
        0x02, 0x01, 0x00, // INTEGER version
        0x30, 0x0d, // SEQUENCE for AlgorithmIdentifier
        0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, // RSA OID
        0x05, 0x00, // NULL parameters
        0x04, 0x82, // OCTET STRING, length will be calculated
        0x00, 0x00  // Length placeholder for private key
      ])

      // Calculate lengths
      const totalLength = pkcs8Header.length - 4 + rsaDer.length
      const privateKeyLength = rsaDer.length

      // Update length fields
      pkcs8Header[2] = (totalLength >> 8) & 0xff
      pkcs8Header[3] = totalLength & 0xff
      pkcs8Header[pkcs8Header.length - 2] = (privateKeyLength >> 8) & 0xff
      pkcs8Header[pkcs8Header.length - 1] = privateKeyLength & 0xff

      // Combine header and RSA key data
      const pkcs8Der = new Uint8Array(pkcs8Header.length + rsaDer.length)
      pkcs8Der.set(pkcs8Header, 0)
      pkcs8Der.set(rsaDer, pkcs8Header.length)

      // Import the PKCS#8 key
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        pkcs8Der,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      )

      console.log('Successfully imported RSA private key')
      return await createJWTToken(privateKey)

    } catch (conversionError) {
      console.error('PKCS#8 conversion failed:', conversionError)
      
      // Fallback: Try manual JWT creation without Web Crypto API
      console.log('Attempting manual JWT creation...')
      return await createJWTManually(rsaKeyContent)
    }
  } else {
    // Handle PKCS#8 format directly
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

    return await createJWTToken(privateKey)
  }
}

async function createJWTToken(privateKey: CryptoKey): Promise<string> {
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
}

async function createJWTManually(rsaKeyContent: string): Promise<string> {
  // This is a simplified manual approach for debugging
  // In a production environment, you'd want to use a proper RSA library
  console.log('Manual JWT creation not fully implemented - using simplified approach')
  
  // For now, we'll try a different approach using the jose library from esm.sh
  try {
    const { SignJWT, importPKCS8 } = await import('https://esm.sh/jose@5.2.0')
    
    // Try to convert the RSA key to PKCS#8 format manually
    const pkcs8Key = `-----BEGIN PRIVATE KEY-----\n${rsaKeyContent.match(/.{1,64}/g)?.join('\n') || rsaKeyContent}\n-----END PRIVATE KEY-----`
    
    const privateKey = await importPKCS8(pkcs8Key, 'RS256')
    
    const now = Math.floor(Date.now() / 1000)
    
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt(now - 60)
      .setExpirationTime(now + (10 * 60))
      .setIssuer(APP_ID)
      .sign(privateKey)
    
    console.log('JWT created using jose library')
    return jwt
    
  } catch (joseError) {
    console.error('Jose library failed:', joseError)
    throw new Error(`Failed to create JWT: ${joseError.message}`)
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
