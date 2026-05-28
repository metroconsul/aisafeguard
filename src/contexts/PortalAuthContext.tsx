import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PortalEmployee {
  id: string;
  nome: string;
  cargo: string;
  setor: string;
  empresa_id: string;
  empresa_nome: string;
  empresa_logo: string | null;
}

interface PortalAuthContextType {
  employee: PortalEmployee | null;
  sessionToken: string | null;
  loading: boolean;
  login: (cpf: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  portalApi: <T = any>(action: string, params?: Record<string, unknown>) => Promise<T>;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

const STORAGE_KEY = "safeguard_portal_employee";
const TOKEN_KEY = "safeguard_portal_token";

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<PortalEmployee | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const tok = localStorage.getItem(TOKEN_KEY);
    if (stored && tok) {
      try {
        setEmployee(JSON.parse(stored));
        setSessionToken(tok);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (cpf: string, pin: string) => {
    const { data, error } = await supabase.functions.invoke("portal-login", {
      body: { cpf, pin },
    });

    if (error || data?.error) {
      throw new Error(data?.error || "Erro ao fazer login");
    }

    const emp = data.employee as PortalEmployee;
    const tok = data.session_token as string;
    setEmployee(emp);
    setSessionToken(tok);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emp));
    localStorage.setItem(TOKEN_KEY, tok);
  };

  const logout = async () => {
    if (sessionToken) {
      try {
        await supabase.functions.invoke("portal-api", {
          body: { action: "logout", portal_token: sessionToken },
        });
      } catch { /* ignora */ }
    }
    setEmployee(null);
    setSessionToken(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  const portalApi = useCallback(async <T,>(action: string, params: Record<string, unknown> = {}): Promise<T> => {
    const tok = sessionToken || localStorage.getItem(TOKEN_KEY);
    if (!tok) throw new Error("Sessão expirada");
    const { data, error } = await supabase.functions.invoke("portal-api", {
      body: { action, portal_token: tok, ...params },
    });
    if (error) throw new Error(error.message || "Erro de rede");
    if (data?.error) {
      // Sessão inválida → faz logout local
      if (data.error === "Sessão inválida" || data.error === "Sessão expirada") {
        setEmployee(null);
        setSessionToken(null);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
      throw new Error(data.error);
    }
    return data as T;
  }, [sessionToken]);

  return (
    <PortalAuthContext.Provider value={{ employee, sessionToken, loading, login, logout, portalApi }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error("usePortalAuth must be used within PortalAuthProvider");
  return ctx;
}
