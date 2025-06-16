
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { SecurityProvider } from '@/components/SecurityProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import DocsLayout from '@/components/DocsLayout';
import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';
import Admin from '@/pages/Admin';
import Editor from '@/pages/Editor';
import NotFound from '@/pages/NotFound';
import Sitemap from '@/pages/Sitemap';
import LLMText from '@/pages/LLMText';
import LLMTextFull from '@/pages/LLMTextFull';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 seconds
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ThemeProvider>
          <SecurityProvider>
            <AuthProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<DocsLayout />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/admin/*" element={<Admin />} />
                  <Route path="/edit/*" element={<Editor />} />
                  <Route path="/sitemap.xml" element={<Sitemap />} />
                  <Route path="/llms.txt" element={<LLMText />} />
                  <Route path="/llms-full.txt" element={<LLMTextFull />} />
                  <Route path="/docs/*" element={<DocsLayout />} />
                  <Route path="/*" element={<DocsLayout />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </Router>
            </AuthProvider>
          </SecurityProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
