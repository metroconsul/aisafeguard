import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface IntegracaoWhatsApp {
  id: string;
  empresa_id: string;
  nome: string;
  numero: string;
  email: string | null;
  instancia: string | null;
  instance_id: string | null;
  status: string;
  vinculado_em: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegracaoInput {
  nome: string;
  numero: string;
}

function sanitizePhoneNumber(value: string): string {
  return value.replace(/\D/g, "");
}

function sanitizeInstanceName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function generateInstanceId(email: string, numero: string): string {
  const emailPrefix = email.split("@")[0];
  return `${sanitizeInstanceName(emailPrefix)}_${sanitizePhoneNumber(numero)}`;
}

export function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)} ${numbers.slice(2)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4)}`;
  return `${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`;
}

async function callProxy(action: string, instancia: string) {
  const { data, error } = await supabase.functions.invoke("whatsapp-proxy", {
    body: { action, instancia },
  });
  if (error) throw error;
  return data;
}

export function useIntegracoes() {
  const { user, perfil } = useAuth();
  const [integracoes, setIntegracoes] = useState<IntegracaoWhatsApp[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegracoes = useCallback(async () => {
    if (!perfil?.empresa_id) return;
    const { data } = await supabase
      .from("integracao_whatsapp")
      .select("*")
      .eq("empresa_id", perfil.empresa_id)
      .order("created_at", { ascending: false });
    setIntegracoes((data as IntegracaoWhatsApp[]) || []);
    setLoading(false);
  }, [perfil?.empresa_id]);

  useEffect(() => {
    fetchIntegracoes();
  }, [fetchIntegracoes]);

  useEffect(() => {
    const handler = () => fetchIntegracoes();
    window.addEventListener("whatsapp:updated", handler);
    return () => window.removeEventListener("whatsapp:updated", handler);
  }, [fetchIntegracoes]);

  const createIntegracao = useCallback(
    async (input: IntegracaoInput): Promise<IntegracaoWhatsApp | null> => {
      if (!user || !perfil) return null;

      if (integracoes.length >= 3) {
        toast.error("Limite máximo de 3 integrações atingido");
        return null;
      }

      const numeroSanitizado = sanitizePhoneNumber(input.numero);
      if (numeroSanitizado.length < 10) {
        toast.error("Número inválido. Mínimo 10 dígitos.");
        return null;
      }

      const userEmail = user.email || "";
      const instanciaId = generateInstanceId(userEmail, numeroSanitizado);

      try {
        const result = await callProxy("create", instanciaId);

        const { data, error } = await supabase
          .from("integracao_whatsapp")
          .insert({
            empresa_id: perfil.empresa_id,
            nome: input.nome,
            numero: numeroSanitizado,
            email: userEmail || null,
            instancia: result?.instanceName || instanciaId,
            instance_id: result?.instanceId || null,
            status: "pendente",
          })
          .select()
          .single();

        if (error) {
          toast.error("Erro ao criar integração: " + error.message);
          return null;
        }

        setIntegracoes((prev) => [data as IntegracaoWhatsApp, ...prev]);
        toast.success("Integração criada! Escaneie o QR Code para conectar.");
        return data as IntegracaoWhatsApp;
      } catch (err: any) {
        toast.error("Erro ao criar integração: " + (err.message || ""));
        return null;
      }
    },
    [user, perfil, integracoes.length]
  );

  const updateStatus = useCallback(
    async (id: string, status: string, skipEvent = false) => {
      const { data, error } = await supabase
        .from("integracao_whatsapp")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        toast.error("Erro ao atualizar status");
        return null;
      }

      setIntegracoes((prev) => prev.map((i) => (i.id === id ? (data as IntegracaoWhatsApp) : i)));
      if (!skipEvent) {
        window.dispatchEvent(new CustomEvent("whatsapp:updated"));
      }
      return data as IntegracaoWhatsApp;
    },
    []
  );

  const disconnectIntegracao = useCallback(
    async (id: string, instancia: string) => {
      try {
        await callProxy("disconnect", instancia);
        await updateStatus(id, "desconectado");
        toast.success("WhatsApp desconectado");
      } catch {
        toast.error("Erro ao desconectar");
      }
    },
    [updateStatus]
  );

  const deleteIntegracao = useCallback(
    async (id: string, instancia: string | null) => {
      try {
        if (instancia) {
          await callProxy("delete", instancia);
        }
        const { error } = await supabase.from("integracao_whatsapp").delete().eq("id", id);
        if (error) {
          toast.error("Erro ao remover integração");
          return false;
        }
        setIntegracoes((prev) => prev.filter((i) => i.id !== id));
        toast.success("Integração removida");
        window.dispatchEvent(new CustomEvent("whatsapp:updated"));
        return true;
      } catch {
        toast.error("Erro ao remover integração");
        return false;
      }
    },
    []
  );

  const getQRCode = useCallback(async (instancia: string) => {
    try {
      const data = await callProxy("qrcode", instancia);
      if (data?.instance?.state === "open" || data?.instance?.state === "connected") {
        return "ALREADY_CONNECTED";
      }
      return data?.base64 ? `data:image/png;base64,${data.base64}` : null;
    } catch {
      return null;
    }
  }, []);

  const checkConnectionStatus = useCallback(async (instancia: string) => {
    try {
      const data = await callProxy("status", instancia);
      return data?.state === "open" || data?.state === "connected";
    } catch {
      return false;
    }
  }, []);

  return {
    integracoes,
    loading,
    createIntegracao,
    updateStatus,
    disconnectIntegracao,
    deleteIntegracao,
    getQRCode,
    checkConnectionStatus,
    fetchIntegracoes,
  };
}
