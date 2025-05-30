
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import Index from '@/pages/Index';
import DocsLayout from '@/components/DocsLayout';
import GettingStarted from '@/pages/docs/GettingStarted';
import QuickGuides from '@/pages/docs/QuickGuides';
import Installation from '@/pages/docs/Installation';
import Troubleshooting from '@/pages/docs/Troubleshooting';
import LongTermMemoryGuide from '@/pages/docs/LongTermMemoryGuide';
import NotFound from '@/pages/NotFound';
import Admin from '@/pages/Admin';
import Editor from '@/pages/Editor';
import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';
import MeetPieces from '@/pages/docs/MeetPieces';
import QuickStart from '@/pages/docs/QuickStart';
import Integrations from '@/pages/docs/Integrations';
import ApiReference from '@/pages/docs/ApiReference';
import Examples from '@/pages/docs/Examples';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DynamicDocPage } from '@/components/DynamicDocPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContentPreloader } from '@/hooks/useContentPreloader';

const queryClient = new QueryClient();

function App() {
  // Preload content immediately when app starts
  useContentPreloader();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background font-sans antialiased">
              <Toaster />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                {/* Documentation routes */}
                <Route path="/docs" element={<DocsLayout />}>
                  <Route index element={<Navigate to="/docs/getting-started" replace />} />
                  <Route path="getting-started" element={<GettingStarted />} />
                  <Route path="quick-guides" element={<QuickGuides />} />
                  <Route path="installation" element={<Installation />} />
                  <Route path="troubleshooting" element={<Troubleshooting />} />
                  <Route path="long-term-memory-guide" element={<LongTermMemoryGuide />} />
                  <Route path="meet-pieces" element={<MeetPieces />} />
                  <Route path="quick-start" element={<QuickStart />} />
                  <Route path="integrations" element={<Integrations />} />
                  <Route path="api-reference" element={<ApiReference />} />
                  <Route path="examples" element={<Examples />} />
                  <Route path="*" element={<DynamicDocPage />} />
                </Route>

                {/* Protected routes */}
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } />
                
                <Route path="/editor" element={
                  <ProtectedRoute>
                    <Editor />
                  </ProtectedRoute>
                } />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
