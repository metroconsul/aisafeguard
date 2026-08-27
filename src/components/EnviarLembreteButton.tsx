import { useState } from "react";
import { Loader2, MessageCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { triggerWebhook } from "@/lib/webhook";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PUBLIC_BASE_URL = "https://aisafeguard.lovable.app";
const COOLDOWN_MS = 60_000;

// Papéis autorizados a acionar o lembrete manual
const ALLOWED_ROLES = ["admin", "almoxarifado"];

interface EnviarLembreteButtonProps {
  entregaId: string;
  funcionarioNome: string;
  funcionarioTelefone: string;
  epiNome: string;
}

function isTelefoneValido(tel: string) {
  return tel.replace(/\D/g, "").length >= 10;
}

export function EnviarLembreteButton({
  entregaId,
  funcionarioNome,
  funcionarioTelefone,
  epiNome,
}: EnviarLembreteButtonProps) {
  const { perfil } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);

  if (!perfil || !ALLOWED_ROLES.includes(perfil.role)) return null;

  const linkPortal = `${PUBLIC_BASE_URL}/portal/login?next=${encodeURIComponent("/portal/epis")}`;
  const mensagem = `Olá, ${funcionarioNome}. A entrega de ${epiNome} já está disponível no seu portal. Quando puder, acesse o link para revisar e assinar: ${linkPortal}`;

  const telefoneOk = isTelefoneValido(funcionarioTelefone);
  const emCooldown = sentAt !== null && Date.now() - sentAt < COOLDOWN_MS;

  const copiarLink = () => {
    navigator.clipboard.writeText(linkPortal);
    toast.success("Link do portal copiado.");
  };

  const enviar = async () => {
    if (sending) return;
    setSending(true);
    const ok = await triggerWebhook({
      entrega_id: entregaId,
      nome_funcionario: funcionarioNome,
      telefone_whatsapp: funcionarioTelefone,
      nome_epi: epiNome,
      link_assinatura: linkPortal,
    });
    setSending(false);
    setConfirmOpen(false);

    if (!ok) {
      toast.error("Não foi possível enviar o lembrete agora. A entrega segue registrada e disponível no portal.");
      return;
    }

    setSentAt(Date.now());
    toast.success("Lembrete enviado.");

    // Histórico: registra quem solicitou o lembrete e quando
    if (perfil.empresa_id) {
      await supabase.from("notificacoes").insert({
        empresa_id: perfil.empresa_id,
        titulo: "Lembrete de assinatura enviado",
        mensagem: `${perfil.nome_completo} enviou um lembrete de ${epiNome} para ${funcionarioNome} em ${new Date().toLocaleString("pt-BR")}.`,
        tipo: "lembrete_whatsapp",
        lida: false,
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!telefoneOk || sending || emCooldown}
          onClick={() => setConfirmOpen(true)}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
          {sending ? "Enviando..." : emCooldown ? "Lembrete enviado" : "Enviar lembrete"}
        </Button>
        <Button variant="ghost" size="sm" className="gap-2" onClick={copiarLink}>
          <Copy className="h-4 w-4" />
          Copiar link de assinatura
        </Button>
      </div>
      {!telefoneOk && (
        <p className="text-xs text-muted-foreground">
          Sem telefone válido cadastrado — copie o link e compartilhe por outro canal.
        </p>
      )}
      {emCooldown && (
        <p className="text-xs text-muted-foreground">
          Aguarde alguns instantes antes de enviar outro lembrete.
        </p>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={(o) => { if (!sending) setConfirmOpen(o); }}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar lembrete para {funcionarioNome}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Será enviada uma mensagem via WhatsApp para{" "}
                  <span className="font-medium text-foreground">{funcionarioTelefone}</span>.
                </p>
                <p className="rounded-lg border border-border/80 bg-muted/30 p-3 text-xs leading-relaxed text-foreground">
                  {mensagem}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto" disabled={sending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full sm:w-auto"
              disabled={sending}
              onClick={(e) => { e.preventDefault(); void enviar(); }}
            >
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar envio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
