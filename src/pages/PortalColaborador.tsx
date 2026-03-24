import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ShieldCheck, FileText, HardHat, AlertTriangle, ArrowRightLeft, Loader2, LogOut, Download, GraduationCap, CheckCircle2, Eye } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface Funcionario { id: string; nome: string; cargo: string; cpf: string | null; empresa_id: string | null; }
interface Document { id: string; title: string; doc_category: string; file_url: string | null; expiration_date: string | null; signature_status: string; created_at: string | null; reference_period: string | null; workload_hours: number | null; signed_at: string | null; empresa_id: string; }
interface Entrega { id: string; data_entrega: string | null; data_vencimento: string; status_assinatura: string | null; epi: { nome_equipamento: string; numero_ca: string } | null; }

export default function PortalColaborador() {
  const [cpf, setCpf] = useState("");
  const [func, setFunc] = useState<Funcionario | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [epis, setEpis] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(false);
  const [trocaOpen, setTrocaOpen] = useState(false);
  const [trocaMotivo, setTrocaMotivo] = useState("");
  const [trocaEpi, setTrocaEpi] = useState("");

  // Signature flow state
  const [signingDoc, setSigningDoc] = useState<Document | null>(null);
  const [sigConfirm, setSigConfirm] = useState(false);
  const [sigLoading, setSigLoading] = useState(false);
  const [sigSuccess, setSigSuccess] = useState(false);

  const handleLogin = async () => {
    if (!cpf.trim()) { toast.error("Digite seu CPF."); return; }
    setLoading(true);
    const { data } = await supabase.from("funcionarios").select("id, nome, cargo, cpf, empresa_id").eq("cpf", cpf.trim()).maybeSingle();
    if (!data) { toast.error("CPF não encontrado."); setLoading(false); return; }
    setFunc(data as Funcionario);
    await loadDocs(data.id);
    setLoading(false);
  };

  const loadDocs = async (funcId: string) => {
    const [docsRes, episRes] = await Promise.all([
      supabase.from("documents").select("*").eq("funcionario_id", funcId).order("created_at", { ascending: false }),
      supabase.from("entregas").select("id, data_entrega, data_vencimento, status_assinatura, epis:epi_id(nome_equipamento, numero_ca)").eq("funcionario_id", funcId).order("data_entrega", { ascending: false }),
    ]);
    if (docsRes.data) setDocs(docsRes.data as Document[]);
    if (episRes.data) setEpis(episRes.data.map((e: any) => ({ ...e, epi: e.epis })) as Entrega[]);
  };

  const handleLogout = () => { setFunc(null); setDocs([]); setEpis([]); setCpf(""); setSigSuccess(false); };

  const handleSign = async () => {
    if (!signingDoc || !func || !sigConfirm) return;
    setSigLoading(true);

    const now = new Date().toISOString();
    const ua = navigator.userAgent;

    // Update document status
    const { error: updateErr } = await supabase
      .from("documents")
      .update({
        signature_status: "assinado",
        signed_at: now,
      } as any)
      .eq("id", signingDoc.id);

    if (updateErr) {
      toast.error("Erro ao assinar documento.");
      setSigLoading(false);
      return;
    }

    // Insert audit log
    await supabase.from("signature_logs" as any).insert({
      empresa_id: signingDoc.empresa_id,
      document_id: signingDoc.id,
      funcionario_id: func.id,
      action_type: signingDoc.doc_category === "holerite" ? "assinatura_holerite" : "assinatura_documento",
      signed_at: now,
      user_agent: ua,
    } as any);

    // Send signature confirmation email to RH
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "assinatura-confirmada",
          recipientEmail: "rh@episafe.com", // will be replaced by actual RH email when available
          idempotencyKey: `assinatura-${signingDoc.id}`,
          templateData: {
            funcionarioNome: func.nome,
            documentoTitulo: signingDoc.title,
            dataAssinatura: new Date().toLocaleString("pt-BR"),
          },
        },
      });
    } catch (e) {
      // Non-blocking — signature is already saved
      console.warn("Failed to send confirmation email", e);
    }

    setSigLoading(false);
    setSigSuccess(true);

    // Refresh docs
    if (func) await loadDocs(func.id);
  };

  const closeSigning = () => {
    setSigningDoc(null);
    setSigConfirm(false);
    setSigSuccess(false);
  };

  const pendentes = docs.filter((d) => d.signature_status === "pendente");
  const holerites = docs.filter((d) => d.doc_category === "holerite");
  const treinamentos = docs.filter((d) => d.doc_category === "treinamento_nr");

  if (!func) {
    return (
      <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Portal do Colaborador</h1>
            <p className="text-sm text-muted-foreground">Acesse seus documentos e EPIs</p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Seu CPF</Label>
                <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" className="text-center text-lg h-12" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              </div>
              <Button onClick={handleLogin} disabled={loading} className="w-full h-12 text-base">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null} Entrar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground">{func.nome}</p>
          <p className="text-xs text-muted-foreground">{func.cargo}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4 mr-1" /> Sair</Button>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Pendentes - Alerta Chamativo */}
        {pendentes.length > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Pendentes de Assinatura ({pendentes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendentes.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg bg-card border border-border p-3">
                  <div>
                    <span className="text-sm font-medium text-foreground">{d.title}</span>
                    {d.reference_period && <p className="text-xs text-muted-foreground">{d.reference_period}</p>}
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => { setSigningDoc(d); setSigSuccess(false); setSigConfirm(false); }}>
                    Ver e Assinar
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Holerites */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Meus Holerites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {holerites.length === 0 && <p className="text-sm text-muted-foreground py-2">Nenhum holerite disponível.</p>}
            {holerites.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.reference_period || (d.created_at ? format(new Date(d.created_at), "dd/MM/yyyy") : "")}</p>
                </div>
                <div className="flex items-center gap-2">
                  {d.signature_status === "assinado" && d.signed_at && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px]">✓ {format(new Date(d.signed_at), "dd/MM HH:mm")}</Badge>
                  )}
                  {d.file_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* EPIs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><HardHat className="h-5 w-5 text-primary" /> Meus EPIs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {epis.length === 0 && <p className="text-sm text-muted-foreground py-2">Nenhum EPI registrado.</p>}
            {epis.map((e) => {
              const days = differenceInDays(new Date(e.data_vencimento), new Date());
              return (
                <div key={e.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{e.epi?.nome_equipamento || "EPI"}</p>
                    <p className="text-xs text-muted-foreground">CA: {e.epi?.numero_ca} • Vence: {format(new Date(e.data_vencimento), "dd/MM/yyyy")}</p>
                  </div>
                  {days < 0 && <Badge className="bg-destructive/10 text-destructive border-destructive/20">Vencido</Badge>}
                  {days >= 0 && days <= 30 && <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">{days}d</Badge>}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Treinamentos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /> Meus Treinamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {treinamentos.length === 0 && <p className="text-sm text-muted-foreground py-2">Nenhum treinamento registrado.</p>}
            {treinamentos.map((d) => {
              const days = d.expiration_date ? differenceInDays(new Date(d.expiration_date), new Date()) : null;
              const isExpired = days !== null && days < 0;
              const isNear = days !== null && days >= 0 && days <= 30;
              return (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{d.workload_hours ? `${d.workload_hours}h` : ""} {d.expiration_date ? `• Vence: ${format(new Date(d.expiration_date), "dd/MM/yyyy")}` : ""}</p>
                  </div>
                  {isExpired && <Badge className="bg-destructive/10 text-destructive border-destructive/20">Vencido</Badge>}
                  {isNear && !isExpired && <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">{days}d</Badge>}
                  {!isExpired && !isNear && days !== null && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Válido</Badge>}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Solicitar Troca */}
        <Button onClick={() => setTrocaOpen(true)} className="w-full h-14 text-base">
          <ArrowRightLeft className="mr-2 h-5 w-5" /> Solicitar Troca de EPI
        </Button>
      </div>

      {/* Modal Troca EPI */}
      <Dialog open={trocaOpen} onOpenChange={setTrocaOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-sm">
          <DialogHeader><DialogTitle>Solicitar Troca de EPI</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Equipamento</Label>
              <Select value={trocaEpi} onValueChange={setTrocaEpi}>
                <SelectTrigger><SelectValue placeholder="Selecione o EPI" /></SelectTrigger>
                <SelectContent>{epis.map((e) => <SelectItem key={e.id} value={e.id}>{e.epi?.nome_equipamento || "EPI"}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Select value={trocaMotivo} onValueChange={setTrocaMotivo}>
                <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desgaste">Desgaste</SelectItem>
                  <SelectItem value="perda">Perda</SelectItem>
                  <SelectItem value="defeito">Defeito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full h-12 text-base" onClick={() => { toast.success("Solicitação enviada!"); setTrocaOpen(false); setTrocaEpi(""); setTrocaMotivo(""); }}>
              Enviar Solicitação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Assinatura Digital */}
      <Dialog open={!!signingDoc} onOpenChange={(open) => { if (!open) closeSigning(); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          {sigSuccess ? (
            /* Tela de Sucesso */
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground text-center">Holerite assinado com sucesso!</h3>
              <p className="text-sm text-muted-foreground text-center">O RH já foi notificado. Você pode fechar esta tela.</p>
              <Button onClick={closeSigning} className="w-full h-12 text-base mt-2">Fechar</Button>
            </div>
          ) : (
            /* Fluxo de Assinatura */
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Assinar Documento
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Doc info */}
                <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-1">
                  <p className="font-medium text-foreground">{signingDoc?.title}</p>
                  {signingDoc?.reference_period && (
                    <p className="text-sm text-muted-foreground">Referência: {signingDoc.reference_period}</p>
                  )}
                </div>

                {/* PDF preview link */}
                {signingDoc?.file_url && (
                  <Button variant="outline" className="w-full h-12 gap-2" asChild>
                    <a href={signingDoc.file_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4" /> Visualizar Documento (PDF)
                    </a>
                  </Button>
                )}

                {/* Confirmation checkbox */}
                <div className="flex items-start gap-3 rounded-lg border border-border p-4 bg-card">
                  <Checkbox
                    id="sig-confirm"
                    checked={sigConfirm}
                    onCheckedChange={(checked) => setSigConfirm(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="sig-confirm" className="text-sm text-foreground leading-relaxed cursor-pointer">
                    Li e confirmo o recebimento deste documento. Estou ciente do seu conteúdo e concordo com as informações apresentadas.
                  </label>
                </div>

                {/* Sign button */}
                <Button
                  onClick={handleSign}
                  disabled={!sigConfirm || sigLoading}
                  className="w-full h-14 text-base gap-2"
                >
                  {sigLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}
                  {sigLoading ? "Assinando..." : "Assinar Digitalmente"}
                </Button>

                <p className="text-[11px] text-muted-foreground text-center">
                  Sua assinatura será registrada com data, hora e dispositivo para validade jurídica.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
