
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export default function AuthCallback() {
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('AuthCallback page loaded');
      console.log('Current URL:', window.location.href);
      
      // Log URL parameters for debugging
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      console.log('URL search params:', Object.fromEntries(urlParams.entries()));
      console.log('URL hash params:', Object.fromEntries(hashParams.entries()));
      
      const accessToken = hashParams.get('access_token') || urlParams.get('access_token');
      const error = hashParams.get('error') || urlParams.get('error');
      const errorDescription = hashParams.get('error_description') || urlParams.get('error_description');
      
      if (error) {
        console.error('OAuth callback error:', error, errorDescription);
        logger.error('OAuth callback error', { error, errorDescription });
      }
      
      if (accessToken) {
        console.log('OAuth callback processing with access token');
        logger.debug('OAuth callback processing', { hasToken: !!accessToken });
        
        // Clear the hash/search params from URL for security
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    handleAuthCallback();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div>Completing sign in...</div>
        </div>
      </div>
    );
  }

  if (user) {
    console.log('User authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('No user found, redirecting to auth');
  return <Navigate to="/auth" replace />;
}
