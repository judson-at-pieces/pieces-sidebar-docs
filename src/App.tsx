
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import AuthCallback from "@/pages/AuthCallback";
import GettingStarted from "@/pages/docs/GettingStarted";
import { DynamicDocPage } from "@/components/DynamicDocPage";
import DocsLayout from "@/components/DocsLayout";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/docs/*" element={<DocsLayout />}>
                <Route path="getting-started" element={<GettingStarted />} />
                <Route path="*" element={<DynamicDocPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
