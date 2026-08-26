import { useState } from "react";
import { Plus, Smartphone, Trash2, Unplug, QrCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { QRCodeModal } from "@/components/QRCodeModal";
import { useIntegracoes, formatPhoneNumber, type IntegracaoWhatsApp } from "@/hooks/useIntegracoes";

const statusConfig: Record<string, { label: string; variant: "default" | "outline" | "secondary"; className: string }> = {
  pendente: { label: "Pendente", variant: "outline", className: "bg-muted/50 text-muted-foreground border-border" },
  conectando: { label: "Conectando", variant: "outline", className: "bg-warning/10 text-warning border-warning/20" },
  conectado: { label: "Conectado", variant: "default", className: "bg-success/10 text-success border-success/20" },
  desconectado: { label: "Desconectado", variant: "outline", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function Integracoes() {
  const {
    integracoes, loading, createIntegracao, disconnectIntegracao,
    deleteIntegracao, getQRCode, checkConnectionStatus, updateStatus,
  } = useIntegracoes();

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [nome, setNome] = useState("");
  const [numero, setNumero] = useState("");
  const [qrTarget, setQrTarget] = useState<IntegracaoWhatsApp | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IntegracaoWhatsApp | null>(null);

  const handleCreate = async () => {
    if (!nome.trim() || !numero.trim()) return;
    setCreating(true);
    const result = await createIntegracao({ nome: nome.trim(), numero });
    setCreating(false);
    if (result) { setShowCreate(false); setNome(""); setNumero(""); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteIntegracao(deleteTarget.id, deleteTarget.instancia);
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1240px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="app-eyebrow">Automação operacional</p><h1 className="mt-1 text-[27px] font-bold tracking-tight text-foreground">Integrações</h1><p className="mt-2 text-sm text-muted-foreground">Conecte o WhatsApp para disparar avisos e acompanhar o status da operação.</p></div>
        <Button onClick={() => setShowCreate(true)} disabled={integracoes.length >= 3}><Plus className="h-4 w-4" />Nova conexão</Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="data-summary"><div className="summary-icon blue"><Smartphone className="h-4 w-4" /></div><div><span>Conexões ativas</span><strong>{integracoes.filter((i) => i.status === "conectado").length}</strong><small>de {integracoes.length}/3 configuradas</small></div></div><div className="data-summary"><div className="summary-icon cyan"><span>↗</span></div><div><span>Automação</span><strong>{integracoes.length ? "Pronta" : "—"}</strong><small>avisos via WhatsApp</small></div></div><div className="data-summary"><div className="summary-icon amber"><span>!</span></div><div><span>Limite da conta</span><strong>{integracoes.length}/3</strong><small>conexões permitidas</small></div></div></div>

      {integracoes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 px-4">
            <Smartphone className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Nenhuma integração configurada</p>
            <p className="mt-1 text-xs text-muted-foreground text-center">Adicione um número de WhatsApp para começar</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar WhatsApp
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {integracoes.map((integ) => {
            const config = statusConfig[integ.status] || statusConfig.pendente;
            return (
              <Card key={integ.id} className="overflow-hidden">
                <CardHeader className="pb-3 px-4 sm:px-6">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base truncate">{integ.nome}</CardTitle>
                    <Badge variant={config.variant} className={config.className}>
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 px-4 sm:px-6">
                  <p className="text-sm tabular-nums text-muted-foreground">
                    +{formatPhoneNumber(integ.numero)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(integ.status === "pendente" || integ.status === "desconectado") && (
                      <Button size="sm" variant="outline" onClick={() => setQrTarget(integ)}>
                        <QrCode className="mr-1.5 h-3.5 w-3.5" />
                        Conectar
                      </Button>
                    )}
                    {integ.status === "conectado" && integ.instancia && (
                      <Button size="sm" variant="outline" onClick={() => disconnectIntegracao(integ.id, integ.instancia!)}>
                        <Unplug className="mr-1.5 h-3.5 w-3.5" />
                        Desconectar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(integ)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Integração WhatsApp</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome de identificação</Label>
              <Input placeholder="Ex: Linha Principal" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Número do WhatsApp</Label>
              <Input placeholder="5511999999999" value={numero} onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))} />
              <p className="text-xs text-muted-foreground">Inclua código do país (55) + DDD + número</p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating || !nome.trim() || !numero.trim()} className="w-full sm:w-auto">
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Criar Integração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QRCodeModal
        open={!!qrTarget} onClose={() => setQrTarget(null)} integracao={qrTarget}
        getQRCode={getQRCode} checkConnectionStatus={checkConnectionStatus} updateStatus={updateStatus}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover integração?</AlertDialogTitle>
            <AlertDialogDescription>
              A integração "{deleteTarget?.nome}" será removida permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
