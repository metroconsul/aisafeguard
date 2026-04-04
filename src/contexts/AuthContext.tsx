import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Perfil {
  id: string;
  empresa_id: string;
  nome_completo: string;
  role: string;
}

interface Empresa {
  nome_fantasia: string;
  logo_url: string | null;
}

interface AuthContextType {
  user: User | null;
  perfil: Perfil | null;
  empresa: Empresa | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshEmpresa: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  perfil: null,
  empresa: null,
  loading: true,
  signOut: async () => {},
  refreshEmpresa: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  const fetchEmpresa = useCallback(async (empresaId: string) => {
    const { data, error } = await supabase
      .from("empresas")
      .select("nome_fantasia, logo_url")
      .eq("id", empresaId)
      .maybeSingle();

    if (error) {
      setEmpresa(null);
      return;
    }

    setEmpresa((data as Empresa | null) ?? null);
  }, []);

  const fetchPerfil = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("perfis")
      .select("id, empresa_id, nome_completo, role, status")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      setPerfil(null);
      setEmpresa(null);
      return;
    }

    const p = (data as (Perfil & { status?: string }) | null) ?? null;

    // Auto-activate user on first login if status is pending
    if (p && p.status !== "ativo") {
      await supabase
        .from("perfis")
        .update({ status: "ativo" })
        .eq("id", userId);
    }

    setPerfil(p ? { id: p.id, empresa_id: p.empresa_id, nome_completo: p.nome_completo, role: p.role } : null);

    if (p?.empresa_id) {
      await fetchEmpresa(p.empresa_id);
    } else {
      setEmpresa(null);
    }
  }, [fetchEmpresa]);

  const refreshEmpresa = useCallback(() => {
    if (perfil?.empresa_id) {
      void fetchEmpresa(perfil.empresa_id);
    }
  }, [perfil?.empresa_id, fetchEmpresa]);

  useEffect(() => {
    let mounted = true;

    // Listen first to avoid missing auth events during bootstrap
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          setUser(null);
          setAuthReady(true);
          return;
        }

        if (event === "TOKEN_REFRESHED") {
          setAuthReady(true);
          return;
        }

        const nextUser = session?.user ?? null;
        setUser((prev) => (prev?.id === nextUser?.id ? prev : nextUser));
        setAuthReady(true);
      }
    );

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        const nextUser = session?.user ?? null;
        setUser((prev) => (prev?.id === nextUser?.id ? prev : nextUser));
        setAuthReady(true);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      setPerfil(null);
      setEmpresa(null);
      lastLoadedUserIdRef.current = null;
      setLoading(false);
      return;
    }

    if (lastLoadedUserIdRef.current === user.id && perfil?.id === user.id) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    void fetchPerfil(user.id).finally(() => {
      if (!mounted) return;
      lastLoadedUserIdRef.current = user.id;
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [authReady, user, fetchPerfil, perfil?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPerfil(null);
    setEmpresa(null);
  };

  return (
    <AuthContext.Provider value={{ user, perfil, empresa, loading, signOut, refreshEmpresa }}>
      {children}
    </AuthContext.Provider>
  );
}
