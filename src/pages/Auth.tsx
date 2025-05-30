
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccessCodeForm } from '@/components/auth/AccessCodeForm';
import { GitHubAuthButton } from '@/components/auth/GitHubAuthButton';
import { AdminPortal } from '@/components/auth/AdminPortal';
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

  if (user && (hasRole('admin') || hasRole('editor'))) {
    return <Navigate to="/" replace />;
  }

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
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4">
            {!hasValidCode ? (
              <AccessCodeForm onSuccess={() => setHasValidCode(true)} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Continue with GitHub</CardTitle>
                  <CardDescription>
                    Access code validated. Sign in with your GitHub account to continue.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GitHubAuthButton />
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="admin">
            <AdminPortal />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
