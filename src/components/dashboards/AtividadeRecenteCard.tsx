import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Evento {
  titulo: string;
  descricao: string;
  at: string;
}

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} d`;
}

export function AtividadeRecenteCard() {
  const { perfil } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => {
    if (!perfil?.empresa_id) return;
    const empresaId = perfil.empresa_id;

    Promise.all([
      supabase
        .from("entregas")
        .select("id, created_at, status_assinatura, funcionarios(nome), epis(nome_equipamento)")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("time_entries")
        .select("id, tipo, recorded_at, funcionarios(nome)")
        .eq("empresa_id", empresaId)
        .order("recorded_at", { ascending: false })
        .limit(5),
      supabase
        .from("documents")
        .select("id, title, doc_category, signed_at, signature_status, created_at")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("notificacoes")
        .select("id, titulo, mensagem, created_at")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]).then(([entregas, pontos, docs, notifs]) => {
      const list: Evento[] = [];

      (entregas.data ?? []).forEach((e: any) => {
        list.push({
          titulo: e.status_assinatura === "Assinado" ? "Ficha de EPI assinada" : "Entrega de EPI registrada",
          descricao: `${e.funcionarios?.nome ?? "Colaborador"} • ${e.epis?.nome_equipamento ?? "EPI"}`,
          at: e.created_at,
        });
      });

      (pontos.data ?? []).forEach((p: any) => {
        list.push({
          titulo: "Registro de ponto",
          descricao: `${p.funcionarios?.nome ?? "Colaborador"} • ${p.tipo}`,
          at: p.recorded_at,
        });
      });

      (docs.data ?? []).forEach((d: any) => {
        const assinado = d.signature_status === "assinado" || !!d.signed_at;
        list.push({
          titulo: assinado ? "Documento assinado" : "Documento emitido",
          descricao: `${d.title} • ${d.doc_category}`,
          at: d.signed_at ?? d.created_at,
        });
      });

      (notifs.data ?? []).forEach((n: any) => {
        list.push({ titulo: n.titulo, descricao: n.mensagem, at: n.created_at });
      });

      setEventos(
        list
          .filter((e) => !!e.at)
          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
          .slice(0, 7),
      );
    });
  }, [perfil?.empresa_id]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-base font-semibold text-foreground">Atividade Recente</h3>
      <p className="text-xs text-muted-foreground">Eventos em tempo real</p>

      {eventos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sem eventos registrados ainda.</p>
      ) : (
        <div className="mt-3">
          {eventos.map((e, i) => (
            <div key={i} className="flex gap-3 border-b border-border/30 py-3 last:border-0">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary-400 ring-4 ring-secondary-50" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{e.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">{e.descricao}</p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground/60">{tempoRelativo(e.at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
