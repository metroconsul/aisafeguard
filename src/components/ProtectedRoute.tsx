import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionCheckDone, setSessionCheckDone] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (user) {
      setHasSession(true);
      setSessionCheckDone(true);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setHasSession(!!session?.user);
      setSessionCheckDone(true);
    });

    return () => {
      mounted = false;
    };
  }, [user, loading]);

  useEffect(() => {
    if (loading || !sessionCheckDone || user || hasSession) return;
    if (location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  }, [loading, sessionCheckDone, user, hasSession, location.pathname, navigate]);

  if (loading || !sessionCheckDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !hasSession) {
    return null;
  }

  return <>{children}</>;
}
