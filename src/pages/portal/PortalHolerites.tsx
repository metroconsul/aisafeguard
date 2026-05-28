import { useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, FileText, Download, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Holerite {
  id: string;
  title: string;
  reference_period: string | null;
  signature_status: string;
  signed_at: string | null;
  file_url: string | null;
  created_at: string | null;
}

export default function PortalHolerites() {
  const { employee, portalApi } = usePortalAuth();
  const [holerites, setHolerites] = useState<Holerite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Holerite | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!employee) return;
    loadHolerites();
  }, [employee]);

  const loadHolerites = async () => {
    if (!employee) return;
    setLoading(true);
    try {
      const r = await portalApi<{ documents: Holerite[] }>("list_documents", { categories: ["holerite"] });
      setHolerites(r.documents || []);
    } catch {
      toast.error("Erro ao carregar holerites");
    }
    setLoading(false);
  };

  const handleAssinar = async () => {
    if (!selected || !employee) return;
    setSigning(true);
    try {
      await portalApi("sign_document", { document_id: selected.id, user_agent: navigator.userAgent });
      toast.success("Holerite assinado com sucesso!");
      setSelected(null);
      setConfirmado(false);
      await loadHolerites();
    } catch (e: any) {
      toast.error(e.message || "Erro ao assinar o holerite");
    }
    setSigning(false);
  };

  if (!employee) return null;

  return (
    <div className="space-y-5 p-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Meus Holerites</h1>
        <p className="text-sm text-muted-foreground">Contracheques e recibos de pagamento</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : holerites.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium text-foreground">Nenhum holerite disponível</p>
          <p className="text-sm text-muted-foreground mt-1">Seus holerites aparecerão aqui quando disponíveis.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {holerites.map((h) => {
            const isPendente = h.signature_status === "pendente";
            return (
              <button
                key={h.id}
                onClick={() => { setSelected(h); setConfirmado(false); }}
                className="w-full rounded-xl border border-border bg-card p-4 shadow-sm text-left hover:bg-muted/30 transition-colors active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{h.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {h.reference_period || (h.created_at ? format(new Date(h.created_at), "MMMM/yyyy", { locale: ptBR }) : "—")}
                    </p>
                  </div>
                  {isPendente ? (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      Pendente
                    </Badge>
                  ) : (
                    <Badge className="bg-success/10 text-success border-success/20">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Assinado
                    </Badge>
                  )}
                </div>
                {h.signed_at && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Assinado em {format(new Date(h.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Modal de visualização / assinatura */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                {selected.file_url ? (
                  <div className="space-y-3">
                    <div className="flex h-32 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <a
                      href={selected.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
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
                    <Checkbox
                      id="confirma"
                      checked={confirmado}
                      onCheckedChange={(c) => setConfirmado(c === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="confirma" className="text-sm text-foreground leading-tight cursor-pointer">
                      Li e confirmo o recebimento deste holerite.
                    </label>
                  </div>
                  <Button
                    onClick={handleAssinar}
                    disabled={!confirmado || signing}
                    className="h-14 w-full text-base font-semibold bg-success hover:bg-success/90 text-white"
                  >
                    {signing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                    Confirmar Recebimento / Assinar
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-2">
                  <Badge className="bg-success/10 text-success border-success/20 px-4 py-1.5">
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Assinado
                  </Badge>
                  {selected.signed_at && (
                    <p className="text-xs text-muted-foreground">
                      Em {format(new Date(selected.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                  {selected.file_url && (
                    <Button variant="outline" className="mt-3 gap-2" asChild>
                      <a href={selected.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" /> Baixar PDF
                      </a>
                    </Button>
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
