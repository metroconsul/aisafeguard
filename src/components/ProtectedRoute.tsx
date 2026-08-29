import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute } from "@/lib/role-access";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, perfil, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading || redirecting) return;

    if (!user) {
      setRedirecting(true);
      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
      return;
    }

    // Check role-based access once perfil is loaded
    if (perfil) {
      const fullPath = location.pathname;
      if (!canAccessRoute(perfil.role, fullPath)) {
        // Redirect to dashboard (always accessible)
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
