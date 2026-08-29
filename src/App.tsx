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
import KitsEpi from "@/pages/KitsEpi";
import IndicadoresEpi from "@/pages/IndicadoresEpi";

import Setores from "@/pages/Setores";
import Configuracoes from "@/pages/Configuracoes";
import Seguranca from "@/pages/Seguranca";
import GestaoEquipe from "@/pages/GestaoEquipe";
import Assinar from "@/pages/Assinar";
import Login from "@/pages/Login";
import Cadastro from "@/pages/Cadastro";
import TurnosLogin from "@/pages/turnos/TurnosLogin";
import TurnosCadastro from "@/pages/turnos/TurnosCadastro";
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
import PortalEscala from "@/pages/portal/restaurant/PortalEscala";

// Produto de operação de turnos (isolado do Safeguard industrial)
import { RequireProduct } from "@/components/RequireProduct";
import { RequirePortalProduct } from "@/components/portal/RequirePortalProduct";
import { PRODUCT_KEYS } from "@/lib/product-access";
import { RestaurantShell } from "@/components/restaurant/RestaurantShell";
import RestaurantDashboard from "@/pages/restaurant/RestaurantDashboard";
import RestaurantEscala from "@/pages/restaurant/RestaurantEscala";
import RestaurantTurnos from "@/pages/restaurant/RestaurantTurnos";
import RestaurantRegimes from "@/pages/restaurant/RestaurantRegimes";
import RestaurantConformidade from "@/pages/restaurant/RestaurantConformidade";
import RestaurantHistorico from "@/pages/restaurant/RestaurantHistorico";
import RestaurantConfiguracoes from "@/pages/restaurant/RestaurantConfiguracoes";
import DebugNav from "@/pages/DebugNav";
import { NavTelemetry } from "@/components/NavTelemetry";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PortalAuthProvider>
            <NavTelemetry />
            <Routes>
              {/* Diagnóstico de navegação/entitlements */}
              <Route path="/debug/nav" element={<DebugNav />} />
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/site" element={<LandingPage />} />
              <Route path="/sobre-o-portal" element={<SobrePortal />} />
              <Route path="/pitch" element={<Pitch />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/turnos/login" element={<TurnosLogin />} />
              <Route path="/turnos/cadastro" element={<TurnosCadastro />} />
              <Route path="/assinar/:id" element={<Assinar />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/onboarding/:id" element={<OnboardingPublico />} />

              {/* Portal do Colaborador */}
              <Route path="/portal/login" element={<PortalLogin />} />
              <Route path="/portal" element={<PortalLayout />}>
                <Route index element={<PortalHome />} />
                <Route
                  path="epis"
                  element={
                    <RequirePortalProduct product={PRODUCT_KEYS.safeguard}>
                      <PortalEpis />
                    </RequirePortalProduct>
                  }
                />
                <Route
                  path="holerites"
                  element={
                    <RequirePortalProduct product={PRODUCT_KEYS.safeguard}>
                      <PortalHolerites />
                    </RequirePortalProduct>
                  }
                />
                <Route path="pontos" element={<PortalPontos />} />
                <Route
                  path="documentos"
                  element={
                    <RequirePortalProduct product={PRODUCT_KEYS.safeguard}>
                      <PortalDocumentos />
                    </RequirePortalProduct>
                  }
                />
                <Route
                  path="restaurant/escala"
                  element={
                    <RequirePortalProduct product={PRODUCT_KEYS.restaurant}>
                      <PortalEscala />
                    </RequirePortalProduct>
                  }
                />
              </Route>

              {/* Protected admin routes */}
              <Route
                path="/app/*"
                element={
                  <ProtectedRoute>
                    <RequireProduct product={PRODUCT_KEYS.safeguard}>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/nova-entrega" element={<NovaEntrega />} />
                        <Route path="/funcionarios" element={<Funcionarios />} />
                        <Route path="/funcionarios/:id" element={<PerfilFuncionario />} />
                        <Route path="/epis" element={<Epis />} />
                        <Route path="/kits-epi" element={<KitsEpi />} />
                        <Route path="/indicadores-epi" element={<IndicadoresEpi />} />

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
                    </RequireProduct>
                  </ProtectedRoute>
                }
              />

              {/* Operação de turnos — shell separado, protegido por entitlement de produto */}
              <Route
                path="/restaurant"
                element={
                  <ProtectedRoute>
                    <RequireProduct product={PRODUCT_KEYS.restaurant}>
                      <RestaurantShell />
                    </RequireProduct>
                  </ProtectedRoute>
                }
              >
                <Route index element={<RestaurantDashboard />} />
                <Route path="dashboard" element={<RestaurantDashboard />} />
                <Route path="escala" element={<RestaurantEscala />} />
                <Route path="turnos" element={<RestaurantTurnos />} />
                <Route path="regimes" element={<RestaurantRegimes />} />
                <Route path="conformidade" element={<RestaurantConformidade />} />
                <Route path="historico" element={<RestaurantHistorico />} />
                <Route path="configuracoes" element={<RestaurantConfiguracoes />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>

          </PortalAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
