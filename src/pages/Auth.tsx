
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccessCodeForm } from '@/components/auth/AccessCodeForm';
import { GitHubAuthButton } from '@/components/auth/GitHubAuthButton';
import { useAuth } from '@/contexts/AuthContext';

export default function Auth() {
  const { user, loading, hasRole } = useAuth();
  const [hasValidCode, setHasValidCode] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // If user is signed in and has proper permissions, redirect to home
  if (user && (hasRole('admin') || hasRole('editor'))) {
    return <Navigate to="/" replace />;
  }

  // If user is signed in but doesn't have proper permissions, show access required message
  if (user && !hasRole('admin') && !hasRole('editor')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Required</CardTitle>
            <CardDescription>
              You need editor permissions to access this application. Please contact an administrator.
            </CardDescription>
          </CardHeader>
        </Card>
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
                  Already have an account? Sign in with your GitHub account.
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
      </div>
    </div>
  );
}
