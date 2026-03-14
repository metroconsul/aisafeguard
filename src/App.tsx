import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import NovaEntrega from "@/pages/NovaEntrega";
import Funcionarios from "@/pages/Funcionarios";
import Epis from "@/pages/Epis";
import Assinar from "@/pages/Assinar";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Signature page - no layout (mobile standalone) */}
          <Route path="/assinar/:id" element={<Assinar />} />

          {/* Admin pages with layout */}
          <Route
            path="/*"
            element={
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/nova-entrega" element={<NovaEntrega />} />
                  <Route path="/funcionarios" element={<Funcionarios />} />
                  <Route path="/epis" element={<Epis />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
