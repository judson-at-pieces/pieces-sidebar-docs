
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { sanitizeInput, isRateLimited, getCorsHeaders } from '../_shared/security.ts'

const corsHeaders = getCorsHeaders();

// Rate limiting storage with enhanced security
const rateLimitMap = new Map<string, { count: number; resetTime: number; suspicious: boolean }>();
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(identifier: string): { limited: boolean; suspicious: boolean } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + WINDOW_MS, suspicious: false });
    return { limited: false, suspicious: false };
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.suspicious = true;
    return { limited: true, suspicious: true };
  }

  record.count++;
  return { limited: false, suspicious: record.count > 1 };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client identifier for rate limiting with enhanced tracking
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    
    const userAgent = req.headers.get('user-agent')?.substring(0, 100) || 'unknown';
    
    // Check rate limiting with suspicious activity detection
    const { limited, suspicious } = checkRateLimit(clientIP);
    
    if (limited) {
      console.log('Rate limited request from:', clientIP, 'suspicious:', suspicious);
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

    const body = await req.json();
    const password = sanitizeInput(body?.password || '', 100);
    
    console.log('Password check request received from:', clientIP, 'suspicious:', suspicious);
    
    if (!password) {
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
      console.error('PIECES_PASSWORD not configured');
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
    
    // Add artificial delay to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    console.log('Password validation result:', isValid, 'for IP:', clientIP, 'userAgent:', userAgent);
    
    // Enhanced security logging
    if (!isValid) {
      console.warn('Invalid password attempt from:', clientIP, 'suspicious:', suspicious, 'userAgent:', userAgent);
    }
    
    return new Response(
      JSON.stringify({ valid: isValid }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('Error in check-password function:', error);
    
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
