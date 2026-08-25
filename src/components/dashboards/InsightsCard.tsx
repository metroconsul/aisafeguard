import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, FileSignature, GraduationCap, PackageOpen, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Insight {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
}

export function InsightsCard() {
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    if (!perfil?.empresa_id) return;
    const empresaId = perfil.empresa_id;
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const in30Str = in30.toISOString().split("T")[0];

    Promise.all([
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .in("doc_category", ["aso_exames", "aso"])
        .not("expiration_date", "is", null)
        .lte("expiration_date", in30Str),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .eq("doc_category", "treinamento_nr")
        .not("expiration_date", "is", null)
        .lte("expiration_date", in30Str),
      supabase
        .from("entregas")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .neq("status_assinatura", "Assinado"),
      supabase
        .from("epis")
        .select("id, nome_equipamento, quantidade_estoque")
        .eq("empresa_id", empresaId)
        .lte("quantidade_estoque", 5)
        .order("quantidade_estoque", { ascending: true })
        .limit(3),
    ]).then(([asos, nrs, entregas, epis]) => {
      const list: Insight[] = [];

      if ((asos.count ?? 0) > 0) {
        list.push({
          icon: AlertTriangle,
          title: `${asos.count} ASO(s) vencendo em 30 dias`,
          description: "Exames ocupacionais próximos do vencimento exigem reagendamento para manter a conformidade.",
          to: "/app/documentos",
        });
      }
      if ((nrs.count ?? 0) > 0) {
        list.push({
          icon: GraduationCap,
          title: `${nrs.count} treinamento(s) NR expirando`,
          description: "Reciclagens de NR precisam ser programadas antes do vencimento do certificado.",
          to: "/app/treinamentos",
        });
      }
      if ((entregas.count ?? 0) > 0) {
        list.push({
          icon: FileSignature,
          title: `${entregas.count} entrega(s) sem assinatura`,
          description: "Fichas de EPI aguardando assinatura digital do colaborador no portal.",
          to: "/app/nova-entrega",
        });
      }
      (epis.data ?? []).forEach((epi) => {
        list.push({
          icon: PackageOpen,
          title: `Estoque baixo: ${epi.nome_equipamento}`,
          description: `Apenas ${epi.quantidade_estoque ?? 0} unidade(s) disponível(is) no almoxarifado.`,
          to: "/app/epis",
        });
      });

      setInsights(list.slice(0, 4));
    });
  }, [perfil?.empresa_id]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground">Insights</h3>
        <span className="rounded-full bg-secondary-50 px-2 py-0.5 text-[10px] font-semibold text-secondary-400">
          Auto-gerado
        </span>
      </div>

      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
            <Sparkles className="h-5 w-5 text-success" strokeWidth={1.9} />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">Nenhum ponto de atenção</p>
          <p className="mt-1 text-xs text-muted-foreground">Documentos, treinamentos e estoque estão em conformidade.</p>
        </div>
      ) : (
        <div className="mt-2">
          {insights.map((insight, i) => (
            <div key={i} className="flex gap-3 border-b border-border/50 py-3 last:border-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
                <insight.icon className="h-4 w-4" strokeWidth={1.9} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{insight.description}</p>
                <button
                  onClick={() => navigate(insight.to)}
                  className="mt-1 text-xs font-medium text-secondary-400 transition-colors hover:text-secondary-500"
                >
                  Ver detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
