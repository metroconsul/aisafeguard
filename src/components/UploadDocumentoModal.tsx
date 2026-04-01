import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileText, Loader2, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionarioId: string;
  onSuccess: () => void;
}

const CATEGORIAS = [
  { value: "admissao", label: "Admissão" },
  { value: "rescisao", label: "Rescisão" },
  { value: "aso", label: "ASO / Exames" },
  { value: "holerite", label: "Holerite" },
  { value: "epi", label: "EPI" },
  { value: "treinamento_nr", label: "Treinamento / NR" },
  { value: "cartao_ponto", label: "Cartão de Ponto" },
];

const ASO_TYPES = [
  { value: "admissional", label: "Admissional" },
  { value: "periodico", label: "Periódico" },
  { value: "demissional", label: "Demissional" },
  { value: "retorno_trabalho", label: "Retorno ao Trabalho" },
  { value: "mudanca_risco", label: "Mudança de Risco" },
];

const HEALTH_STATUS = [
  { value: "apto", label: "Apto" },
  { value: "inapto", label: "Inapto" },
];

export default function UploadDocumentoModal({ open, onOpenChange, funcionarioId, onSuccess }: Props) {
  const { perfil } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [referencePeriod, setReferencePeriod] = useState("");
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle("");
    setCategory("");
    setExpirationDate("");
    setReferencePeriod("");
    setRequiresSignature(false);
    setFile(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") setFile(f);
    else toast.error("Apenas arquivos PDF são aceitos.");
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSave = async () => {
    if (!title || !category) { toast.error("Preencha título e categoria."); return; }
    if (!file) { toast.error("Selecione um arquivo PDF."); return; }
    if (!perfil?.empresa_id) { toast.error("Perfil não carregado."); return; }

    setLoading(true);
    try {
      const filePath = `${perfil.empresa_id}/${funcionarioId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("employee_vault").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("employee_vault").getPublicUrl(filePath);

      const { error } = await supabase.from("documents").insert({
        funcionario_id: funcionarioId,
        empresa_id: perfil.empresa_id,
        title,
        doc_category: category,
        file_url: urlData.publicUrl,
        expiration_date: expirationDate || null,
        reference_period: referencePeriod || null,
        signature_status: requiresSignature ? "pendente" : "nao_aplicavel",
      });

      if (error) throw error;
      toast.success("Documento salvo com sucesso!");
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const showExpiration = category === "aso_exames" || category === "treinamento_nr";
  const showRefPeriod = category === "holerite";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Adicionar Documento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título do Documento</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: ASO Admissional" />
          </div>

          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showExpiration && (
            <div className="space-y-1.5">
              <Label>Data de Vencimento</Label>
              <Input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
            </div>
          )}

          {showRefPeriod && (
            <div className="space-y-1.5">
              <Label>Mês/Ano de Referência</Label>
              <Input value={referencePeriod} onChange={(e) => setReferencePeriod(e.target.value)} placeholder="Ex: 03/2026" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Arquivo PDF</Label>
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
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Arraste e solte o PDF aqui ou clique para selecionar</p>
                </div>
              )}
              <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label className="cursor-pointer">Exige Assinatura Digital?</Label>
            <Switch checked={requiresSignature} onCheckedChange={setRequiresSignature} />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Salvar Documento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
