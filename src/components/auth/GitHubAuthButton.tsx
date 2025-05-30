
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authRateLimiter, getErrorMessage } from '@/utils/security';
import { logger } from '@/utils/logger';

export function GitHubAuthButton() {
  const { signInWithGitHub } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    
    const identifier = 'github-auth';

    if (authRateLimiter.isRateLimited(identifier)) {
      setError('Too many authentication attempts. Please try again later.');
      setLoading(false);
      return;
    }

    try {
      console.log('Starting GitHub OAuth sign in...');
      await signInWithGitHub();
      // Don't set loading to false here - the redirect will happen
    } catch (error: any) {
      console.error('GitHub auth error:', error);
      logger.error('GitHub auth button error', { error: error.message });
      setError(getErrorMessage(error, 'auth'));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleSignIn} 
        disabled={loading}
        className="w-full"
        size="lg"
      >
        <Github className="mr-2 h-5 w-5" />
        {loading ? 'Redirecting to GitHub...' : 'Sign in with GitHub'}
      </Button>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
