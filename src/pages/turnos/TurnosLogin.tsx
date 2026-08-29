import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CalendarDays, Loader2 } from "lucide-react";
import { DEFAULT_BRAND } from "@/restaurant/brand";
import { PRODUCT_HOME, PRODUCT_KEYS, fetchProductKey } from "@/lib/product-access";

/** Entrada exclusiva do produto de Operação de Turnos (restaurantes e bares). */
export default function TurnosLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(
        error.message === "Invalid login credentials" ? "Email ou senha inválidos." : error.message
      );
      return;
    }

    const productKey = await fetchProductKey();
    if (productKey && productKey !== PRODUCT_KEYS.restaurant) {
      toast.info("Sua conta pertence a outro produto. Redirecionando...");
      navigate(PRODUCT_HOME[productKey], { replace: true });
      return;
    }
    navigate(PRODUCT_HOME[PRODUCT_KEYS.restaurant], { replace: true });
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: DEFAULT_BRAND.SURFACE_COLOR }}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: DEFAULT_BRAND.PRIMARY_COLOR }}
          >
            <CalendarDays className="h-6 w-6 text-white" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: DEFAULT_BRAND.TEXT_COLOR }}>
            {DEFAULT_BRAND.BRAND_NAME}
          </h1>
          <p className="text-sm text-muted-foreground">{DEFAULT_BRAND.BRAND_TAGLINE}</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full text-white hover:opacity-90"
            style={{ backgroundColor: DEFAULT_BRAND.ACCENT_COLOR }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link to="/turnos/cadastro" className="font-medium underline">
            Cadastre seu restaurante
          </Link>
        </p>
      </div>
    </div>
  );
}
