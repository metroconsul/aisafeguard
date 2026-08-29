import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute } from "@/lib/role-access";
import { Loader2 } from "lucide-react";
import { navLog } from "@/lib/nav-telemetry";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, perfil, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading || redirecting) {
      navLog("guard", "ProtectedRoute", "Aguardando auth/redirect", {
        path: location.pathname,
        loading,
        redirecting,
      });
      return;
    }

    if (!user) {
      setRedirecting(true);
      const loginPath = location.pathname === "/restaurant" || location.pathname.startsWith("/restaurant/")
        ? "/turnos/login"
        : "/login";
      navLog("auth", "ProtectedRoute", "Sem usuário autenticado", {
        path: location.pathname,
        loginPath,
      });
      if (location.pathname !== loginPath) {
        navLog("redirect", "ProtectedRoute", `Redirecionando para ${loginPath} (sem sessão)`, {
          from: location.pathname,
          to: loginPath,
          reason: "no_session",
        });
        navigate(loginPath, { replace: true });
      }
      return;
    }

    // O RBAC legado cobre apenas o produto Safeguard (/app/*).
    // Produtos independentes possuem seus próprios guards de acesso.
    if (perfil && (location.pathname === "/app" || location.pathname.startsWith("/app/"))) {
      const fullPath = location.pathname;
      const allowed = canAccessRoute(perfil.role, fullPath);
      navLog("guard", "ProtectedRoute", `RBAC legado (/app) role=${perfil.role} allowed=${allowed}`, {
        path: fullPath,
        role: perfil.role,
        allowed,
      });
      if (!allowed) {
        navLog("redirect", "ProtectedRoute", "Redirecionando para /app (RBAC nega rota)", {
          from: fullPath,
          to: "/app",
          reason: "rbac_denied",
          role: perfil.role,
        });
        navigate("/app", { replace: true });
      }
    }
  }, [loading, user, perfil, redirecting, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
