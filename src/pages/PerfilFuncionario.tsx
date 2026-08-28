import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Upload, Eye, Pen, FileText, Loader2, Printer, GraduationCap, Save, KeyRound } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import UploadDocumentoModal from "@/components/UploadDocumentoModal";
import UploadTreinamentoModal from "@/components/UploadTreinamentoModal";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";


interface Funcionario {
  id: string;
  nome: string;
  cpf: string | null;
  cargo: string;
  status: string;
  access_pin: string | null;
}

interface Document {
  id: string;
  title: string;
  doc_category: string;
  file_url: string | null;
  expiration_date: string | null;
  issue_date: string | null;
  workload_hours: number | null;
  provider_or_lead: string | null;
  reference_period: string | null;
  signature_status: string;
  signed_at: string | null;
  created_at: string | null;
}

const TABS = [
  { value: "admissao_rescisao", label: "Admissão / Rescisão", categories: ["admissao", "rescisao"] },
  { value: "aso", label: "Saúde / ASO", categories: ["aso_exames", "aso"] },
  { value: "treinamento", label: "Treinamentos / NRs", categories: ["treinamento_nr"] },
  { value: "holerite", label: "Holerites", categories: ["holerite"] },
  { value: "ponto", label: "Cartão de Ponto", categories: ["cartao_ponto"] },
  { value: "epi", label: "Fichas de EPI", categories: ["epi"] },
];

function SignatureBadge({ status, signedAt }: { status: string; signedAt?: string | null }) {
  if (status === "assinado") return (
    <div className="flex flex-col items-start">
      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">✓ Assinado</Badge>
      {signedAt && <span className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(signedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>}
    </div>
  );
  if (status === "pendente") return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Pendente</Badge>;
  return <Badge variant="secondary">Não Aplicável</Badge>;
}

function ExpirationCell({ date }: { date: string | null }) {
  if (!date) return <span className="text-muted-foreground">—</span>;
  const days = differenceInDays(new Date(date), new Date());
  const isExpired = days < 0;
  const isNear = days >= 0 && days <= 30;
  return (
    <span className={isExpired ? "text-destructive font-semibold" : isNear ? "text-amber-600 font-medium" : "text-foreground"}>
      {format(new Date(date), "dd/MM/yyyy")}
      {isExpired && " (Vencido)"}
      {isNear && !isExpired && ` (${days}d)`}
    </span>
  );
}

function handlePrint(func: Funcionario, docs: Document[], category: string, empresa: any) {
  const filtered = docs.filter((d) => {
    if (category === "epi") return d.doc_category === "epi";
    if (category === "holerite") return d.doc_category === "holerite";
    return false;
  });

  const printWin = window.open("", "_blank");
  if (!printWin) return;

  const rows = filtered.map((d) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${d.title}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${d.created_at ? format(new Date(d.created_at), "dd/MM/yyyy") : "—"}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${d.reference_period || "—"}</td>
    </tr>
  `).join("");

  printWin.document.write(`
    <html><head><title>Ficha - ${func.nome}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a1a; }
      h1 { font-size: 18px; margin-bottom: 4px; }
      .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th { text-align: left; padding: 8px; border-bottom: 2px solid #1a1a1a; font-size: 13px; }
      td { font-size: 13px; }
      .footer { margin-top: 60px; border-top: 1px solid #1a1a1a; padding-top: 8px; font-size: 12px; }
      .sig-line { margin-top: 60px; border-top: 1px solid #1a1a1a; width: 300px; }
      .sig-label { font-size: 11px; color: #6b7280; margin-top: 4px; }
      @media print { body { margin: 20mm; } }
    </style></head><body>
    <h1>${empresa?.nome_fantasia || "Ava Safeguard"}</h1>
    <p class="subtitle">Ficha de ${category === "epi" ? "EPIs Entregues" : "Holerites"}</p>
    <p><strong>Funcionário:</strong> ${func.nome}</p>
    <p><strong>CPF:</strong> ${func.cpf || "—"} &nbsp; <strong>Cargo:</strong> ${func.cargo}</p>
    <table>
      <thead><tr><th>Documento</th><th>Data</th><th>Referência</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      <p>Declaro que recebi e estou de posse dos itens acima listados.</p>
      <div class="sig-line"></div>
      <p class="sig-label">Assinatura do Colaborador — Data: ___/___/______</p>
    </div>
    <script>window.print();</script>
    </body></html>
  `);
  printWin.document.close();
}

export default function PerfilFuncionario() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { empresa } = useAuth();
  const [func, setFunc] = useState<Funcionario | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [treinamentoOpen, setTreinamentoOpen] = useState(false);
  const [editCpf, setEditCpf] = useState("");
  const [editPin, setEditPin] = useState("");
  const [savingAccess, setSavingAccess] = useState(false);

  const loadData = () => {
    if (!id) return;
    Promise.all([
      supabase.from("funcionarios").select("id, nome, cpf, cargo, status, access_pin").eq("id", id).single(),
      supabase.from("documents").select("*").eq("funcionario_id", id).order("created_at", { ascending: false }),
    ]).then(([funcRes, docsRes]) => {
      if (funcRes.data) {
        const f = funcRes.data as Funcionario;
        setFunc(f);
        setEditCpf(f.cpf || "");
        setEditPin(f.access_pin || "");
      }
      if (docsRes.data) setDocs(docsRes.data as Document[]);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, [id]);

  const handleSaveAccess = async () => {
    if (!func) return;
    const cpfClean = editCpf.replace(/\D/g, "");
    if (cpfClean && cpfClean.length !== 11) {
      toast.error("CPF deve ter 11 dígitos.");
      return;
    }
    if (editPin && (editPin.length < 4 || editPin.length > 6 || !/^\d+$/.test(editPin))) {
      toast.error("PIN deve ter entre 4 e 6 dígitos numéricos.");
      return;
    }
    setSavingAccess(true);
    const { error } = await supabase
      .from("funcionarios")
      .update({ cpf: cpfClean || null, access_pin: editPin || null })
      .eq("id", func.id);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Dados de acesso atualizados!");
      loadData();
    }
    setSavingAccess(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!func) return <div className="py-20 text-center text-muted-foreground">Funcionário não encontrado.</div>;

  const renderTable = (categories: string[], tabValue: string) => {
    const filtered = docs.filter((d) => categories.includes(d.doc_category));
    if (filtered.length === 0)
      return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum documento nesta categoria.</p>;

    const isTraining = tabValue === "treinamento";
    const isHolerite = tabValue === "holerite";
    const isEpi = tabValue === "epi";
    const showPrint = isHolerite || isEpi;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Documento</th>
              {isTraining && <th className="px-4 py-3 text-left font-medium text-muted-foreground">Carga Horária</th>}
              {isHolerite && <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mês/Ano</th>}
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{isTraining ? "Data" : "Inserido em"}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vencimento</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assinatura</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((doc) => (
              <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  {doc.title}
                </td>
                {isTraining && <td className="px-4 py-3 text-muted-foreground">{doc.workload_hours ? `${doc.workload_hours}h` : "—"}</td>}
                {isHolerite && <td className="px-4 py-3 text-muted-foreground">{doc.reference_period || "—"}</td>}
                <td className="px-4 py-3 text-muted-foreground">
                  {(doc.issue_date || doc.created_at) ? format(new Date(doc.issue_date || doc.created_at!), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                </td>
                <td className="px-4 py-3"><ExpirationCell date={doc.expiration_date} /></td>
                <td className="px-4 py-3"><SignatureBadge status={doc.signature_status} signedAt={doc.signed_at} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {doc.file_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4 mr-1" /> Ver</a>
                      </Button>
                    )}
                    {doc.signature_status === "pendente" && (
                      <Button variant="ghost" size="sm" className="text-amber-600">
                        <Pen className="h-4 w-4 mr-1" /> Assinar
                      </Button>
                    )}
                    {showPrint && (
                      <Button variant="ghost" size="sm" onClick={() => handlePrint(func, docs, isEpi ? "epi" : "holerite", empresa)}>
                        <Printer className="h-4 w-4 mr-1" /> Imprimir
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[1240px] space-y-6">
      <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => navigate("/app/funcionarios")}><ArrowLeft className="h-4 w-4" /></Button><div><p className="app-eyebrow">Cadastro e prontuário</p><h1 className="mt-1 text-[27px] font-bold tracking-tight text-foreground">Perfil do funcionário</h1></div></div>

      {/* Profile Card */}
      <div className="flex flex-col gap-4 rounded-lg border border-border/80 bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">{func.nome}</h2>
            <Badge className={func.status === "ativo"
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
              : "bg-destructive/10 text-destructive border-destructive/20"
            }>
              {func.status === "ativo" ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{func.cargo}</p>
          {func.cpf && <p className="text-sm text-muted-foreground">CPF: {func.cpf}</p>}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setUploadOpen(true)} className="flex-1 sm:flex-initial">
            <Upload className="mr-2 h-4 w-4" /> Documento
          </Button>
          <Button onClick={() => setTreinamentoOpen(true)} variant="outline" className="flex-1 sm:flex-initial">
            <GraduationCap className="mr-2 h-4 w-4" /> Treinamento
          </Button>
        </div>
      </div>

      {/* Portal Access - CPF & PIN */}
      <div className="rounded-lg border border-border/80 bg-card p-4 shadow-card sm:p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-border/70 pb-4"><KeyRound className="h-4 w-4 text-primary" /><div><p className="app-eyebrow">Acesso digital</p><h3 className="mt-1 text-sm font-bold text-foreground">Portal do colaborador</h3></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">CPF</Label>
            <Input
              value={editCpf}
              onChange={(e) => setEditCpf(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="00000000000"
              inputMode="numeric"
              className="tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">PIN de Acesso (4-6 dígitos)</Label>
            <Input
              value={editPin}
              onChange={(e) => setEditPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••"
              inputMode="numeric"
              className="tabular-nums"
            />
          </div>
          <Button onClick={handleSaveAccess} disabled={savingAccess} className="gap-2">
            {savingAccess ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Acesso
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Esses dados permitem que o funcionário acesse o Portal do Colaborador em <strong>/portal</strong>.
        </p>
      </div>

      {/* Kit de EPI do cargo */}
      {func && (
        <KitEpiSection
          funcionarioId={func.id}
          cargoNome={func.cargo}
          canRegister={perfil?.role !== "rh"}
        />
      )}



      {/* Tabs */}

      <Tabs defaultValue="admissao_rescisao">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg border border-border/80 bg-card p-1 shadow-card">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="flex-1 min-w-[100px] text-xs sm:text-sm">{t.label}</TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-card">
              {renderTable(t.categories, t.value)}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <UploadDocumentoModal open={uploadOpen} onOpenChange={setUploadOpen} funcionarioId={func.id} onSuccess={loadData} />
      <UploadTreinamentoModal open={treinamentoOpen} onOpenChange={setTreinamentoOpen} funcionarioId={func.id} onSuccess={loadData} />
    </div>
  );
}
