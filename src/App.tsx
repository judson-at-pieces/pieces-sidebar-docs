
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { SecurityProvider } from "@/components/SecurityProvider";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Editor from "@/pages/Editor";
import Admin from "@/pages/Admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
    },
  },
});

function App() {
  return (
    <SecurityProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <BrowserRouter>
              <AuthProvider>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/edit" element={<Editor />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </AuthProvider>
            </BrowserRouter>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SecurityProvider>
  );
}

export default App;
