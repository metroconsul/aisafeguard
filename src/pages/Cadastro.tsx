import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function Cadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nomeEmpresa: "",
    nomeUsuario: "",
    email: "",
    senha: "",
  });
  const [loading, setLoading] = useState(false);

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

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (authError || !authData.user) {
      toast.error(authError?.message || "Erro ao criar conta.");
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    // 2. Create empresa
    const { data: empresaData, error: empresaError } = await supabase
      .from("empresas")
      .insert({ nome_fantasia: nomeEmpresa, cnpj: "" })
      .select("id")
      .single();

    if (empresaError || !empresaData) {
      toast.error("Erro ao criar empresa: " + (empresaError?.message || ""));
      setLoading(false);
      return;
    }

    // 3. Create perfil
    const { error: perfilError } = await supabase.from("perfis").insert({
      id: userId,
      empresa_id: empresaData.id,
      nome_completo: nomeUsuario,
      role: "admin",
    });

    if (perfilError) {
      toast.error("Erro ao criar perfil: " + perfilError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    toast.success("Conta criada! Verifique seu email para confirmar o cadastro.");
    navigate("/login");
  };

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">SafeGuard</h1>
          <p className="text-sm text-muted-foreground">Crie sua conta empresarial</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="space-y-2">
            <Label>Nome da Empresa</Label>
            <Input value={form.nomeEmpresa} onChange={(e) => update("nomeEmpresa", e.target.value)} placeholder="Minha Empresa Ltda" />
          </div>
          <div className="space-y-2">
            <Label>Seu Nome</Label>
            <Input value={form.nomeUsuario} onChange={(e) => update("nomeUsuario", e.target.value)} placeholder="João Silva" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="seu@email.com" />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input type="password" value={form.senha} onChange={(e) => update("senha", e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
