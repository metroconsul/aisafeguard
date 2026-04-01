import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { UserPlus, Copy, Eye, Loader2, CheckCircle2, XCircle, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdmissionRequest {
  id: string;
  token: string;
  candidate_name: string;
  candidate_cpf: string | null;
  candidate_phone: string | null;
  status: string;
  created_at: string;
}

interface AdmissionDoc {
  id: string;
  doc_type: string;
  file_url: string;
  status: string;
  feedback_rh: string | null;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  aguardando_envio: { label: "Aguardando Envio", className: "bg-muted text-muted-foreground border-border" },
  em_analise: { label: "Em Análise", className: "bg-amber-100 text-amber-700 border-amber-300" },
  aprovado: { label: "Aprovado", className: "bg-green-100 text-green-700 border-green-300" },
  reprovado: { label: "Reprovado", className: "bg-red-100 text-red-700 border-red-300" },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  rg: "RG / Identidade",
  cpf: "CPF",
  comprovante_residencia: "Comprovante de Residência",
  carteira_trabalho: "Carteira de Trabalho",
};

export default function Admissoes() {
  const { perfil } = useAuth();
  const empresaId = perfil?.empresa_id;
  const [requests, setRequests] = useState<AdmissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewDocs, setReviewDocs] = useState<AdmissionDoc[]>([]);
  const [reviewRequest, setReviewRequest] = useState<AdmissionRequest | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState("");
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // New candidate form
  const [candidateName, setCandidateName] = useState("");
  const [candidateCpf, setCandidateCpf] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");

  const loadRequests = async () => {
    if (!empresaId) return;
    setLoading(true);
    const { data } = await supabase
      .from("admission_requests")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });
    setRequests((data as AdmissionRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, [empresaId]);

  const handleNewCandidate = async () => {
    if (!candidateName.trim()) { toast.error("Nome é obrigatório."); return; }
    if (!empresaId) return;
    setSaving(true);
    const { data, error } = await supabase.from("admission_requests").insert({
      empresa_id: empresaId,
      candidate_name: candidateName.trim(),
      candidate_cpf: candidateCpf.replace(/\D/g, "") || null,
      candidate_phone: candidatePhone || null,
    }).select().single();
    if (error) {
      toast.error("Erro ao criar candidato: " + error.message);
    } else {
      toast.success("Candidato criado com sucesso!");
      setCandidateName(""); setCandidateCpf(""); setCandidatePhone("");
      setNewModalOpen(false);
      loadRequests();
    }
    setSaving(false);
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/onboarding/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const openReview = async (req: AdmissionRequest) => {
    setReviewId(req.id);
    setReviewRequest(req);
    setLoadingDocs(true);
    const { data } = await supabase
      .from("admission_documents")
      .select("*")
      .eq("admission_id", req.id)
      .order("created_at", { ascending: true });
    setReviewDocs((data as AdmissionDoc[]) || []);
    setLoadingDocs(false);
  };

  const handleDocAction = async (docId: string, action: "aprovado" | "rejeitado", feedback?: string) => {
    const update: any = { status: action };
    if (feedback) update.feedback_rh = feedback;
    const { error } = await supabase.from("admission_documents").update(update).eq("id", docId);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(action === "aprovado" ? "Documento aprovado!" : "Documento rejeitado.");
    setRejectDocId(null);
    setRejectFeedback("");
    // Reload docs
    if (reviewId) {
      const { data } = await supabase.from("admission_documents").select("*").eq("admission_id", reviewId);
      setReviewDocs((data as AdmissionDoc[]) || []);
    }
  };

  const handleEfetivar = async () => {
    if (!reviewRequest || !empresaId) return;
    setSaving(true);
    // Create funcionario from candidate
    const { error: funcError } = await supabase.from("funcionarios").insert({
      empresa_id: empresaId,
      nome: reviewRequest.candidate_name,
      cpf: reviewRequest.candidate_cpf || null,
      telefone_whatsapp: reviewRequest.candidate_phone || null,
      cargo: "Novo Colaborador",
      matricula: `ADM-${Date.now().toString(36).toUpperCase()}`,
      setor: "A definir",
      status: "ativo",
    });
    if (funcError) { toast.error("Erro ao efetivar: " + funcError.message); setSaving(false); return; }
    // Update status to aprovado
    await supabase.from("admission_requests").update({ status: "aprovado" }).eq("id", reviewRequest.id);
    toast.success("Candidato efetivado como funcionário!");
    setReviewId(null);
    setReviewRequest(null);
    loadRequests();
    setSaving(false);
  };

  const allDocsApproved = reviewDocs.length > 0 && reviewDocs.every(d => d.status === "aprovado");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" />
          Gestão de Admissões
        </h1>
        <Button onClick={() => setNewModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Candidato
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <span className="text-3xl font-bold text-foreground">{requests.length}</span>
            <span className="text-sm text-muted-foreground">Total</span>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <span className="text-3xl font-bold text-amber-600">
              {requests.filter(r => r.status === "em_analise" || r.status === "aguardando_envio").length}
            </span>
            <span className="text-sm text-amber-700">Em Andamento</span>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <span className="text-3xl font-bold text-green-600">
              {requests.filter(r => r.status === "aprovado").length}
            </span>
            <span className="text-sm text-green-700">Efetivados</span>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidato</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
              ) : requests.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum candidato cadastrado.</TableCell></TableRow>
              ) : requests.map(req => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.candidate_name}</TableCell>
                  <TableCell>{req.candidate_cpf || "—"}</TableCell>
                  <TableCell>{req.candidate_phone || "—"}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_MAP[req.status]?.className || ""}>
                      {STATUS_MAP[req.status]?.label || req.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(req.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => copyLink(req.token)} title="Copiar link">
                        <Copy className="h-4 w-4" />
                      </Button>
                      {(req.status === "em_analise" || req.status === "aguardando_envio") && (
                        <Button variant="ghost" size="icon" onClick={() => openReview(req)} title="Revisar">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Candidate Modal */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Candidato</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome Completo *</Label>
              <Input value={candidateName} onChange={e => setCandidateName(e.target.value)} placeholder="Nome do candidato" />
            </div>
            <div className="space-y-1.5">
              <Label>CPF</Label>
              <Input value={candidateCpf} onChange={e => setCandidateCpf(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="00000000000" inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input value={candidatePhone} onChange={e => setCandidatePhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleNewCandidate} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Criar e Gerar Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={!!reviewId} onOpenChange={(o) => { if (!o) { setReviewId(null); setReviewRequest(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisão — {reviewRequest?.candidate_name}</DialogTitle>
          </DialogHeader>
          {loadingDocs ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : reviewDocs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum documento enviado pelo candidato ainda.</p>
          ) : (
            <div className="space-y-4">
              {reviewDocs.map(doc => (
                <div key={doc.id} className="rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}</span>
                    <Badge className={doc.status === "aprovado" ? "bg-green-100 text-green-700" : doc.status === "rejeitado" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}>
                      {doc.status === "aprovado" ? "Aprovado" : doc.status === "rejeitado" ? "Rejeitado" : "Pendente"}
                    </Badge>
                  </div>
                  <div className="rounded-lg border overflow-hidden bg-muted/30">
                    <img src={doc.file_url} alt={doc.doc_type} className="w-full max-h-64 object-contain" />
                  </div>
                  {doc.feedback_rh && <p className="text-sm text-red-600">Feedback: {doc.feedback_rh}</p>}
                  {doc.status === "pendente" && (
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleDocAction(doc.id, "aprovado")}>
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Aprovar
                      </Button>
                      {rejectDocId === doc.id ? (
                        <div className="flex gap-2 flex-1">
                          <Input value={rejectFeedback} onChange={e => setRejectFeedback(e.target.value)} placeholder="Motivo da rejeição..." className="flex-1" />
                          <Button size="sm" variant="destructive" onClick={() => handleDocAction(doc.id, "rejeitado", rejectFeedback)}>Confirmar</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => setRejectDocId(doc.id)}>
                          <XCircle className="mr-1 h-4 w-4" /> Rejeitar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {allDocsApproved && reviewRequest?.status !== "aprovado" && (
                <Button onClick={handleEfetivar} disabled={saving} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-5 w-5" />}
                  Efetivar Contratação
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
