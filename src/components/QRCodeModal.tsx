import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, AlertTriangle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IntegracaoWhatsApp } from "@/hooks/useIntegracoes";

type ConnectionState = "loading" | "showing_qr" | "connected" | "timeout" | "error";

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  integracao: IntegracaoWhatsApp | null;
  getQRCode: (instancia: string) => Promise<string | null>;
  checkConnectionStatus: (instancia: string) => Promise<boolean>;
  updateStatus: (id: string, status: string, skipEvent?: boolean) => Promise<any>;
}

export function QRCodeModal({
  open,
  onClose,
  integracao,
  getQRCode,
  checkConnectionStatus,
  updateStatus,
}: QRCodeModalProps) {
  const [state, setState] = useState<ConnectionState>("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(50);

  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedRef = useRef(false);
  const isTerminalStateRef = useRef(false);
  const hasUpdatedStatusRef = useRef(false);
  const instanceRef = useRef<string | null>(null);

  const getQRCodeRef = useRef(getQRCode);
  const checkStatusRef = useRef(checkConnectionStatus);
  const updateStatusRef = useRef(updateStatus);

  useEffect(() => { getQRCodeRef.current = getQRCode; }, [getQRCode]);
  useEffect(() => { checkStatusRef.current = checkConnectionStatus; }, [checkConnectionStatus]);
  useEffect(() => { updateStatusRef.current = updateStatus; }, [updateStatus]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) { clearTimeout(pollingRef.current); pollingRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  const resetState = useCallback(() => {
    stopPolling();
    setState("loading");
    setQrCode(null);
    setTimeLeft(50);
    hasStartedRef.current = false;
    isTerminalStateRef.current = false;
    hasUpdatedStatusRef.current = false;
    instanceRef.current = null;
  }, [stopPolling]);

  useEffect(() => {
    if (!open) { resetState(); return; }
    if (!integracao?.instancia) return;
    if (hasStartedRef.current && instanceRef.current === integracao.instancia) return;
    if (instanceRef.current && instanceRef.current !== integracao.instancia) resetState();

    hasStartedRef.current = true;
    instanceRef.current = integracao.instancia;

    const startConnection = async () => {
      const qr = await getQRCodeRef.current(integracao.instancia!);
      if (isTerminalStateRef.current || instanceRef.current !== integracao.instancia) return;

      if (qr === "ALREADY_CONNECTED") {
        isTerminalStateRef.current = true;
        setState("connected");
        if (!hasUpdatedStatusRef.current && integracao.id) {
          hasUpdatedStatusRef.current = true;
          await updateStatusRef.current(integracao.id, "conectado", true);
        }
        setTimeout(onClose, 2000);
        return;
      }

      if (qr) {
        setQrCode(qr);
        setState("showing_qr");
        startPolling();
      } else {
        isTerminalStateRef.current = true;
        setState("error");
      }
    };

    const startPolling = () => {
      if (!integracao?.instancia || isTerminalStateRef.current) return;
      let attempts = 0;

      countdownRef.current = setInterval(() => {
        if (isTerminalStateRef.current) { stopPolling(); return; }
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopPolling();
            isTerminalStateRef.current = true;
            setState("timeout");
            if (!hasUpdatedStatusRef.current && integracao.id) {
              hasUpdatedStatusRef.current = true;
              updateStatusRef.current(integracao.id, "desconectado", true);
            }
            setTimeout(onClose, 3000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const poll = async () => {
        if (isTerminalStateRef.current) return;
        if (attempts >= 25) {
          stopPolling();
          isTerminalStateRef.current = true;
          setState("timeout");
          return;
        }
        attempts++;
        const isConnected = await checkStatusRef.current(integracao.instancia!);
        if (isTerminalStateRef.current) return;

        if (isConnected) {
          stopPolling();
          isTerminalStateRef.current = true;
          setState("connected");
          if (!hasUpdatedStatusRef.current && integracao.id) {
            hasUpdatedStatusRef.current = true;
            await updateStatusRef.current(integracao.id, "conectado", true);
          }
          setTimeout(onClose, 2000);
          return;
        }
        if (!isTerminalStateRef.current) {
          pollingRef.current = setTimeout(poll, 2000);
        }
      };

      pollingRef.current = setTimeout(poll, 2000);
    };

    startConnection();
    return () => stopPolling();
  }, [open, integracao?.instancia, integracao?.id, onClose, resetState, stopPolling]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {state === "loading" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
            </>
          )}
          {state === "showing_qr" && qrCode && (
            <>
              <p className="text-sm text-muted-foreground">
                Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo
              </p>
              <img src={qrCode} alt="QR Code" className="h-64 w-64 rounded-lg border border-border" />
              <p className="text-xs text-muted-foreground">
                Expira em <span className="font-semibold text-foreground">{timeLeft}s</span>
              </p>
            </>
          )}
          {state === "connected" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-success" />
              <p className="text-sm font-medium text-success">WhatsApp conectado com sucesso!</p>
            </>
          )}
          {state === "timeout" && (
            <>
              <WifiOff className="h-12 w-12 text-warning" />
              <p className="text-sm font-medium text-warning">QR Code expirou</p>
              <Button variant="outline" onClick={resetState}>Tentar novamente</Button>
            </>
          )}
          {state === "error" && (
            <>
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <p className="text-sm font-medium text-destructive">Erro ao gerar QR Code</p>
              <Button variant="outline" onClick={onClose}>Fechar</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
