
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export default function AuthCallback() {
  const { user, loading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [redirectAfterDelay, setRedirectAfterDelay] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('AuthCallback page loaded');
      console.log('Current URL:', window.location.href);
      
      // Log URL parameters for debugging
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      console.log('URL search params:', Object.fromEntries(urlParams.entries()));
      console.log('URL hash params:', Object.fromEntries(hashParams.entries()));
      
      const error = hashParams.get('error') || urlParams.get('error');
      const errorDescription = hashParams.get('error_description') || urlParams.get('error_description');
      
      if (error) {
        console.error('OAuth callback error:', error, errorDescription);
        logger.error('OAuth callback error', { error, errorDescription });
        setAuthError(errorDescription || error);
        return;
      }
      
      const accessToken = hashParams.get('access_token') || urlParams.get('access_token');
      if (accessToken) {
        console.log('OAuth callback processing with access token');
        logger.debug('OAuth callback processing', { hasToken: !!accessToken });
        
        // Give AuthContext time to process the OAuth callback
        // If no user after 5 seconds, redirect to auth page
        setTimeout(() => {
          console.log('Auth processing timeout reached, checking user state');
          setRedirectAfterDelay(true);
        }, 5000);
        
        // Clear the hash/search params from URL for security after a short delay
        setTimeout(() => {
          window.history.replaceState(null, '', window.location.pathname);
        }, 1000);
      } else {
        console.log('No access token found in callback');
        setRedirectAfterDelay(true);
      }
    };

    handleAuthCallback();
  }, []);

  // Show processing state while auth is being handled
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div>Completing sign in...</div>
          <div className="text-sm text-muted-foreground mt-2">
            Processing authentication...
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive mb-4">Authentication Error</div>
          <div className="text-sm text-muted-foreground mb-4">{authError}</div>
          <a href="/auth" className="text-primary hover:underline">
            Try signing in again
          </a>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to home
  if (user) {
    console.log('User authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }

  // If no user after processing timeout, redirect to auth
  if (redirectAfterDelay) {
    console.log('No user found after processing, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Show waiting state while processing
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <div>Completing sign in...</div>
        <div className="text-sm text-muted-foreground mt-2">
          Please wait while we process your authentication...
        </div>
      </div>
    </div>
  );
}
