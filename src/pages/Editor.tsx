
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EditorLayout } from '@/components/editor/EditorLayout';

export default function Editor() {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect to auth if not signed in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show access denied if not editor or admin
  if (!hasRole('editor') && !hasRole('admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Editor Access Required</h1>
          <p className="text-muted-foreground">
            You need editor permissions to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <EditorLayout />;
}
