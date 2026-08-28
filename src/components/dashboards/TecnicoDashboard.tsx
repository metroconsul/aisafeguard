import { useEffect, useState } from "react";
import { Stethoscope, GraduationCap, HardHat, ShieldCheck, FolderLock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { KpiCard } from "@/components/KpiCard";
import { DistribuicaoEpiChart } from "@/components/charts/DistribuicaoEpiChart";
import { EntregasSetorChart } from "@/components/charts/EntregasSetorChart";
import { Button } from "@/components/ui/button";
import { IrregularesCard } from "@/components/epi/IrregularesCard";

export function TecnicoDashboard() {
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const [asosVencendo, setAsosVencendo] = useState(0);
  const [asoDetail, setAsoDetail] = useState("");
  const [nrsVencendo, setNrsVencendo] = useState(0);
  const [episVencidos, setEpisVencidos] = useState(0);
  const [setoresCount, setSetoresCount] = useState(0);

  useEffect(() => {
    if (!perfil?.empresa_id) return;
    const empresaId = perfil.empresa_id;
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const in30Str = in30Days.toISOString().split("T")[0];

    // ASOs vencendo with type breakdown
    supabase
      .from("documents")
      .select("id, aso_type", { count: "exact" })
      .eq("empresa_id", empresaId)
      .in("doc_category", ["aso_exames", "aso"])
      .not("expiration_date", "is", null)
      .lte("expiration_date", in30Str)
      .then(({ data, count }) => {
        setAsosVencendo(count ?? 0);
        if (data && data.length > 0) {
          const types: Record<string, number> = {};
          data.forEach((d: any) => {
            const t = d.aso_type || "geral";
            types[t] = (types[t] || 0) + 1;
          });
          const labels: Record<string, string> = {
            admissional: "Admissional", periodico: "Periódico", demissional: "Demissional",
            retorno_trabalho: "Retorno", mudanca_risco: "Mud. Risco", geral: "Geral",
          };
          const detail = Object.entries(types).map(([k, v]) => `${v} ${labels[k] || k}`).join(", ");
          setAsoDetail(detail);
        }
      });

    // NRs vencendo
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("doc_category", "treinamento_nr")
      .not("expiration_date", "is", null)
      .lte("expiration_date", in30Str)
      .then(({ count }) => setNrsVencendo(count ?? 0));

    // EPIs com CA vencido
    supabase
      .from("epis")
      .select("id, dias_validade, created_at")
      .eq("empresa_id", empresaId)
      .then(({ data }) => {
        if (!data) return setEpisVencidos(0);
        const vencidos = data.filter((epi) => {
          if (!epi.created_at) return false;
          const vencimento = new Date(epi.created_at);
          vencimento.setDate(vencimento.getDate() + epi.dias_validade);
          return vencimento <= now;
        });
        setEpisVencidos(vencidos.length);
      });

    // Setores com EPIs vinculados
    supabase
      .from("setores")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .then(({ count }) => setSetoresCount(count ?? 0));
  }, [perfil?.empresa_id]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Dashboard — Técnico de Segurança</h1>
        <p className="text-sm text-muted-foreground">Foco em risco e conformidade</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="ASOs Vencendo" value={asosVencendo} icon={Stethoscope} alert={asosVencendo > 0} subtitle={asoDetail} />
        <KpiCard title="NRs Vencendo" value={nrsVencendo} icon={GraduationCap} alert={nrsVencendo > 0} />
        <KpiCard title="EPIs com CA Vencido" value={episVencidos} icon={HardHat} alert={episVencidos > 0} />
        <KpiCard title="Setores Monitorados" value={setoresCount} icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <EntregasSetorChart />
        </div>
        <div className="lg:col-span-2">
          <DistribuicaoEpiChart />
        </div>
      </div>

      <IrregularesCard />

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate("/app/treinamentos")} className="gap-2">
          <GraduationCap className="h-4 w-4" /> Ver Treinamentos
        </Button>
        <Button variant="outline" onClick={() => navigate("/app/documentos")} className="gap-2">
          <FolderLock className="h-4 w-4" /> Ver Laudos
        </Button>
      </div>
    </div>
  );
}
