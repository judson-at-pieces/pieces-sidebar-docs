
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Enhanced rate limiting with better tracking
const rateLimitMap = new Map<string, { count: number; resetTime: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const SUSPICIOUS_THRESHOLD = 2;

function sanitizeInput(input: string, maxLength: number = 100): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/javascript:/gi, '') // Remove javascript protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data URLs
    .replace(/vbscript:/gi, '') // Remove vbscript protocols
    .substring(0, maxLength); // Limit length
}

function getClientIdentifier(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const userAgent = req.headers.get('user-agent')?.substring(0, 50) || 'unknown';
  
  // Create a more robust identifier using IP and partial user agent
  const ip = forwardedFor?.split(',')[0].trim() || realIP || 'unknown';
  return `${ip}:${userAgent.substring(0, 20)}`;
}

function checkRateLimit(identifier: string): { limited: boolean; suspicious: boolean } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { 
      count: 1, 
      resetTime: now + WINDOW_MS, 
      firstAttempt: now 
    });
    return { limited: false, suspicious: false };
  }

  if (record.count >= MAX_ATTEMPTS) {
    // Clean up old entries to prevent memory leak
    if (rateLimitMap.size > 1000) {
      const cutoff = now - WINDOW_MS;
      for (const [key, value] of rateLimitMap.entries()) {
        if (value.resetTime < cutoff) {
          rateLimitMap.delete(key);
        }
      }
    }
    
    return { limited: true, suspicious: true };
  }

  record.count++;
  const suspicious = record.count >= SUSPICIOUS_THRESHOLD;
  
  return { limited: false, suspicious };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'Method not allowed' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );
  }

  try {
    // Get client identifier for rate limiting
    const clientIdentifier = getClientIdentifier(req);
    
    // Check rate limiting
    const { limited, suspicious } = checkRateLimit(clientIdentifier);
    
    if (limited) {
      console.log(`Rate limited request from: ${clientIdentifier}`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Too many attempts. Please wait before trying again.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429
        }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Invalid JSON in request body:', error);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid request format' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const password = sanitizeInput(body?.password || '', 100);
    
    if (!password) {
      console.log(`Empty password attempt from: ${clientIdentifier}`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Password is required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    // Get the PIECES_PASSWORD from environment
    const expectedPassword = Deno.env.get('PIECES_PASSWORD');
    
    if (!expectedPassword) {
      console.error('PIECES_PASSWORD environment variable not configured');
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Password verification not configured' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
    
    // Check if password matches with timing attack protection
    const isValid = password === expectedPassword;
    
    // Add artificial delay to prevent timing attacks (50-150ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    // Log attempt with appropriate level
    if (isValid) {
      console.log(`Valid password attempt from: ${clientIdentifier}`);
    } else {
      if (suspicious) {
        console.warn(`Suspicious invalid password attempt from: ${clientIdentifier}`);
      } else {
        console.log(`Invalid password attempt from: ${clientIdentifier}`);
      }
    }
    
    return new Response(
      JSON.stringify({ valid: isValid }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('Unexpected error in check-password function:', error);
    
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
})
