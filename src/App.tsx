
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Admin = lazy(() => import("./pages/Admin"));
const Editor = lazy(() => import("./pages/Editor"));
const DocsLayout = lazy(() => import("./components/DocsLayout"));
const DynamicDocPage = lazy(() => import("./components/DynamicDocPage").then(module => ({ default: module.DynamicDocPage })));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route
                    path="/edit"
                    element={
                      <ProtectedRoute>
                        <Editor />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/" element={<Index />} />
                  <Route
                    path="/docs/*"
                    element={
                      <ProtectedRoute>
                        <DocsLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="*" element={<DynamicDocPage />} />
                  </Route>
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
