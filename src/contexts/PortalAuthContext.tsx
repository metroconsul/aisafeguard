import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
  loading: boolean;
  login: (cpf: string, pin: string) => Promise<void>;
  logout: () => void;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

const STORAGE_KEY = "safeguard_portal_employee";

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<PortalEmployee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEmployee(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
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
    setEmployee(emp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emp));
  };

  const logout = () => {
    setEmployee(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <PortalAuthContext.Provider value={{ employee, loading, login, logout }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error("usePortalAuth must be used within PortalAuthProvider");
  return ctx;
}
