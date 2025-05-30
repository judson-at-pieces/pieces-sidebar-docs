
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AccessCodeForm } from '@/components/auth/AccessCodeForm';
import { GitHubAuthButton } from '@/components/auth/GitHubAuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { AuthErrorBoundary } from '@/components/auth/AuthErrorBoundary';
import { Link } from 'react-router-dom';

function AuthContent() {
  const { user, loading, hasRole, signOut, isSupabaseConfigured } = useAuth();
  const [hasValidCode, setHasValidCode] = useState(false);

  console.log('Auth page state:', { 
    user: !!user, 
    loading, 
    isSupabaseConfigured,
    userEmail: user?.email 
  });

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

  // If user is not signed in, show the auth forms
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
