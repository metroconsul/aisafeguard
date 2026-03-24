import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useEffect } from "react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const validate = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (res.ok && data.valid) setStatus("valid");
        else if (data.reason === "already_unsubscribed") setStatus("already");
        else setStatus("invalid");
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>

          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Verificando...</p>
            </>
          )}

          {status === "valid" && (
            <>
              <AlertTriangle className="mx-auto h-10 w-10 text-warning" />
              <h2 className="text-lg font-semibold text-foreground">Cancelar inscrição</h2>
              <p className="text-sm text-muted-foreground">
                Ao confirmar, você deixará de receber e-mails automáticos do SafeGuard.
              </p>
              <Button onClick={handleUnsubscribe} disabled={processing} className="w-full">
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar cancelamento"}
              </Button>
            </>
          )}

          {status === "already" && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Já cancelado</h2>
              <p className="text-sm text-muted-foreground">Sua inscrição já foi cancelada anteriormente.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <h2 className="text-lg font-semibold text-foreground">Inscrição cancelada</h2>
              <p className="text-sm text-muted-foreground">
                Você não receberá mais e-mails automáticos do SafeGuard.
              </p>
            </>
          )}

          {status === "invalid" && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
              <h2 className="text-lg font-semibold text-foreground">Link inválido</h2>
              <p className="text-sm text-muted-foreground">Este link de cancelamento é inválido ou expirou.</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
              <h2 className="text-lg font-semibold text-foreground">Erro</h2>
              <p className="text-sm text-muted-foreground">Ocorreu um erro ao processar. Tente novamente mais tarde.</p>
            </>
          )}

          <Link to="/" className="block text-sm text-primary hover:underline mt-4">
            Voltar ao site
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
