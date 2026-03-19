import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Upload, Eye, Pen, FileText, Loader2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import UploadDocumentoModal from "@/components/UploadDocumentoModal";

interface Funcionario {
  id: string;
  nome: string;
  cpf: string | null;
  cargo: string;
  status: string;
}

interface Document {
  id: string;
  title: string;
  doc_category: string;
  file_url: string | null;
  expiration_date: string | null;
  signature_status: string;
  created_at: string | null;
}

const TABS = [
  { value: "admissao_rescisao", label: "Admissão / Rescisão", categories: ["admissao", "rescisao"] },
  { value: "aso", label: "Saúde / ASO", categories: ["aso_exames"] },
  { value: "holerite", label: "Holerites", categories: ["holerite"] },
  { value: "epi", label: "Fichas de EPI", categories: ["epi"] },
];

function SignatureBadge({ status }: { status: string }) {
  if (status === "assinado") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Assinado</Badge>;
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

export default function PerfilFuncionario() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [func, setFunc] = useState<Funcionario | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const loadData = () => {
    if (!id) return;
    Promise.all([
      supabase.from("funcionarios").select("id, nome, cpf, cargo, status").eq("id", id).single(),
      supabase.from("documents").select("*").eq("funcionario_id", id).order("created_at", { ascending: false }),
    ]).then(([funcRes, docsRes]) => {
      if (funcRes.data) setFunc(funcRes.data as Funcionario);
      if (docsRes.data) setDocs(docsRes.data as Document[]);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, [id]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!func) return <div className="py-20 text-center text-muted-foreground">Funcionário não encontrado.</div>;

  const renderTable = (categories: string[]) => {
    const filtered = docs.filter((d) => categories.includes(d.doc_category));
    if (filtered.length === 0)
      return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum documento nesta categoria.</p>;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Documento</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Inserido em</th>
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
                <td className="px-4 py-3 text-muted-foreground">
                  {doc.created_at ? format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                </td>
                <td className="px-4 py-3"><ExpirationCell date={doc.expiration_date} /></td>
                <td className="px-4 py-3"><SignatureBadge status={doc.signature_status} /></td>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/funcionarios")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Perfil do Funcionário</h1>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
        <Button onClick={() => setUploadOpen(true)} className="w-full sm:w-auto">
          <Upload className="mr-2 h-4 w-4" /> Adicionar Documento
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="admissao_rescisao">
        <TabsList className="w-full flex overflow-x-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="flex-1 min-w-[120px]">{t.label}</TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              {renderTable(t.categories)}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <UploadDocumentoModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        funcionarioId={func.id}
        onSuccess={loadData}
      />
    </div>
  );
}
