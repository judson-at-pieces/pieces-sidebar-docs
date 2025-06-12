
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AccessCodeForm } from '@/components/auth/AccessCodeForm';
import { GitHubAuthButton } from '@/components/auth/GitHubAuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { AuthErrorBoundary } from '@/components/auth/AuthErrorBoundary';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeInput, passwordRateLimiter, auditLog, getClientIP, getErrorMessage } from '@/utils/security';

function AuthContent() {
  const { user, loading, hasRole, signOut, isSupabaseConfigured } = useAuth();
  const [hasValidCode, setHasValidCode] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [checkingPassword, setCheckingPassword] = useState(false);

  console.log('Auth page state:', { 
    user: !!user, 
    loading, 
    isSupabaseConfigured,
    userEmail: user?.email,
    passwordValid
  });

  // Enhanced password check with security measures
  const checkPassword = async () => {
    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setPasswordError('Password is required');
      return;
    }

    // Rate limiting check
    const clientIP = await getClientIP();
    if (passwordRateLimiter.isRateLimited(clientIP)) {
      setPasswordError('Too many password attempts. Please wait before trying again.');
      auditLog.passwordAttempt(false, clientIP);
      return;
    }

    setCheckingPassword(true);
    setPasswordError('');

    try {
      // Sanitize password input
      const sanitizedPassword = sanitizeInput(trimmedPassword, 100);
      
      const { data, error } = await supabase.functions.invoke('check-password', {
        body: { password: sanitizedPassword }
      });

      if (error) {
        console.error('Password check error:', error);
        setPasswordError(getErrorMessage(error, 'password'));
        auditLog.passwordAttempt(false, clientIP);
        return;
      }

      if (data?.valid) {
        setPasswordValid(true);
        setPasswordError('');
        passwordRateLimiter.reset(clientIP); // Reset rate limit on success
        auditLog.passwordAttempt(true, clientIP);
      } else {
        setPasswordError('Invalid password. Access denied.');
        auditLog.passwordAttempt(false, clientIP);
      }
    } catch (error) {
      console.error('Password check exception:', error);
      setPasswordError(getErrorMessage(error, 'password'));
      auditLog.passwordAttempt(false, clientIP);
    } finally {
      setCheckingPassword(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div>Loading authentication...</div>
        </div>
      </div>
    );
  }

  // If Supabase is not configured, show a message
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Setup Required</CardTitle>
            <CardDescription>
              The authentication system is initializing. Please wait a moment and refresh the page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Refresh Page
            </Button>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is signed in and has proper permissions, show signed-in state
  if (user && (hasRole('admin') || hasRole('editor'))) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Already Signed In</h1>
            <p className="text-muted-foreground mt-2">
              You are currently signed in to the documentation editor
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Signed in as: {user.email}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <Link to="/">
                <Button className="w-full" size="lg">
                  Go to Home
                </Button>
              </Link>
              <Link to="/edit">
                <Button variant="outline" className="w-full" size="lg">
                  Go to Editor
                </Button>
              </Link>
              <Button 
                onClick={signOut}
                variant="ghost"
                className="w-full"
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If user is signed in but doesn't have proper permissions, show access code form
  if (user && !hasRole('admin') && !hasRole('editor')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Documentation Editor</h1>
            <p className="text-muted-foreground mt-2">
              You need editor permissions to access this application
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Signed in as: {user.email}
            </p>
          </div>

          <AccessCodeForm onSuccess={() => {}} />
          
          <div className="text-center space-y-2">
            <Link to="/">
              <Button variant="outline" className="w-full">
                Go to Home
              </Button>
            </Link>
            <Button 
              onClick={signOut}
              variant="ghost"
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show password gate if password hasn't been validated yet
  if (!passwordValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Documentation Editor</h1>
            <p className="text-muted-foreground mt-2">
              Enter the access password to continue
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Access Password Required</CardTitle>
              <CardDescription>
                Please enter the password to access the authentication system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !checkingPassword && password.trim() && checkPassword()}
                  placeholder="Enter password"
                  disabled={checkingPassword}
                  maxLength={100}
                  autoComplete="off"
                />
              </div>
              
              {passwordError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={checkPassword}
                disabled={checkingPassword || !password.trim()}
                className="w-full"
              >
                {checkingPassword ? 'Verifying...' : 'Continue'}
              </Button>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link to="/">
              <Button variant="ghost" className="text-sm">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If user is not signed in and password is valid, show the auth forms
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Documentation Editor</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to edit documentation
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Sign in with your GitHub account to access the documentation editor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GitHubAuthButton />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            {!hasValidCode ? (
              <AccessCodeForm onSuccess={() => setHasValidCode(true)} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Complete Sign Up</CardTitle>
                  <CardDescription>
                    Access code validated. Sign up with your GitHub account to continue.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GitHubAuthButton />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <Link to="/">
            <Button variant="ghost" className="text-sm">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Auth() {
  return (
    <AuthErrorBoundary>
      <AuthContent />
    </AuthErrorBoundary>
  );
}
