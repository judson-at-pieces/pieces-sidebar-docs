import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SecurityProvider } from '@/components/SecurityProvider';
import Index from '@/pages/Index';
import DocsLayout from '@/components/DocsLayout';
import GettingStarted from '@/pages/docs/GettingStarted';
import QuickGuides from '@/pages/docs/QuickGuides';
import Installation from '@/pages/docs/Installation';
import Troubleshooting from '@/pages/docs/Troubleshooting';
import LongTermMemoryGuide from '@/pages/docs/LongTermMemoryGuide';
import NotFound from '@/pages/NotFound';
import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';
import Admin from '@/pages/Admin';
import Editor from '@/pages/Editor';
import MeetPieces from '@/pages/docs/MeetPieces';
import QuickStart from '@/pages/docs/QuickStart';
import Integrations from '@/pages/docs/Integrations';
import ApiReference from '@/pages/docs/ApiReference';
import Examples from '@/pages/docs/Examples';
import { CompiledDocPage } from '@/components/CompiledDocPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContentPreloader } from '@/hooks/useContentPreloader';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  // Preload content when app starts
  useContentPreloader();

  return (
    <Router>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Toaster />
        <SonnerToaster />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Protected admin route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireRole="admin">
                <Admin />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected editor route - Editor component handles role checking */}
          <Route 
            path="/edit" 
            element={
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            } 
          />
          
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
            {/* Catch-all for compiled content within docs */}
            <Route path="*" element={<CompiledDocPage />} />
          </Route>

          {/* Direct content routes (without /docs/ prefix) wrapped in DocsLayout */}
          <Route path="/meet-pieces" element={<DocsLayout />}>
            <Route index element={<CompiledDocPage />} />
            <Route path="*" element={<CompiledDocPage />} />
          </Route>
          <Route path="/quick-guides" element={<DocsLayout />}>
            <Route index element={<CompiledDocPage />} />
            <Route path="*" element={<CompiledDocPage />} />
          </Route>
          <Route path="/desktop" element={<DocsLayout />}>
            <Route index element={<CompiledDocPage />} />
            <Route path="*" element={<CompiledDocPage />} />
          </Route>
          <Route path="/core-dependencies" element={<DocsLayout />}>
            <Route index element={<CompiledDocPage />} />
            <Route path="*" element={<CompiledDocPage />} />
          </Route>
          <Route path="/mcp" element={<DocsLayout />}>
            <Route index element={<CompiledDocPage />} />
            <Route path="*" element={<CompiledDocPage />} />
          </Route>
          <Route path="/extensions-plugins" element={<DocsLayout />}>
            <Route index element={<CompiledDocPage />} />
            <Route path="*" element={<CompiledDocPage />} />
          </Route>
          <Route path="/productivity" element={<DocsLayout />}>
            <Route index element={<CompiledDocPage />} />
            <Route path="*" element={<CompiledDocPage />} />
          </Route>
          <Route path="/large-language-models" element={<DocsLayout />}>
            <Route index element={<CompiledDocPage />} />
            <Route path="*" element={<CompiledDocPage />} />
          </Route>
          <Route path="/web-extension" element={<DocsLayout />}>
            <Route index element={<CompiledDocPage />} />
            <Route path="*" element={<CompiledDocPage />} />
          </Route>
          <Route path="/cli" element={<DocsLayout />}>
            <Route index element={<CompiledDocPage />} />
            <Route path="*" element={<CompiledDocPage />} />
          </Route>
          <Route path="/obsidian" element={<DocsLayout />}>
            <Route index element={<CompiledDocPage />} />
            <Route path="*" element={<CompiledDocPage />} />
          </Route>

          {/* 404 - must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <SecurityProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SecurityProvider>
    </ErrorBoundary>
  );
}

export default App;
