
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
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
