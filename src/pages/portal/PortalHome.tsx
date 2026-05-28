import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertTriangle, FileText, LogOut, ChevronRight } from "lucide-react";
import { RegistroPontoCard } from "@/components/portal/RegistroPontoCard";

export default function PortalHome() {
  const { employee, logout, portalApi } = usePortalAuth();
  const navigate = useNavigate();
  const [holeritePendentes, setHoleritePendentes] = useState(0);
  const [nrsVencendo, setNrsVencendo] = useState<{ title: string; days: number }[]>([]);

  useEffect(() => {
    if (!employee) return;
    portalApi<{ count: number }>("count_pending_holerites")
      .then((r) => setHoleritePendentes(r.count ?? 0))
      .catch(() => {});
    portalApi<{ items: { title: string; expiration_date: string }[] }>("list_nrs_vencendo")
      .then((r) => {
        const today = new Date();
        setNrsVencendo(
          (r.items || []).map((d) => {
            const exp = new Date(d.expiration_date);
            const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return { title: d.title, days: diff };
          })
        );
      })
      .catch(() => {});
  }, [employee]);

  if (!employee) return null;

  const initials = employee.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div className="space-y-5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 rounded-xl border-2 border-primary/20">
            <AvatarFallback className="rounded-xl bg-primary/10 text-lg font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">
              Olá, {employee.nome.split(" ")[0]}!
            </h1>
            <p className="text-sm text-muted-foreground">{employee.cargo}</p>
            <p className="text-xs text-muted-foreground">{employee.setor}</p>
          </div>
        </div>
        <button
          onClick={() => { void logout().then(() => navigate("/portal/login", { replace: true })); }}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
          title="Sair"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Company name */}
      <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 text-center">
        <p className="text-xs text-muted-foreground">Empresa</p>
        <p className="font-semibold text-foreground">{employee.empresa_nome}</p>
      </div>

      {/* Registro de Jornada (Bater Ponto) */}
      <RegistroPontoCard employee={employee} />

      {/* Pendências Urgentes */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Pendências
        </h2>

        {holeritePendentes > 0 && (
          <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-destructive/10 p-2">
                <FileText className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  Você tem {holeritePendentes} holerite{holeritePendentes > 1 ? "s" : ""} pendente{holeritePendentes > 1 ? "s" : ""}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Confirme o recebimento para ficar em dia.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/portal/holerites")}
              variant="destructive"
              className="mt-3 w-full h-12 text-base font-semibold gap-2"
            >
              Assinar Agora <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {nrsVencendo.map((nr, i) => (
          <div key={i} className="rounded-xl border-2 border-warning/30 bg-warning/5 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-warning/10 p-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{nr.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Vence em <strong>{nr.days} dia{nr.days !== 1 ? "s" : ""}</strong>. Procure o RH.
                </p>
              </div>
            </div>
          </div>
        ))}

        {holeritePendentes === 0 && nrsVencendo.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="font-medium text-foreground">Tudo em dia!</p>
            <p className="text-sm text-muted-foreground mt-1">Nenhuma pendência no momento.</p>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/portal/epis")}
          className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 shadow-sm hover:bg-muted/50 transition-colors active:scale-[0.98]"
        >
          <span className="text-2xl">🦺</span>
          <span className="text-sm font-medium text-foreground">Meus EPIs</span>
        </button>
        <button
          onClick={() => navigate("/portal/holerites")}
          className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 shadow-sm hover:bg-muted/50 transition-colors active:scale-[0.98]"
        >
          <span className="text-2xl">📄</span>
          <span className="text-sm font-medium text-foreground">Holerites</span>
        </button>
        <button
          onClick={() => navigate("/portal/documentos")}
          className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 shadow-sm hover:bg-muted/50 transition-colors active:scale-[0.98]"
        >
          <span className="text-2xl">📁</span>
          <span className="text-sm font-medium text-foreground">Documentos</span>
        </button>
        <button
          onClick={() => navigate("/portal/epis")}
          className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 shadow-sm hover:bg-muted/50 transition-colors active:scale-[0.98]"
        >
          <span className="text-2xl">🔄</span>
          <span className="text-sm font-medium text-foreground">Trocar EPI</span>
        </button>
      </div>
    </div>
  );
}
