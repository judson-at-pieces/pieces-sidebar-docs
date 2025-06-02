
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Editor from "./pages/Editor";
import Admin from "./pages/Admin";
import DocsLayout from "./components/DocsLayout";
import { CompiledDocPage } from "./components/CompiledDocPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                
                {/* Authentication routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                {/* Protected routes */}
                <Route path="/edit" element={
                  <ProtectedRoute requireRole="editor">
                    <Editor />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                  <ProtectedRoute requireRole="admin">
                    <Admin />
                  </ProtectedRoute>
                } />
                
                {/* Docs routes with comprehensive coverage */}
                <Route path="/docs" element={<DocsLayout />}>
                  <Route index element={<CompiledDocPage />} />
                  <Route path="*" element={<CompiledDocPage />} />
                </Route>
                
                {/* Direct routes for main content sections */}
                <Route path="/cli" element={<DocsLayout />}>
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
                
                <Route path="/extensions-plugins" element={<DocsLayout />}>
                  <Route index element={<CompiledDocPage />} />
                  <Route path="*" element={<CompiledDocPage />} />
                </Route>
                
                <Route path="/meet-pieces" element={<DocsLayout />}>
                  <Route index element={<CompiledDocPage />} />
                  <Route path="*" element={<CompiledDocPage />} />
                </Route>
                
                <Route path="/large-language-models" element={<DocsLayout />}>
                  <Route index element={<CompiledDocPage />} />
                  <Route path="*" element={<CompiledDocPage />} />
                </Route>
                
                {/* Catch-all for 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
