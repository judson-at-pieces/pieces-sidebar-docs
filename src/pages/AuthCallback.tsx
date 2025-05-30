
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export default function AuthCallback() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        logger.debug('OAuth callback processing', { hasToken: !!accessToken });
        
        // Clear the hash from URL for security - prevents token exposure in browser history
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    handleAuthCallback();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Completing sign in...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to="/auth" replace />;
}
