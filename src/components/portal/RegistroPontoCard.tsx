import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Loader2, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { PortalEmployee } from "@/contexts/PortalAuthContext";

const TIPO_LABEL: Record<string, string> = {
  entrada: "Entrada",
  saida_almoco: "Saída p/ Almoço",
  volta_almoco: "Retorno do Almoço",
  saida: "Saída",
};

const NEXT_TIPO: Record<string, string> = {
  entrada: "saida_almoco",
  saida_almoco: "volta_almoco",
  volta_almoco: "saida",
  saida: "entrada",
};

interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function RegistroPontoCard({ employee }: { employee: PortalEmployee }) {
  const [now, setNow] = useState(new Date());
  const [capturing, setCapturing] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: hoje = [], refetch } = useQuery({
    queryKey: ["time_entries", "today", employee.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("funcionario_id", employee.id)
        .gte("recorded_at", todayStart.toISOString())
        .order("recorded_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  // Determina próximo tipo
  const last = hoje[hoje.length - 1];
  const proximoTipo = last ? NEXT_TIPO[last.tipo] || "entrada" : "entrada";

  const handleClick = () => {
    if (!navigator.geolocation) {
      toast.error("Seu dispositivo não suporta GPS");
      return;
    }
    setCapturing(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setCapturing(false);
        setConfirmOpen(true);
      },
      (err) => {
        setCapturing(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Acesso ao GPS é obrigatório para registrar o ponto.");
        } else {
          toast.error("Não foi possível obter sua localização. Tente novamente.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleConfirm = async () => {
    if (!coords) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("time_entries").insert({
        empresa_id: employee.empresa_id,
        funcionario_id: employee.id,
        tipo: proximoTipo,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        device_info: navigator.userAgent.substring(0, 200),
      });
      if (error) throw error;
      toast.success(`Ponto registrado às ${format(new Date(), "HH:mm")}!`, {
        icon: <CheckCircle2 className="h-5 w-5 text-success" />,
      });

      // Detecção de anomalia (fire-and-forget)
      const agora = new Date();
      const minutos = agora.getHours() * 60 + agora.getMinutes();
      const diaSemana = agora.getDay(); // 0=dom, 6=sáb
      let motivo: string | null = null;
      if (diaSemana === 0 || diaSemana === 6) {
        motivo = "Batida em fim de semana";
      } else if (proximoTipo === "entrada" && minutos > 8 * 60 + 15) {
        motivo = `Atraso na entrada (${Math.floor(minutos / 60)}h${String(minutos % 60).padStart(2, "0")})`;
      } else if (proximoTipo === "saida" && minutos > 18 * 60 + 30) {
        motivo = `Hora extra na saída (${Math.floor(minutos / 60)}h${String(minutos % 60).padStart(2, "0")})`;
      } else if (proximoTipo === "volta_almoco" && minutos > 13 * 60 + 15) {
        motivo = `Volta tardia do almoço (${Math.floor(minutos / 60)}h${String(minutos % 60).padStart(2, "0")})`;
      }
      if (motivo) {
        supabase.functions
          .invoke("notify-ponto-anomalia", {
            body: {
              funcionario_id: employee.id,
              tipo: proximoTipo,
              recorded_at: agora.toISOString(),
              motivo,
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
          })
          .catch((e) => console.warn("Falha ao notificar anomalia:", e));
      }

      setConfirmOpen(false);
      setCoords(null);
      refetch();
    } catch (err: any) {
      toast.error("Erro ao registrar: " + (err.message || "tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg">
        <p className="text-xs font-medium uppercase tracking-wider opacity-80">
          Registro de Jornada
        </p>
        <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight">
          {format(now, "HH:mm:ss")}
        </p>
        <p className="text-sm opacity-90 capitalize">
          {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>

        <Button
          onClick={handleClick}
          disabled={capturing}
          className="mt-4 h-14 w-full rounded-xl bg-background text-foreground hover:bg-background/90 text-base font-semibold gap-2 shadow-md"
        >
          {capturing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Obtendo GPS...
            </>
          ) : (
            <>
              <MapPin className="h-5 w-5" />
              Registrar {TIPO_LABEL[proximoTipo]}
            </>
          )}
        </Button>

        {hoje.length > 0 && (
          <div className="mt-4 space-y-1.5 border-t border-primary-foreground/20 pt-3">
            <p className="text-xs font-medium uppercase tracking-wider opacity-80">
              Batidas de hoje
            </p>
            {hoje.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 opacity-95">
                  <Clock className="h-3.5 w-3.5" />
                  {TIPO_LABEL[b.tipo] || b.tipo}
                </span>
                <span className="font-semibold tabular-nums">
                  {format(new Date(b.recorded_at), "HH:mm")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar registro de ponto</DialogTitle>
            <DialogDescription>
              Confirme os dados antes de salvar. O horário será registrado pelo servidor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Tipo de batida</p>
              <p className="text-lg font-bold text-foreground">{TIPO_LABEL[proximoTipo]}</p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Horário</p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {format(now, "HH:mm:ss")}
              </p>
            </div>
            {coords && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Localização (GPS)</p>
                <p className="text-sm font-mono text-foreground">
                  {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Precisão: ±{Math.round(coords.accuracy)}m
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar Ponto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
