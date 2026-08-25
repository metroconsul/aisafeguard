import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

function formatCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export default function PortalLogin() {
  const { login, employee } = usePortalAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get("next");
  const safeNext = nextParam && nextParam.startsWith("/") ? nextParam : "/portal";
  const [cpf, setCpf] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in
  if (employee) {
    navigate(safeNext, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cpfClean = cpf.replace(/\D/g, "");
    if (cpfClean.length !== 11) {
      toast.error("CPF inválido. Informe os 11 dígitos.");
      return;
    }
    if (pin.length < 4 || pin.length > 6) {
      toast.error("PIN deve ter entre 4 e 6 dígitos.");
      return;
    }

    setSubmitting(true);
    try {
      await login(cpfClean, pin);
      navigate(safeNext, { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-background px-6">
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <ShieldCheck className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ava Safeguard</h1>
        <p className="text-sm text-muted-foreground">Portal do Colaborador</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-5">
        <div className="space-y-2">
          <Label htmlFor="cpf" className="text-sm font-semibold text-foreground">
            CPF
          </Label>
          <Input
            id="cpf"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            className="h-14 text-lg tracking-wider"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pin" className="text-sm font-semibold text-foreground">
            PIN de Acesso
          </Label>
          <Input
            id="pin"
            type="password"
            inputMode="numeric"
            placeholder="••••"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="h-14 text-center text-2xl tracking-[0.5em]"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground text-center">4 a 6 dígitos numéricos</p>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="h-14 w-full text-base font-semibold"
        >
          {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          Entrar
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Solicite seu PIN de acesso ao setor de RH ou Administração.
      </p>
    </div>
  );
}
