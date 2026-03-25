import { createContext, useContext, useEffect, useState, useCallback } from "react";
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

  const fetchEmpresa = useCallback(async (empresaId: string) => {
    const { data } = await supabase
      .from("empresas")
      .select("nome_fantasia, logo_url")
      .eq("id", empresaId)
      .maybeSingle();

    setEmpresa((data as Empresa | null) ?? null);
  }, []);

  const fetchPerfil = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("perfis")
      .select("id, empresa_id, nome_completo, role")
      .eq("id", userId)
      .maybeSingle();

    const p = (data as Perfil | null) ?? null;
    setPerfil(p);

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

    // Listen first, but avoid clearing user on transient null sessions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          setUser(null);
          return;
        }

        if (session?.user) {
          setUser(session.user);
        }
      }
    );

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setPerfil(null);
      setEmpresa(null);
      return;
    }

    void fetchPerfil(user.id);
  }, [user, loading, fetchPerfil]);

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
