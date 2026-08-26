import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { User, Lock, Loader2 } from "lucide-react";

export default function Seguranca() {
  const { perfil, user } = useAuth();
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [savingSenha, setSavingSenha] = useState(false);

  useEffect(() => {
    if (perfil) setNomeCompleto(perfil.nome_completo);
  }, [perfil]);

  const handleSavePerfil = async () => {
    if (!user) return;
    setSavingPerfil(true);
    const { error } = await supabase.from("perfis").update({ nome_completo: nomeCompleto }).eq("id", user.id);
    setSavingPerfil(false);
    if (error) { toast.error("Erro ao atualizar perfil"); } else { toast.success("Perfil atualizado!"); }
  };

  const handleChangePassword = async () => {
    if (novaSenha.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
    if (novaSenha !== confirmarSenha) { toast.error("As senhas não coincidem"); return; }
    setSavingSenha(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setSavingSenha(false);
    if (error) { toast.error("Erro ao alterar senha"); } else {
      toast.success("Senha alterada com sucesso!");
      setNovaSenha("");
      setConfirmarSenha("");
    }
  };

  return (
    <div className="mx-auto max-w-[980px] space-y-6">
      <div><p className="app-eyebrow">Administração da conta</p><h1 className="mt-1 text-[27px] font-bold tracking-tight text-foreground">Segurança</h1><p className="mt-2 text-sm text-muted-foreground">Gerencie seu perfil e mantenha suas credenciais protegidas.</p></div>

      <Card>
        <CardHeader className="px-4 sm:px-6"><p className="app-eyebrow">Identidade</p>
          <CardTitle className="mt-1 flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-primary" />
            Meu Perfil
          </CardTitle>
          <CardDescription>Atualize suas informações pessoais.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={user?.email ?? ""} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome_completo">Nome Completo</Label>
            <Input id="nome_completo" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} />
          </div>
          <Button onClick={handleSavePerfil} disabled={savingPerfil} className="w-full sm:w-auto">
            {savingPerfil ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Salvar Perfil
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4 sm:px-6"><p className="app-eyebrow">Identidade</p>
          <CardTitle className="mt-1 flex items-center gap-2 text-base">
            <Lock className="h-5 w-5 text-primary" />
            Alterar Senha
          </CardTitle>
          <CardDescription>Defina uma nova senha para sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="space-y-2">
            <Label htmlFor="nova_senha">Nova Senha</Label>
            <Input id="nova_senha" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar_senha">Confirmar Nova Senha</Label>
            <Input id="confirmar_senha" type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Repita a nova senha" />
          </div>
          <Button onClick={handleChangePassword} disabled={savingSenha} className="w-full sm:w-auto">
            {savingSenha ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Alterar Senha
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
