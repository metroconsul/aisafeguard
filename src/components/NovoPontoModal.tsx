import { useState, useMemo, useRef, useCallback } from "react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Upload, FileText, Loader2, X, Send } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function generateMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = subMonths(now, i);
    const value = format(d, "MM/yyyy");
    const label = format(d, "MMMM/yyyy", { locale: ptBR });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

export function NovoPontoModal({ open, onOpenChange, onSuccess }: Props) {
  const { perfil } = useAuth();
  const empresaId = perfil?.empresa_id;
  const monthOptions = useMemo(generateMonthOptions, []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  const [selectedFuncionarios, setSelectedFuncionarios] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios-ponto", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data } = await supabase
        .from("funcionarios")
        .select("id, nome, setor")
        .eq("empresa_id", empresaId!)
        .eq("status", "ativo")
        .order("nome");
      return data || [];
    },
  });

  const toggleFuncionario = (id: string) => {
    setSelectedFuncionarios((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedFuncionarios.length === funcionarios.length) {
      setSelectedFuncionarios([]);
    } else {
      setSelectedFuncionarios(funcionarios.map((f) => f.id));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") setFile(f);
    else toast.error("Apenas arquivos PDF.");
  }, []);

  const handleSave = async () => {
    if (selectedFuncionarios.length === 0) { toast.error("Selecione ao menos um funcionário."); return; }
    if (!file) { toast.error("Selecione o PDF do espelho de ponto."); return; }
    if (!empresaId) return;

    setLoading(true);
    try {
      const filePath = `${empresaId}/pontos/${selectedMonth.replace("/", "-")}_${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage.from("employee_vault").upload(filePath, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("employee_vault").getPublicUrl(filePath);

      const inserts = selectedFuncionarios.map((funcId) => ({
        funcionario_id: funcId,
        empresa_id: empresaId,
        title: `Cartão de Ponto — ${selectedMonth}`,
        doc_category: "cartao_ponto" as const,
        reference_period: selectedMonth,
        file_url: urlData.publicUrl,
        signature_status: "pendente",
      }));

      const { error } = await supabase.from("documents").insert(inserts);
      if (error) throw error;

      toast.success(`${inserts.length} cartões de ponto emitidos com sucesso!`);
      setSelectedFuncionarios([]);
      setFile(null);
      onSuccess();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Novo Disparo de Cartão de Ponto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Mês/Ano de Referência</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Arquivo PDF (Espelho de Ponto)</Label>
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
                  <p className="text-sm text-muted-foreground">Arraste o PDF ou clique para selecionar</p>
                </div>
              )}
              <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Funcionários</Label>
              <button onClick={toggleAll} className="text-xs text-primary hover:underline">
                {selectedFuncionarios.length === funcionarios.length ? "Desmarcar todos" : "Selecionar todos"}
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {funcionarios.map((f) => (
                <label key={f.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer">
                  <Checkbox checked={selectedFuncionarios.includes(f.id)} onCheckedChange={() => toggleFuncionario(f.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{f.nome}</p>
                    <p className="text-xs text-muted-foreground">{f.setor}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{selectedFuncionarios.length} selecionado(s)</p>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Emitindo...</> : `Emitir Cartão de Ponto (${selectedFuncionarios.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
