import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import NovaEntrega from "@/pages/NovaEntrega";
import Funcionarios from "@/pages/Funcionarios";
import Epis from "@/pages/Epis";
import Integracoes from "@/pages/Integracoes";
import Setores from "@/pages/Setores";
import Configuracoes from "@/pages/Configuracoes";
import Seguranca from "@/pages/Seguranca";
import Assinar from "@/pages/Assinar";
import Login from "@/pages/Login";
import Cadastro from "@/pages/Cadastro";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/assinar/:id" element={<Assinar />} />

            {/* Protected admin routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/nova-entrega" element={<NovaEntrega />} />
                      <Route path="/funcionarios" element={<Funcionarios />} />
                      <Route path="/epis" element={<Epis />} />
                      <Route path="/integracoes" element={<Integracoes />} />
                      <Route path="/setores" element={<Setores />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
