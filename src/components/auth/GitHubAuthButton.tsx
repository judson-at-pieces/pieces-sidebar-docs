
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function GitHubAuthButton() {
  const { signInWithGitHub } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      await signInWithGitHub();
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with GitHub');
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
        {loading ? 'Signing in...' : 'Sign in with GitHub'}
      </Button>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
