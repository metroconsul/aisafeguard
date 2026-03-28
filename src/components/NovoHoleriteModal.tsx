import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, FileUp } from "lucide-react";
import { toast } from "sonner";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export function NovoHoleriteModal({ open, onOpenChange, onSuccess }: Props) {
  const { perfil } = useAuth();
  const empresaId = perfil?.empresa_id;
  const fileRef = useRef<HTMLInputElement>(null);
  const [month, setMonth] = useState("");
  const [recipientType, setRecipientType] = useState<"single" | "batch">("single");
  const [selectedFuncionario, setSelectedFuncionario] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const monthOptions = generateMonthOptions();

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios-holerite", empresaId],
    enabled: !!empresaId && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("funcionarios")
        .select("id, nome, setor, telefone_whatsapp")
        .eq("empresa_id", empresaId!)
        .eq("status", "ativo")
        .order("nome");
      return data || [];
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") setFile(f);
    else toast.error("Apenas arquivos PDF são aceitos.");
  }, []);

  const handleSubmit = async () => {
    if (!month) return toast.error("Selecione o mês de referência.");
    if (recipientType === "single" && !selectedFuncionario) return toast.error("Selecione um funcionário.");
    if (!file) return toast.error("Anexe o arquivo PDF do holerite.");

    setLoading(true);
    try {
      const targets = recipientType === "single"
        ? funcionarios.filter((f) => f.id === selectedFuncionario)
        : funcionarios;

      for (const func of targets) {
        // 1. Upload PDF
        const filePath = `holerites/${empresaId}/${func.id}/${month.replace("/", "-")}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from("employee_vault")
          .upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("employee_vault").getPublicUrl(filePath);

        // 2. Insert document
        const { data: doc, error: insertError } = await supabase.from("documents").insert({
          empresa_id: empresa!.id,
          funcionario_id: func.id,
          title: `Holerite ${month}`,
          doc_category: "holerite",
          signature_status: "pendente",
          reference_period: month,
          file_url: urlData.publicUrl,
        }).select("id").single();
        if (insertError) throw insertError;

        // 3. Notify via Edge Function
        if (notifyWhatsApp) {
          const { error: fnError } = await supabase.functions.invoke("notify-holerite", {
            body: {
              document_id: doc.id,
              employee_id: func.id,
              employee_name: func.nome,
              phone: func.telefone_whatsapp || "",
              reference_period: month,
              action: "new_holerite",
            },
          });
          if (fnError) {
            toast.warning(`Holerite de ${func.nome} salvo, mas houve um atraso na notificação.`);
          }
        }
      }

      toast.success("Holerite(s) salvo(s) e notificação enviada para a fila de disparo!");
      resetForm();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar holerite.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMonth("");
    setSelectedFuncionario("");
    setFile(null);
    setNotifyWhatsApp(true);
    setRecipientType("single");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            Novo Disparo de Holerite
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Mês de Referência */}
          <div className="space-y-1.5">
            <Label>Mês/Ano de Referência *</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger><SelectValue placeholder="Selecione o mês" /></SelectTrigger>
              <SelectContent>
                {monthOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destinatário */}
          <div className="space-y-1.5">
            <Label>Destinatário</Label>
            <Select value={recipientType} onValueChange={(v) => setRecipientType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Um Funcionário Específico</SelectItem>
                <SelectItem value="batch">Envio em Lote (todos ativos)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recipientType === "single" && (
            <div className="space-y-1.5">
              <Label>Funcionário *</Label>
              <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
                <SelectTrigger><SelectValue placeholder="Buscar funcionário..." /></SelectTrigger>
                <SelectContent>
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome} — {f.setor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Drag & Drop */}
          <div
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            {file ? (
              <p className="text-sm font-medium text-foreground">{file.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Arraste o PDF do holerite ou clique para selecionar</p>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }}
            />
          </div>

          {/* Notify checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="notify-whatsapp"
              checked={notifyWhatsApp}
              onCheckedChange={(v) => setNotifyWhatsApp(!!v)}
            />
            <Label htmlFor="notify-whatsapp" className="text-sm">
              Notificar funcionário automaticamente via WhatsApp
            </Label>
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Salvando..." : "Salvar e Disparar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
