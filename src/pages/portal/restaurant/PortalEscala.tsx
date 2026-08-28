import { useCallback, useEffect, useMemo, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2, Moon } from "lucide-react";
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Bloco {
  id: string;
  ordem: number;
  inicio_previsto: string;
  fim_previsto: string;
  turno_nome_snapshot: string | null;
}

interface Escala {
  id: string;
  data: string;
  status: string;
  folga: boolean;
  observacao: string | null;
  restaurant_escala_blocos: Bloco[] | null;
}

type Modo = "semana" | "mes";

const fmt = (d: Date) => format(d, "yyyy-MM-dd");
const hora = (iso: string) => format(new Date(iso), "HH:mm");

export default function PortalEscala() {
  const { employee, portalApi } = usePortalAuth();
  const [modo, setModo] = useState<Modo>("semana");
  const [ref, setRef] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [brand, setBrand] = useState("Minha Escala");
  const [escalas, setEscalas] = useState<Escala[]>([]);

  const range = useMemo(() => {
    if (modo === "semana") {
      const inicio = startOfWeek(ref, { weekStartsOn: 1 });
      return { inicio, fim: endOfWeek(ref, { weekStartsOn: 1 }) };
    }
    return { inicio: startOfMonth(ref), fim: endOfMonth(ref) };
  }, [modo, ref]);

  const load = useCallback(async () => {
    if (!employee) return;
    setLoading(true);
    try {
      const r = await portalApi<{
        enabled: boolean;
        escalas: Escala[];
        settings: { portal_brand_name?: string | null } | null;
      }>("get_minha_escala", { inicio: fmt(range.inicio), fim: fmt(range.fim) });
      setEnabled(r.enabled);
      setEscalas(r.escalas || []);
      if (r.settings?.portal_brand_name) setBrand(r.settings.portal_brand_name);
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar escala");
    } finally {
      setLoading(false);
    }
  }, [employee, portalApi, range.inicio, range.fim]);

  useEffect(() => {
    load();
  }, [load]);

  const dias = useMemo(() => {
    const out: Date[] = [];
    let d = range.inicio;
    while (d <= range.fim) {
      out.push(d);
      d = addDays(d, 1);
    }
    return out;
  }, [range]);

  const shift = (dir: number) =>
    setRef((prev) => (modo === "semana" ? addDays(prev, dir * 7) : addMonths(prev, dir)));

  const escalaDoDia = (d: Date) => escalas.find((e) => isSameDay(new Date(`${e.data}T00:00:00`), d));

  return (
    <div className="space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{brand}</h1>
        <p className="text-sm text-muted-foreground">
          {employee?.nome} · {employee?.cargo}
        </p>
      </header>

      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-border p-0.5">
          {(["semana", "mes"] as Modo[]).map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                modo === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {m === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {modo === "semana"
          ? `${format(range.inicio, "dd MMM", { locale: ptBR })} – ${format(range.fim, "dd MMM yyyy", { locale: ptBR })}`
          : format(ref, "MMMM 'de' yyyy", { locale: ptBR })}
      </p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !enabled ? (
        <Card className="p-6 text-center">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Escala não habilitada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua empresa ainda não ativou o módulo de escalas de turnos.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {dias.map((d) => {
            const e = escalaDoDia(d);
            const blocos = (e?.restaurant_escala_blocos ?? []).slice().sort((a, b) => a.ordem - b.ordem);
            const hoje = isSameDay(d, new Date());
            return (
              <Card
                key={fmt(d)}
                className={`flex gap-3 p-3 ${hoje ? "border-primary/40 bg-primary/5" : ""}`}
              >
                <div className="w-12 shrink-0 text-center">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    {format(d, "EEE", { locale: ptBR })}
                  </p>
                  <p className="text-lg font-bold leading-tight text-foreground">{format(d, "dd")}</p>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  {!e ? (
                    <p className="pt-1.5 text-sm text-muted-foreground">Sem escala publicada</p>
                  ) : e.folga ? (
                    <Badge variant="secondary" className="gap-1">
                      <Moon className="h-3 w-3" /> Folga
                    </Badge>
                  ) : blocos.length === 0 ? (
                    <p className="pt-1.5 text-sm text-muted-foreground">Turno sem horário definido</p>
                  ) : (
                    blocos.map((b) => (
                      <div key={b.id} className="flex items-center gap-2 text-sm">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold text-foreground">
                          {hora(b.inicio_previsto)} – {hora(b.fim_previsto)}
                        </span>
                        {b.turno_nome_snapshot && (
                          <span className="truncate text-muted-foreground">{b.turno_nome_snapshot}</span>
                        )}
                      </div>
                    ))
                  )}
                  {e?.observacao && (
                    <p className="text-xs text-muted-foreground">{e.observacao}</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
