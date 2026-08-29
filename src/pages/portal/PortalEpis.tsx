import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Loader2, HardHat } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MeuEpi {
  id: string;
  data_entrega: string | null;
  data_vencimento: string;
  epi_nome: string;
  numero_ca: string;
  epi_id: string;
  status_assinatura: string | null;
  quantidade: number;
  origem: string;
  kit_id: string | null;
  kit_nome: string | null;
}

const MOTIVOS = ["Desgaste Natural", "Perda", "Defeito"];

export default function PortalEpis() {
  const { employee, portalApi } = usePortalAuth();
  const navigate = useNavigate();
  const [epis, setEpis] = useState<MeuEpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTroca, setShowTroca] = useState(false);
  const [selectedEpi, setSelectedEpi] = useState("");
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!employee) return;
    loadEpis();
  }, [employee]);

  const loadEpis = async () => {
    if (!employee) return;
    setLoading(true);
    try {
      const r = await portalApi<{ entregas: any[] }>("list_entregas");
      setEpis(
        (r.entregas || []).map((row) => {
          const epi = row.epis as { id: string; nome_equipamento: string; numero_ca: string } | null;
          const kit = row.epi_kits as { nome: string } | null;
          return {
            id: row.id,
            data_entrega: row.data_entrega,
            data_vencimento: row.data_vencimento,
            epi_nome: epi?.nome_equipamento ?? "—",
            numero_ca: epi?.numero_ca ?? "—",
            epi_id: epi?.id ?? "",
            status_assinatura: row.status_assinatura ?? null,
            quantidade: row.quantidade ?? 1,
            origem: row.origem ?? "avulsa",
            kit_id: row.kit_id ?? null,
            kit_nome: kit?.nome ?? null,
          };
        })

      );
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar EPIs");
    }
    setLoading(false);
  };

  const handleSolicitar = async () => {
    if (!employee || !selectedEpi || !motivo) {
      toast.error("Selecione o EPI e o motivo.");
      return;
    }
    setSubmitting(true);
    try {
      await portalApi("submit_epi_request", { epi_id: selectedEpi, motivo });
      toast.success("Solicitação enviada com sucesso!");
      setShowTroca(false);
      setSelectedEpi("");
      setMotivo("");
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar solicitação");
    }
    setSubmitting(false);
  };

  const isVencido = (dateStr: string) => new Date(dateStr) <= new Date();
  const isVencendo = (dateStr: string) => {
    const d = new Date(dateStr);
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    return d > new Date() && d <= in30;
  };

  if (!employee) return null;

  const pendentes = epis.filter((e) => e.status_assinatura !== "Assinado");
  const pendentesAvulsos = pendentes.filter((e) => !e.kit_id);
  const gruposKit = pendentes
    .filter((e) => e.kit_id)
    .reduce<Record<string, MeuEpi[]>>((acc, e) => {
      const key = e.kit_id as string;
      acc[key] = [...(acc[key] ?? []), e];
      return acc;
    }, {});

  return (
    <div className="space-y-5 p-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Meus EPIs</h1>
        <p className="text-sm text-muted-foreground">Equipamentos em posse</p>
      </div>

      {/* Pendentes de assinatura */}
      {!loading && pendentes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-destructive uppercase tracking-wider">
            Pendentes de assinatura
          </h2>

          {/* Kits pendentes — lista de itens + assinatura do kit completo */}
          {Object.entries(gruposKit).map(([kitId, itens]) => (
            <div
              key={`kit-${kitId}`}
              className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4"
            >
              <p className="font-semibold text-foreground">
                {itens[0].kit_nome || "Kit de EPI"}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {itens.length} item(ns) aguardando sua confirmação.
              </p>
              <div className="mt-3 space-y-1.5">
                {itens.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.epi_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        C.A.: {item.numero_ca} · Qtd: {item.quantidade}
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate(`/assinar/${item.id}`)}
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                    >
                      Assinar
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => navigate(`/assinar/${itens[0].id}`)}
                variant="destructive"
                className="mt-3 w-full h-12 text-base font-semibold"
              >
                Confirmar kit completo
              </Button>
            </div>
          ))}

          {/* Entregas avulsas pendentes */}
          {pendentesAvulsos.map((epi) => (
            <div
              key={`pend-${epi.id}`}
              className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4"
            >
              <p className="font-semibold text-foreground">{epi.epi_nome}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                C.A.: {epi.numero_ca} · Confirme o recebimento para regularizar.
              </p>
              <Button
                onClick={() => navigate(`/assinar/${epi.id}`)}
                variant="destructive"
                className="mt-3 w-full h-12 text-base font-semibold"
              >
                Assinar Recebimento
              </Button>
            </div>
          ))}
        </div>
      )}


      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : epis.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <HardHat className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium text-foreground">Nenhum EPI registrado</p>
          <p className="text-sm text-muted-foreground mt-1">Seus EPIs aparecerão aqui após a entrega.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {epis.map((epi) => (
            <div
              key={epi.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{epi.epi_nome}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">C.A.: {epi.numero_ca}</p>
                </div>
                {isVencido(epi.data_vencimento) ? (
                  <Badge variant="destructive" className="text-xs">Vencido</Badge>
                ) : isVencendo(epi.data_vencimento) ? (
                  <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">Vencendo</Badge>
                ) : (
                  <Badge className="bg-success/10 text-success border-success/20 text-xs">Válido</Badge>
                )}
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span>
                  Entrega: {epi.data_entrega ? format(new Date(epi.data_entrega), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                </span>
                <span>
                  Validade: {format(new Date(epi.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB - Solicitar Troca */}
      <Button
        onClick={() => setShowTroca(true)}
        className="fixed bottom-20 right-4 z-40 h-14 gap-2 rounded-full px-6 text-base font-semibold shadow-lg sm:right-[calc(50%-240px+16px)]"
      >
        <Plus className="h-5 w-5" /> Solicitar Troca
      </Button>

      {/* Modal de Troca */}
      <Dialog open={showTroca} onOpenChange={setShowTroca}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Solicitar Troca de EPI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold">Qual EPI deseja trocar?</Label>
              <Select value={selectedEpi} onValueChange={setSelectedEpi}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione o EPI" />
                </SelectTrigger>
                <SelectContent>
                  {epis.map((epi) => (
                    <SelectItem key={epi.id} value={epi.epi_id}>
                      {epi.epi_nome} (C.A. {epi.numero_ca})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Motivo da troca *</Label>
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSolicitar}
              disabled={submitting || !selectedEpi || !motivo}
              className="h-14 w-full text-base font-semibold"
            >
              {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Enviar Solicitação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
