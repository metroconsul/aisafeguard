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

  const fetchEmpresa = useCallback((empresaId: string) => {
    supabase
      .from("empresas")
      .select("nome_fantasia, logo_url")
      .eq("id", empresaId)
      .single()
      .then(({ data }) => {
        if (data) setEmpresa(data as Empresa);
      });
  }, []);

  const fetchPerfil = useCallback((userId: string) => {
    supabase
      .from("perfis")
      .select("id, empresa_id, nome_completo, role")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as Perfil | null;
        setPerfil(p);
        if (p?.empresa_id) fetchEmpresa(p.empresa_id);
      });
  }, [fetchEmpresa]);

  const refreshEmpresa = useCallback(() => {
    if (perfil?.empresa_id) fetchEmpresa(perfil.empresa_id);
  }, [perfil?.empresa_id, fetchEmpresa]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchPerfil(currentUser.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchPerfil(currentUser.id);
        } else {
          setPerfil(null);
          setEmpresa(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
