import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileText, Loader2, X, GraduationCap } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionarioId: string;
  onSuccess: () => void;
}

const NORMAS = [
  { value: "NR-06", label: "NR-06 — EPI" },
  { value: "NR-10", label: "NR-10 — Eletricidade" },
  { value: "NR-12", label: "NR-12 — Máquinas" },
  { value: "NR-18", label: "NR-18 — Construção Civil" },
  { value: "NR-33", label: "NR-33 — Espaço Confinado" },
  { value: "NR-35", label: "NR-35 — Trabalho em Altura" },
  { value: "Outro", label: "Outro" },
];

export default function UploadTreinamentoModal({ open, onOpenChange, funcionarioId, onSuccess }: Props) {
  const { perfil } = useAuth();
  const [norma, setNorma] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState("");
  const [dataRealizacao, setDataRealizacao] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [instrutor, setInstrutor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setNorma(""); setCargaHoraria(""); setDataRealizacao(""); setDataVencimento(""); setInstrutor(""); setFile(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") setFile(f);
    else toast.error("Apenas arquivos PDF são aceitos.");
  }, []);

  const handleSave = async () => {
    if (!norma || !dataRealizacao || !dataVencimento || !cargaHoraria) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!perfil?.empresa_id) { toast.error("Perfil não carregado."); return; }

    setLoading(true);
    try {
      let fileUrl: string | null = null;
      if (file) {
        const filePath = `${perfil.empresa_id}/${funcionarioId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from("employee_vault").upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("employee_vault").getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("documents").insert({
        funcionario_id: funcionarioId,
        empresa_id: perfil.empresa_id,
        title: `Treinamento ${norma}`,
        doc_category: "treinamento_nr",
        file_url: fileUrl,
        issue_date: dataRealizacao,
        expiration_date: dataVencimento,
        workload_hours: parseFloat(cargaHoraria),
        provider_or_lead: instrutor || null,
        signature_status: "nao_aplicavel",
      } as any);

      if (error) throw error;
      toast.success("Treinamento registrado com sucesso!");
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Adicionar Treinamento / NR
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Norma *</Label>
            <Select value={norma} onValueChange={setNorma}>
              <SelectTrigger><SelectValue placeholder="Selecione a norma" /></SelectTrigger>
              <SelectContent>{NORMAS.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Carga Horária (h) *</Label>
            <Input type="number" value={cargaHoraria} onChange={(e) => setCargaHoraria(e.target.value)} placeholder="Ex: 40" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data de Realização *</Label>
              <Input type="date" value={dataRealizacao} onChange={(e) => setDataRealizacao(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Vencimento *</Label>
              <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Instituição / Instrutor</Label>
            <Input value={instrutor} onChange={(e) => setInstrutor(e.target.value)} placeholder="Ex: SENAI" />
          </div>

          <div className="space-y-1.5">
            <Label>Certificado (PDF)</Label>
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
                  <p className="text-sm text-muted-foreground">Arraste o certificado PDF ou clique</p>
                </div>
              )}
              <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar Treinamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
