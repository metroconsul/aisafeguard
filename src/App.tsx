import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { PortalAuthProvider } from "@/contexts/PortalAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { PortalLayout } from "@/components/portal/PortalLayout";
import LandingPage from "@/pages/LandingPage";
import SobrePortal from "@/pages/SobrePortal";
import Dashboard from "@/pages/Dashboard";
import NovaEntrega from "@/pages/NovaEntrega";
import Funcionarios from "@/pages/Funcionarios";
import PerfilFuncionario from "@/pages/PerfilFuncionario";
import Epis from "@/pages/Epis";
import Integracoes from "@/pages/Integracoes";
import Setores from "@/pages/Setores";
import Configuracoes from "@/pages/Configuracoes";
import Seguranca from "@/pages/Seguranca";
import GestaoEquipe from "@/pages/GestaoEquipe";
import Assinar from "@/pages/Assinar";
import Login from "@/pages/Login";
import Cadastro from "@/pages/Cadastro";
import CofreEmpresa from "@/pages/CofreEmpresa";
import Treinamentos from "@/pages/Treinamentos";
import Holerites from "@/pages/Holerites";
import Unsubscribe from "@/pages/Unsubscribe";
import Admissoes from "@/pages/Admissoes";
import CartaoPonto from "@/pages/CartaoPonto";
import OnboardingPublico from "@/pages/OnboardingPublico";
import Pitch from "@/pages/Pitch";
import NotFound from "@/pages/NotFound";

// Portal pages
import PortalLogin from "@/pages/portal/PortalLogin";
import PortalHome from "@/pages/portal/PortalHome";
import PortalEpis from "@/pages/portal/PortalEpis";
import PortalHolerites from "@/pages/portal/PortalHolerites";
import PortalPontos from "@/pages/portal/PortalPontos";
import PortalDocumentos from "@/pages/portal/PortalDocumentos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PortalAuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/site" element={<LandingPage />} />
              <Route path="/sobre-o-portal" element={<SobrePortal />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/assinar/:id" element={<Assinar />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/onboarding/:id" element={<OnboardingPublico />} />

              {/* Portal do Colaborador */}
              <Route path="/portal/login" element={<PortalLogin />} />
              <Route path="/portal" element={<PortalLayout />}>
                <Route index element={<PortalHome />} />
                <Route path="epis" element={<PortalEpis />} />
                <Route path="holerites" element={<PortalHolerites />} />
                <Route path="pontos" element={<PortalPontos />} />
                <Route path="documentos" element={<PortalDocumentos />} />
              </Route>

              {/* Protected admin routes */}
              <Route
                path="/app/*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/nova-entrega" element={<NovaEntrega />} />
                        <Route path="/funcionarios" element={<Funcionarios />} />
                        <Route path="/funcionarios/:id" element={<PerfilFuncionario />} />
                        <Route path="/epis" element={<Epis />} />
                        <Route path="/integracoes" element={<Integracoes />} />
                        <Route path="/setores" element={<Setores />} />
                        <Route path="/configuracoes" element={<Configuracoes />} />
                        <Route path="/equipe" element={<GestaoEquipe />} />
                        <Route path="/seguranca" element={<Seguranca />} />
                        <Route path="/documentos" element={<CofreEmpresa />} />
                        <Route path="/treinamentos" element={<Treinamentos />} />
                        <Route path="/holerites" element={<Holerites />} />
                        <Route path="/admissoes" element={<Admissoes />} />
                        <Route path="/pontos" element={<CartaoPonto />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </PortalAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
