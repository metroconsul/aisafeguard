import { useEffect, useState } from "react";
import { Users, FileText, Stethoscope, GraduationCap, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { KpiCard } from "@/components/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PendenciaRow {
  id: string;
  funcionario_nome: string;
  titulo: string;
  tipo: string;
}

export function RHDashboard() {
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const [funcAtivos, setFuncAtivos] = useState(0);
  const [docsPendentes, setDocsPendentes] = useState(0);
  const [examesPendentes, setExamesPendentes] = useState(0);
  const [asoDetail, setAsoDetail] = useState("");
  const [nrsVencendo, setNrsVencendo] = useState(0);
  const [pendencias, setPendencias] = useState<PendenciaRow[]>([]);

  useEffect(() => {
    if (!perfil?.empresa_id) return;
    const empresaId = perfil.empresa_id;
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const in30Str = in30Days.toISOString().split("T")[0];

    // Funcionários ativos
    supabase
      .from("funcionarios")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("status", "ativo")
      .then(({ count }) => setFuncAtivos(count ?? 0));

    // Documentos pendentes de assinatura
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("signature_status", "pendente")
      .then(({ count }) => setDocsPendentes(count ?? 0));

    // Exames pendentes (ASOs)
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .in("doc_category", ["aso_exames", "aso"])
      .not("expiration_date", "is", null)
      .lte("expiration_date", in30Str)
      .then(({ count }) => setExamesPendentes(count ?? 0));

    // NRs vencendo
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("doc_category", "treinamento_nr")
      .not("expiration_date", "is", null)
      .lte("expiration_date", in30Str)
      .then(({ count }) => setNrsVencendo(count ?? 0));

    // Lista de pendências de assinatura
    supabase
      .from("documents")
      .select("id, title, doc_category, funcionarios:funcionario_id(nome)")
      .eq("empresa_id", empresaId)
      .eq("signature_status", "pendente")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!data) return;
        setPendencias(
          data.map((d) => {
            const func = d.funcionarios as unknown as { nome: string } | null;
            return {
              id: d.id,
              funcionario_nome: func?.nome ?? "—",
              titulo: d.title,
              tipo: d.doc_category,
            };
          })
        );
      });
  }, [perfil?.empresa_id]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Dashboard — RH</h1>
        <p className="text-sm text-muted-foreground">Foco em pessoas e documentação</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Funcionários Ativos" value={funcAtivos} icon={Users} />
        <KpiCard title="Docs Pendentes Assinatura" value={docsPendentes} icon={FileText} alert={docsPendentes > 0} />
        <KpiCard title="Exames/ASOs Vencendo" value={examesPendentes} icon={Stethoscope} alert={examesPendentes > 0} />
        <KpiCard title="NRs Vencendo" value={nrsVencendo} icon={GraduationCap} alert={nrsVencendo > 0} />
      </div>

      {/* Lista de pendências */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Funcionários com Pendência de Assinatura</h3>
        {pendencias.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma pendência encontrada 🎉</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Funcionário</th>
                  <th className="pb-3 font-medium text-muted-foreground">Documento</th>
                  <th className="pb-3 font-medium text-muted-foreground">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendencias.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 font-medium text-foreground">{p.funcionario_nome}</td>
                    <td className="py-3 text-foreground">{p.titulo}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        {p.tipo}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate("/app/funcionarios")} className="gap-2">
          <UserPlus className="h-4 w-4" /> Adicionar Funcionário
        </Button>
        <Button variant="outline" onClick={() => navigate("/app/documentos")} className="gap-2">
          <FileText className="h-4 w-4" /> Ver Documentos
        </Button>
      </div>
    </div>
  );
}
