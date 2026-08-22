import { useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Clock, Download, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Ponto {
  id: string;
  title: string;
  reference_period: string | null;
  signature_status: string;
  signed_at: string | null;
  file_url: string | null;
  created_at: string | null;
  empresa_id: string;
}

export default function PortalPontos() {
  const { employee, portalApi } = usePortalAuth();
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ponto | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!employee) return;
    loadPontos();
  }, [employee]);

  const loadPontos = async () => {
    if (!employee) return;
    setLoading(true);
    try {
      const r = await portalApi<{ documents: Ponto[] }>("list_documents", { categories: ["cartao_ponto"] });
      setPontos(r.documents || []);
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar cartões de ponto");
    }
    setLoading(false);
  };

  const handleAssinar = async () => {
    if (!selected || !employee) return;
    setSigning(true);
    try {
      await portalApi("sign_document", {
        document_id: selected.id,
        user_agent: navigator.userAgent,
      });
      toast.success("Cartão de ponto assinado!");
      setSelected(null);
      setConfirmado(false);
      await loadPontos();
    } catch (e: any) {
      toast.error(e.message || "Erro ao assinar.");
    }
    setSigning(false);
  };

  if (!employee) return null;

  const pendentes = pontos.filter(p => p.signature_status === "pendente");

  return (
    <div className="space-y-5 p-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Meus Pontos</h1>
        <p className="text-sm text-muted-foreground">Espelhos de ponto e assinatura digital</p>
      </div>

      {pendentes.length > 0 && (
        <div className="rounded-xl border-2 border-red-400 bg-red-50 dark:bg-red-950/20 p-4">
          <p className="font-semibold text-red-700 text-sm">⚠️ Você tem {pendentes.length} cartão(ões) de ponto pendente(s) de assinatura!</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : pontos.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Clock className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium text-foreground">Nenhum cartão de ponto disponível</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pontos.map(p => {
            const isPendente = p.signature_status === "pendente";
            return (
              <button key={p.id} onClick={() => { setSelected(p); setConfirmado(false); }}
                className="w-full rounded-xl border border-border bg-card p-4 shadow-sm text-left hover:bg-muted/30 transition-colors active:scale-[0.99]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{p.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{p.reference_period || "—"}</p>
                  </div>
                  {isPendente ? (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">Pendente</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle2 className="mr-1 h-3 w-3" /> Assinado</Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
          <DialogHeader><DialogTitle>{selected?.title}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                {selected.file_url ? (
                  <div className="space-y-3">
                    <div className="flex h-32 items-center justify-center rounded-lg bg-muted">
                      <Clock className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <a href={selected.file_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                      <Download className="h-4 w-4" /> Visualizar / Baixar PDF
                    </a>
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center">
                    <p className="text-sm text-muted-foreground">PDF não disponível</p>
                  </div>
                )}
              </div>

              {selected.signature_status === "pendente" ? (
                <>
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                    <Checkbox id="confirma-ponto" checked={confirmado} onCheckedChange={(c) => setConfirmado(c === true)} className="mt-0.5" />
                    <label htmlFor="confirma-ponto" className="text-sm text-foreground leading-tight cursor-pointer">
                      Confirmo as horas registradas neste espelho de ponto.
                    </label>
                  </div>
                  <Button onClick={handleAssinar} disabled={!confirmado || signing}
                    className="h-14 w-full text-base font-semibold bg-green-600 hover:bg-green-700 text-white">
                    {signing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                    Assinar Digitalmente
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-2">
                  <Badge className="bg-green-100 text-green-700 border-green-300 px-4 py-1.5">
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Assinado
                  </Badge>
                  {selected.signed_at && (
                    <p className="text-xs text-muted-foreground">
                      Em {format(new Date(selected.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
