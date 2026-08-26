import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, ClipboardList, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const Icon = assinado ? CheckCircle2 : Clock3;
  return (
    <span
      className={
        assinado
          ? "inline-flex items-center gap-1.5 rounded-md border border-success/15 bg-success/10 px-2 py-1 text-[11px] font-semibold text-success"
          : "inline-flex items-center gap-1.5 rounded-md border border-warning/20 bg-warning/10 px-2 py-1 text-[11px] font-semibold text-warning"
      }
    >
      <Icon className="h-3 w-3" strokeWidth={2} />
      {assinado ? "Assinado" : "Pendente"}
    </span>
  );
}

function Initials({ name }: { name: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-[11px] font-bold text-primary-600 ring-1 ring-primary-100">
      {name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()}
    </div>
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
            }),
          );
        }
      });
  }, []);

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
          <div>
            <p className="app-eyebrow">Movimentações</p>
            <h3 className="mt-1 text-base font-semibold text-foreground">Últimas entregas</h3>
          </div>
          <button
            onClick={() => navigate("/app/nova-entrega")}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-secondary-500 transition-colors hover:bg-secondary/10 hover:text-secondary-600"
          >
            Ver todas <span aria-hidden="true">→</span>
          </button>
        </div>

        {entregas.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={ClipboardList}
              title="Nenhuma entrega registrada"
              description="Registre a primeira entrega de EPI para acompanhar assinaturas e conformidade."
              actionLabel="Registrar entrega"
              onAction={() => navigate("/app/nova-entrega")}
            />
          </div>
        ) : (
          <>
            <div className="block space-y-2 p-4 sm:hidden">
              {entregas.map((e) => (
                <div
                  key={e.id}
                  className="cursor-pointer rounded-lg border border-border/80 bg-card p-3 transition-colors hover:bg-primary-50/30 active:bg-primary-50/50"
                  onClick={() => setSelectedId(e.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <Initials name={e.funcionario} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{e.funcionario}</p>
                        <p className="truncate text-xs text-muted-foreground">{e.epi}</p>
                      </div>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/35 text-left">
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Funcionário</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Equipamento</th>
                    <th className="hidden px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground md:table-cell">CA</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Status</th>
                    <th className="w-10 px-3 py-3" aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {entregas.map((e) => (
                    <tr
                      key={e.id}
                      className="cursor-pointer border-b border-border/60 last:border-0 transition-colors duration-150 hover:bg-primary-50/35"
                      onClick={() => setSelectedId(e.id)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Initials name={e.funcionario} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{e.funcionario}</p>
                            <p className="truncate text-xs text-muted-foreground">{e.setor}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-foreground">{e.epi}</td>
                      <td className="hidden px-5 py-3.5 text-sm tabular-nums text-muted-foreground md:table-cell">{e.ca}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={e.status} /></td>
                      <td className="px-3 py-3.5"><MoreHorizontal className="h-4 w-4 text-muted-foreground/60" /></td>
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
