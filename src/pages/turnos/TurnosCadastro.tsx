import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CalendarDays, Loader2 } from "lucide-react";
import { DEFAULT_BRAND } from "@/restaurant/brand";
import { PRODUCT_KEYS } from "@/lib/product-access";

/** Cadastro exclusivo do nicho de restaurantes e bares (Operação de Turnos). */
export default function TurnosCadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nomeEmpresa: "", nomeUsuario: "", email: "", senha: "" });
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { nomeEmpresa, nomeUsuario, email, senha } = form;
    if (!nomeEmpresa || !nomeUsuario || !email || !senha) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.functions.invoke("signup-onboarding", {
      body: {
        nome_empresa: nomeEmpresa,
        nome_usuario: nomeUsuario,
        email,
        senha,
        product_key: PRODUCT_KEYS.restaurant,
      },
    });
    setLoading(false);

    if (error) {
      toast.error(await readFunctionError(error, "Erro ao criar conta."));
      return;
    }
    if (data?.error) {
      toast.error(translateFunctionError(data.error) || data.error);
      return;
    }


    toast.success("Conta criada! Verifique seu email para confirmar o cadastro.");
    navigate("/turnos/login");
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
          <p className="text-sm text-muted-foreground">
            Crie a conta do seu restaurante ou bar
          </p>
        </div>

        <form
          onSubmit={handleSignup}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <div className="space-y-2">
            <Label>Nome do estabelecimento</Label>
            <Input
              value={form.nomeEmpresa}
              onChange={(e) => update("nomeEmpresa", e.target.value)}
              placeholder="Restaurante Central"
            />
          </div>
          <div className="space-y-2">
            <Label>Seu nome</Label>
            <Input
              value={form.nomeUsuario}
              onChange={(e) => update("nomeUsuario", e.target.value)}
              placeholder="João Silva"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input
              type="password"
              value={form.senha}
              onChange={(e) => update("senha", e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full text-white hover:opacity-90"
            style={{ backgroundColor: DEFAULT_BRAND.ACCENT_COLOR }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/turnos/login" className="font-medium underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
