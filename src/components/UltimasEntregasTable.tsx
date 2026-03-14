import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { EntregaDetailModal } from "@/components/EntregaDetailModal";

interface EntregaRow {
  id: string;
  funcionario: string;
  setor: string;
  epi: string;
  ca: string;
  status: string;
}

export function UltimasEntregasTable() {
  const [entregas, setEntregas] = useState<EntregaRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("entregas")
      .select("id, status_assinatura, funcionarios(nome, setor), epis(nome_equipamento, numero_ca)")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) {
          setEntregas(
            data.map((row) => {
              const func = row.funcionarios as unknown as { nome: string; setor: string };
              const epi = row.epis as unknown as { nome_equipamento: string; numero_ca: string };
              return {
                id: row.id,
                funcionario: func?.nome ?? "—",
                setor: func?.setor ?? "—",
                epi: epi?.nome_equipamento ?? "—",
                ca: epi?.numero_ca ?? "—",
                status: row.status_assinatura ?? "Pendente",
              };
            })
          );
        }
      });
  }, []);

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Últimas Entregas</h3>
          <button className="text-xs font-medium text-primary hover:underline">Ver Todas</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">Funcionário</th>
                <th className="pb-3 font-medium text-muted-foreground">EPI</th>
                <th className="pb-3 font-medium text-muted-foreground">CA</th>
                <th className="pb-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entregas.map((e) => (
                <tr
                  key={e.id}
                  className="cursor-pointer transition-colors hover:bg-muted/40"
                  onClick={() => setSelectedId(e.id)}
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {e.funcionario.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{e.funcionario}</p>
                        <p className="text-xs text-muted-foreground">{e.setor}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-foreground">{e.epi}</td>
                  <td className="py-3 tabular-nums text-muted-foreground">{e.ca}</td>
                  <td className="py-3">
                    <Badge
                      variant={e.status === "Assinado" ? "default" : "outline"}
                      className={
                        e.status === "Assinado"
                          ? "bg-success/10 text-success border-success/20 hover:bg-success/20"
                          : "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20"
                      }
                    >
                      {e.status === "Assinado" ? "Assinado" : "Aguardando"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EntregaDetailModal
        entregaId={selectedId}
        open={!!selectedId}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
      />
    </>
  );
}
