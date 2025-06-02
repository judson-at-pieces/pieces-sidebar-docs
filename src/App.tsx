
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import DocsLayout from "./components/DocsLayout";
import { CompiledDocPage } from "./components/CompiledDocPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/docs" element={<DocsLayout />}>
                <Route index element={<CompiledDocPage />} />
                <Route path="*" element={<CompiledDocPage />} />
              </Route>
              {/* Direct route for CLI page */}
              <Route path="/cli" element={<DocsLayout />}>
                <Route index element={<CompiledDocPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
