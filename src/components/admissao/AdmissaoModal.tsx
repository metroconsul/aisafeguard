import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, FileText, Loader2, UserCheck, Trash2 } from "lucide-react";

interface Employee {
  id: string;
  nome: string;
  cargo: string;
  setor: string;
  cpf: string | null;
  telefone_whatsapp: string | null;
  empresa_id: string | null;
  admission_stage: string;
}

interface Doc {
  id: string;
  title: string;
  doc_category: string;
  file_url: string | null;
  created_at: string | null;
}

const DOC_TYPES = [
  { value: "rg", label: "RG / Identidade" },
  { value: "cpf_doc", label: "CPF" },
  { value: "aso", label: "ASO (Atestado de Saúde)" },
  { value: "contrato", label: "Contrato de Trabalho" },
  { value: "comprovante_residencia", label: "Comprovante de Residência" },
  { value: "carteira_trabalho", label: "Carteira de Trabalho" },
  { value: "outro", label: "Outro" },
];

interface Props {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
  onEfetivar: (emp: Employee) => void;
}

export default function AdmissaoModal({ employee, open, onClose, onEfetivar }: Props) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState("rg");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (employee && open) loadDocs();
  }, [employee, open]);

  const loadDocs = async () => {
    if (!employee) return;
    setLoading(true);
    const { data } = await supabase
      .from("documents")
      .select("id, title, doc_category, file_url, created_at")
      .eq("funcionario_id", employee.id)
      .order("created_at", { ascending: false });
    setDocs((data as Doc[]) || []);
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!employee || !fileRef.current?.files?.[0]) {
      toast.error("Selecione um arquivo.");
      return;
    }
    const file = fileRef.current.files[0];
    const ext = file.name.split(".").pop();
    const path = `admissao/${employee.id}/${selectedType}_${Date.now()}.${ext}`;

    setUploading(true);
    const { error: upErr } = await supabase.storage.from("admission-docs").upload(path, file);
    if (upErr) { toast.error("Erro upload: " + upErr.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("admission-docs").getPublicUrl(path);
    const label = DOC_TYPES.find(d => d.value === selectedType)?.label || selectedType;

    const { error: docErr } = await supabase.from("documents").insert({
      funcionario_id: employee.id,
      empresa_id: employee.empresa_id!,
      title: label,
      doc_category: selectedType,
      file_url: urlData.publicUrl,
      signature_status: "nao_aplicavel",
    });
    if (docErr) { toast.error("Erro ao salvar: " + docErr.message); } else {
      toast.success("Documento enviado!");
      loadDocs();
    }
    if (fileRef.current) fileRef.current.value = "";
    setUploading(false);
  };

  const handleDeleteDoc = async (docId: string) => {
    const { error } = await supabase.from("documents").delete().eq("id", docId);
    if (error) { toast.error("Erro ao excluir: " + error.message); return; }
    toast.success("Documento excluído.");
    loadDocs();
  };

  if (!employee) return null;

  const isReadyToEfetivar = employee.admission_stage === "pronto_efetivar";

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="sm:max-w-lg w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">{employee.nome}</SheetTitle>
          <p className="text-sm text-muted-foreground">{employee.cargo} · {employee.setor}</p>
        </SheetHeader>

        <Tabs defaultValue="docs" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="docs" className="flex-1">Documentos</TabsTrigger>
            <TabsTrigger value="info" className="flex-1">Dados</TabsTrigger>
          </TabsList>

          <TabsContent value="docs" className="space-y-5 mt-4">
            {/* Upload section */}
            <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Enviar Documento</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <select
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Arquivo</Label>
                  <Input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="mt-1 text-xs" />
                </div>
              </div>
              <Button size="sm" onClick={handleUpload} disabled={uploading} className="w-full">
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Enviar
              </Button>
            </div>

            {/* Doc list */}
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : docs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">Nenhum documento enviado.</p>
            ) : (
              <div className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{doc.doc_category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.file_url && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4" /></a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDoc(doc.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="info" className="space-y-3 mt-4">
            <div className="grid gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <p className="text-sm font-medium">{employee.nome}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">CPF</Label>
                <p className="text-sm">{employee.cpf || "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">WhatsApp</Label>
                <p className="text-sm">{employee.telefone_whatsapp || "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Cargo</Label>
                <p className="text-sm">{employee.cargo}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Setor</Label>
                <p className="text-sm">{employee.setor}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Etapa</Label>
                <Badge variant="secondary">{employee.admission_stage}</Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {isReadyToEfetivar && (
          <Button
            onClick={() => onEfetivar(employee)}
            className="w-full mt-6 h-12 bg-green-600 hover:bg-green-700 text-white"
          >
            <UserCheck className="mr-2 h-5 w-5" />
            Efetivar Funcionário
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
