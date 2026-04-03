import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { triggerInviteWebhook } from "@/lib/webhook";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { UserPlus, Loader2, Trash2, MailPlus, Users, ShieldCheck } from "lucide-react";

interface TeamMember {
  id: string;
  nome_completo: string;
  role: string;
  status: string;
  email?: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  admin: {
    label: "Administrador",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Acesso total ao sistema. Pode convidar e remover usuários, editar configurações e visualizar todos os dados.",
  },
  tecnico_seguranca: {
    label: "Técnico de Segurança",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "Acesso a entregas de EPI, laudos, treinamentos e documentos de segurança. Não gerencia usuários ou configurações.",
  },
  rh: {
    label: "RH",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Acesso a funcionários, holerites, admissão/rescisão e ASOs. Não acessa entregas de EPI ou laudos técnicos.",
  },
  almoxarifado: {
    label: "Almoxarifado",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    description: "Acesso restrito à entrega de EPIs e visualização de estoque. Não visualiza laudos ou holerites.",
  },
};

export default function GestaoEquipe() {
  const { perfil } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");

  // Buscar nome da empresa
  useEffect(() => {
    const fetchEmpresa = async () => {
      if (!perfil?.empresa_id) return;
      const { data } = await supabase
        .from("empresas")
        .select("nome_fantasia")
        .eq("id", perfil.empresa_id)
        .maybeSingle();
      if (data) setEmpresaNome(data.nome_fantasia);
    };
    fetchEmpresa();
  }, [perfil?.empresa_id]);

  const fetchTeam = async () => {
    if (!perfil?.empresa_id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("perfis")
      .select("id, nome_completo, role, status, email")
      .eq("empresa_id", perfil.empresa_id);

    if (error) {
      toast.error("Erro ao carregar equipe");
      setLoading(false);
      return;
    }

    setMembers((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTeam();
  }, [perfil?.empresa_id]);

  const handleInvite = async () => {
    if (!formName || !formEmail || !formRole) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (!perfil?.empresa_id) return;

    setInviting(true);

    try {
      // Use the signup-onboarding edge function or admin invite
      const { data, error } = await supabase.functions.invoke("signup-onboarding", {
        body: {
          email: formEmail,
          nome: formName,
          empresa_id: perfil.empresa_id,
          role: formRole,
          is_invite: true,
        },
      });

      if (error) throw error;

      const responseData = data as any;
      const senha = responseData?.temp_password || "";

      // Dispara webhook para n8n
      await triggerInviteWebhook({ nome: formName, email: formEmail, empresa_nome: empresaNome, senha, cargo: ROLE_CONFIG[formRole as keyof typeof ROLE_CONFIG]?.label || formRole });

      if (responseData?.temp_password) {
        toast.success(
          `Convite criado! Senha temporária: ${responseData.temp_password}`,
          { duration: 15000 }
        );
      } else {
        toast.success(`Convite enviado para ${formEmail}`);
      }
      setModalOpen(false);
      setFormName("");
      setFormEmail("");
      setFormRole("");
      fetchTeam();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar convite");
    } finally {
      setInviting(false);
    }
  };

  const handleResend = async (member: TeamMember) => {
    if (!perfil?.empresa_id) return;
    setResendingId(member.id);
    try {
      const { data, error } = await supabase.functions.invoke("signup-onboarding", {
        body: {
          resend_user_id: member.id,
          email: member.email || "",
          nome: member.nome_completo,
          empresa_id: perfil.empresa_id,
          role: member.role,
          is_invite: true,
        },
      });
      if (error) throw error;

      const resendData = data as any;

      // Dispara webhook para n8n no reenvio
      const memberEmail = resendData?.email || member.email || "";
      await triggerInviteWebhook({ nome: member.nome_completo, email: memberEmail, empresa_nome: empresaNome, senha: resendData?.temp_password || "", cargo: ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG]?.label || member.role });

      toast.success(`Convite reenviado para ${member.nome_completo}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao reenviar convite");
    } finally {
      setResendingId(null);
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (memberId === perfil?.id) {
      toast.error("Você não pode remover a si mesmo");
      return;
    }

    const confirmed = window.confirm(`Deseja remover o acesso de ${memberName}?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("perfis")
      .update({ status: "removido" } as any)
      .eq("id", memberId);

    if (error) {
      toast.error("Erro ao remover acesso");
    } else {
      toast.success("Acesso removido com sucesso");
      fetchTeam();
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const getRoleConfig = (role: string) =>
    ROLE_CONFIG[role] || { label: role, color: "bg-muted text-muted-foreground", description: "" };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Gestão de Acessos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie quem tem acesso ao painel da empresa
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Convidar Usuário
        </Button>
      </div>

      {/* Team Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
              <Users className="h-8 w-8" />
              <p className="text-sm">Nenhum membro encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Nível de Acesso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members
                    .filter((m) => (m as any).status !== "removido")
                    .map((member) => {
                      const roleConf = getRoleConfig(member.role);
                      const isPending = (member as any).status === "pendente";
                      const isSelf = member.id === perfil?.id;

                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                  {getInitials(member.nome_completo)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {member.nome_completo}
                                  {isSelf && (
                                    <span className="ml-1 text-xs text-muted-foreground">(você)</span>
                                  )}
                                </p>
                                {member.email && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {member.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${roleConf.color} border text-xs font-medium`}
                            >
                              {roleConf.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isPending ? (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                                Pendente
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                Ativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isPending && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  title="Reenviar convite"
                                  disabled={resendingId === member.id}
                                  onClick={() => handleResend(member)}
                                >
                                  {resendingId === member.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MailPlus className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              {!isSelf && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  title="Remover acesso"
                                  onClick={() => handleRemove(member.id, member.nome_completo)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Convidar Novo Usuário
            </DialogTitle>
            <DialogDescription>
              O convite e a senha temporária serão enviados para o e-mail informado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="inv-name">Nome Completo</Label>
              <Input
                id="inv-name"
                placeholder="Ex: João Silva"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-email">E-mail Corporativo</Label>
              <Input
                id="inv-email"
                type="email"
                placeholder="joao@empresa.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                O convite e a senha temporária serão enviados para este e-mail.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Nível de Acesso</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_CONFIG).map(([key, conf]) => (
                    <SelectItem key={key} value={key}>
                      {conf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Role description */}
              {formRole && ROLE_CONFIG[formRole] && (
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {ROLE_CONFIG[formRole].description}
                  </p>
                </div>
              )}
            </div>

            <Button onClick={handleInvite} disabled={inviting} className="w-full gap-2">
              {inviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MailPlus className="h-4 w-4" />
              )}
              {inviting ? "Enviando..." : "Enviar Convite"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
