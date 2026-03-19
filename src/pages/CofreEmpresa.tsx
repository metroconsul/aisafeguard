import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, FolderLock, FileText, Eye, Loader2, Upload, X } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface Doc {
  id: string;
  title: string;
  worksite: string | null;
  file_url: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  provider_or_lead: string | null;
  created_at: string | null;
}

const TIPOS_LAUDO = [
  { value: "PGR", label: "PGR" },
  { value: "PCMSO", label: "PCMSO" },
  { value: "LTCAT", label: "LTCAT" },
  { value: "AVCB", label: "AVCB" },
  { value: "Alvará", label: "Alvará" },
  { value: "Outros", label: "Outros" },
];

const OBRAS = ["Sede", "Filial", "Obra 01", "Obra 02", "Campo"];

export default function CofreEmpresa() {
  const { perfil } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [tipo, setTipo] = useState("");
  const [obra, setObra] = useState("");
  const [emissao, setEmissao] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadDocs = () => {
    if (!perfil?.empresa_id) return;
    supabase
      .from("documents")
      .select("id, title, worksite, file_url, issue_date, expiration_date, provider_or_lead, created_at")
      .eq("empresa_id", perfil.empresa_id)
      .eq("doc_category", "laudo_empresa")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setDocs(data as Doc[]);
        setLoading(false);
      });
  };

  useEffect(() => { loadDocs(); }, [perfil?.empresa_id]);

  const worksites = Array.from(new Set(docs.map((d) => d.worksite || "Geral")));
  if (worksites.length === 0) worksites.push("Geral");

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") setFile(f);
    else toast.error("Apenas PDFs.");
  }, []);

  const handleSave = async () => {
    if (!tipo || !obra || !emissao || !vencimento || !file) {
      toast.error("Preencha todos os campos obrigatórios e selecione um PDF.");
      return;
    }
    if (!perfil?.empresa_id) return;

    setSaving(true);
    try {
      const filePath = `${perfil.empresa_id}/laudos/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("company_vault").upload(filePath, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("company_vault").getPublicUrl(filePath);

      const { error } = await supabase.from("documents").insert({
        empresa_id: perfil.empresa_id,
        funcionario_id: null as any, // company-level doc
        title: tipo,
        doc_category: "laudo_empresa",
        worksite: obra,
        file_url: urlData.publicUrl,
        issue_date: emissao,
        expiration_date: vencimento,
        provider_or_lead: responsavel || null,
        signature_status: "nao_aplicavel",
      } as any);

      if (error) throw error;
      toast.success("Laudo salvo!");
      setTipo(""); setObra(""); setEmissao(""); setVencimento(""); setResponsavel(""); setFile(null);
      setModalOpen(false);
      loadDocs();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
            <FolderLock className="h-6 w-6 text-primary" /> Cofre da Empresa
          </h1>
          <p className="text-sm text-muted-foreground">Laudos e documentos organizados por Obra</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-1.5 h-4 w-4" /> Novo Laudo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <Tabs defaultValue={worksites[0]}>
          <TabsList className="w-full flex overflow-x-auto">
            {worksites.map((w) => (
              <TabsTrigger key={w} value={w} className="flex-1 min-w-[100px]">{w}</TabsTrigger>
            ))}
          </TabsList>
          {worksites.map((w) => {
            const filtered = docs.filter((d) => (d.worksite || "Geral") === w);
            return (
              <TabsContent key={w} value={w}>
                <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                  {filtered.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Nenhum laudo nesta obra.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[600px]">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Emissão</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vencimento</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Responsável</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filtered.map((doc) => {
                            const days = doc.expiration_date ? differenceInDays(new Date(doc.expiration_date), new Date()) : null;
                            const isExpired = days !== null && days < 0;
                            const isNear = days !== null && days >= 0 && days <= 30;
                            return (
                              <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary shrink-0" />
                                  {doc.title}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {doc.issue_date ? format(new Date(doc.issue_date), "dd/MM/yyyy") : "—"}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={isExpired ? "text-destructive font-semibold" : isNear ? "text-amber-600 font-medium" : "text-foreground"}>
                                    {doc.expiration_date ? format(new Date(doc.expiration_date), "dd/MM/yyyy") : "—"}
                                    {isExpired && " (Vencido)"}
                                    {isNear && ` (${days}d)`}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{doc.provider_or_lead || "—"}</td>
                                <td className="px-4 py-3 text-right">
                                  {doc.file_url && (
                                    <Button variant="ghost" size="sm" asChild>
                                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4 mr-1" /> Ver</a>
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {/* Modal Novo Laudo */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderLock className="h-5 w-5 text-primary" /> Novo Laudo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>{TIPOS_LAUDO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Obra *</Label>
              <Select value={obra} onValueChange={setObra}>
                <SelectTrigger><SelectValue placeholder="Selecione a obra" /></SelectTrigger>
                <SelectContent>{OBRAS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Emissão *</Label>
                <Input type="date" value={emissao} onChange={(e) => setEmissao(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Vencimento *</Label>
                <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Responsável Técnico</Label>
              <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Nome do Engenheiro" />
            </div>
            <div className="space-y-1.5">
              <Label>Documento PDF *</Label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{file.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Arraste o PDF ou clique</p>
                  </div>
                )}
                <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar Laudo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
