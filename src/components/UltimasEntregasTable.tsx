import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EntregaDetailModal } from "@/components/EntregaDetailModal";
import { EmptyState } from "@/components/EmptyState";

interface EntregaRow {
  id: string;
  funcionario: string;
  setor: string;
  epi: string;
  ca: string;
  status: string;
}

function StatusBadge({ status }: { status: string }) {
  const assinado = status === "Assinado";
  return (
    <span
      className={
        assinado
          ? "inline-flex rounded-full border border-success/15 bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success"
          : "inline-flex rounded-full border border-warning/15 bg-warning/10 px-2.5 py-0.5 text-[11px] font-semibold text-warning"
      }
    >
      {assinado ? "Assinado" : "Pendente"}
    </span>
  );
}

export function UltimasEntregasTable() {
  const [entregas, setEntregas] = useState<EntregaRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();

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
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-base font-semibold text-foreground">Últimas Entregas</h3>
          <button
            onClick={() => navigate("/app/nova-entrega")}
            className="text-sm font-medium text-secondary-400 transition-colors hover:text-secondary-500"
          >
            Ver Todas →
          </button>
        </div>

        {entregas.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={ClipboardList}
              title="Sem entregas registradas ainda"
              description="Comece registrando a primeira entrega de EPI para sua equipe."
              actionLabel="+ Registrar Entrega"
              onAction={() => navigate("/app/nova-entrega")}
            />
          </div>
        ) : (
          <>
            {/* Mobile: card layout */}
            <div className="block space-y-3 p-4 sm:hidden">
              {entregas.map((e) => (
                <div
                  key={e.id}
                  className="cursor-pointer rounded-xl border border-border bg-card p-3 shadow-card active:bg-primary-50/30"
                  onClick={() => setSelectedId(e.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-600">
                        {e.funcionario.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{e.funcionario}</p>
                        <p className="truncate text-xs text-muted-foreground">{e.epi}</p>
                      </div>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table layout */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left">
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Funcionário</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">EPI</th>
                    <th className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">CA</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entregas.map((e) => (
                    <tr
                      key={e.id}
                      className="cursor-pointer border-b border-border/50 transition-colors duration-100 even:bg-muted/30 hover:bg-primary-50/40"
                      onClick={() => setSelectedId(e.id)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-600">
                            {e.funcionario.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{e.funcionario}</p>
                            <p className="truncate text-xs text-muted-foreground">{e.setor}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-foreground">{e.epi}</td>
                      <td className="hidden px-5 py-3.5 text-sm tabular-nums text-muted-foreground md:table-cell">{e.ca}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={e.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <EntregaDetailModal
        entregaId={selectedId}
        open={!!selectedId}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
      />
    </>
  );
}
