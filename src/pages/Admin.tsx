
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminPortal } from '@/components/auth/AdminPortal';
import { ActiveAdminCodes } from '@/components/admin/ActiveAdminCodes';
import { GitHubRepoConfig } from '@/components/admin/GitHubRepoConfig';
import { UserManagement } from '@/components/admin/UserManagement';
import { ContentSyncPanel } from '@/components/admin/ContentSyncPanel';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { AdminTableOfContents } from '@/components/admin/AdminTableOfContents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, UserPlus, Github, ExternalLink, Info, BarChart3 } from 'lucide-react';

export default function Admin() {
  const { user, loading, hasRole, signOut } = useAuth();

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

  // Show access denied if not admin
  if (!hasRole('admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              You need admin permissions to access this page. Contact an administrator if you believe this is an error.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.history.back()} variant="outline" className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold">Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button onClick={signOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Table of Contents - Desktop only */}
          <AdminTableOfContents className="hidden lg:block" />

          {/* Main Content */}
          <main className="flex-1 space-y-8">
            {/* Analytics Dashboard */}
            <section id="analytics-dashboard">
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Analytics Dashboard
                </h2>
                <p className="text-muted-foreground">
                  Monitor user engagement, popular content, and platform performance metrics.
                </p>
              </div>
              
              <AnalyticsDashboard />
            </section>

            {/* GitHub Repository Configuration */}
            <section id="github-integration">
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-2">GitHub Integration</h2>
                <p className="text-muted-foreground">
                  Configure GitHub repository integration for automatic pull request creation when editors save their changes.
                </p>
              </div>
              
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Before configuring a repository, make sure the Pieces Documentation Bot is installed on your repository. 
                  The app is required for creating branches and pull requests automatically.
                </AlertDescription>
              </Alert>

              <div className="grid gap-6 md:grid-cols-2 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Github className="h-5 w-5" />
                      <span>Step 1: Install GitHub App</span>
                    </CardTitle>
                    <CardDescription>
                      Install the Pieces Documentation Bot on your repositories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      The Pieces Documentation Bot must be installed on your repositories to enable automatic branch creation and pull request management.
                    </p>
                    <Button 
                      onClick={() => window.open('https://github.com/apps/piecesdocumentationbot/installations/new', '_blank')}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Install Pieces Documentation Bot
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Github className="h-5 w-5" />
                      <span>Step 2: Configure Repository</span>
                    </CardTitle>
                    <CardDescription>
                      Select and configure your repository for the editor
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      After installing the app, configure which repository should receive pull requests from editor changes.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Configuration options will appear below once the app is installed.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <GitHubRepoConfig />
            </section>

            {/* Content Sync Section */}
            <section id="content-sync">
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-2">Content Synchronization</h2>
                <p className="text-muted-foreground">
                  Manage automatic content syncing from your configured GitHub repository. Content is automatically synced when changes are pushed to the main branch.
                </p>
              </div>
              
              <ContentSyncPanel />
            </section>

            {/* User Management Section */}
            <section id="user-management">
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-2">User Management</h2>
                <p className="text-muted-foreground">
                  Manage user accounts and permissions for the documentation platform.
                </p>
              </div>

              <div className="grid gap-6">
                {/* User Management Component */}
                <UserManagement />

                {/* Access Code Generation */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <UserPlus className="h-5 w-5" />
                        <span>Generate Access Codes</span>
                      </CardTitle>
                      <CardDescription>
                        Create access codes for new editors to join the platform
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AdminPortal />
                      <div className="mt-6">
                        <ActiveAdminCodes />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>Quick Stats</span>
                      </CardTitle>
                      <CardDescription>
                        Key platform metrics at a glance
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Platform Health:</span>
                          <span className="ml-2 font-medium text-green-600">Operational</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Active Features:</span>
                          <span className="ml-2 font-medium">Content Editor, Analytics</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Database Status:</span>
                          <span className="ml-2 font-medium text-green-600">Connected</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
