import { useState, useCallback, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Loader2, FileUp, CheckCircle2, X, FileText, Users, Send } from "lucide-react";
import { toast } from "sonner";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalizeStr(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

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

interface Funcionario {
  id: string;
  nome: string;
  setor: string;
  telefone_whatsapp: string | null;
  cpf: string | null;
}

export function NovoPontoModal({ open, onOpenChange, onSuccess }: Props) {
  const { perfil } = useAuth();
  const empresaId = perfil?.empresa_id;
  const fileRef = useRef<HTMLInputElement>(null);
  const batchFileRef = useRef<HTMLInputElement>(null);
  const individualFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [month, setMonth] = useState("");
  const [recipientType, setRecipientType] = useState<"single" | "batch">("single");
  const [selectedFuncionario, setSelectedFuncionario] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileMap, setFileMap] = useState<Record<string, File>>({});
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const monthOptions = generateMonthOptions();

  const { data: funcionarios = [] } = useQuery<Funcionario[]>({
    queryKey: ["funcionarios-ponto", empresaId],
    enabled: !!empresaId && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("funcionarios")
        .select("id, nome, setor, telefone_whatsapp, cpf")
        .eq("empresa_id", empresaId!)
        .eq("status", "ativo")
        .order("nome");
      return data || [];
    },
  });

  const matchedCount = useMemo(() => Object.keys(fileMap).length, [fileMap]);

  const autoMatchFiles = useCallback(
    (files: FileList) => {
      const newMap: Record<string, File> = { ...fileMap };
      let matched = 0;

      Array.from(files).forEach((f) => {
        if (f.type !== "application/pdf") return;
        const baseName = normalizeStr(f.name.replace(/\.pdf$/i, ""));

        for (const func of funcionarios) {
          const normNome = normalizeStr(func.nome);
          const normCpf = func.cpf ? normalizeStr(func.cpf) : null;

          if (
            baseName === normNome ||
            baseName.includes(normNome) ||
            normNome.includes(baseName) ||
            (normCpf && baseName.includes(normCpf))
          ) {
            if (!newMap[func.id]) {
              newMap[func.id] = f;
              matched++;
              break;
            }
          }
        }
      });

      setFileMap(newMap);
      if (matched > 0) {
        toast.success(`${matched} arquivo(s) associado(s) automaticamente!`);
      }
      const unmatched = Array.from(files).filter((f) => f.type === "application/pdf").length - matched;
      if (unmatched > 0) {
        toast.info(`${unmatched} arquivo(s) não puderam ser associados automaticamente. Associe manualmente.`);
      }
    },
    [funcionarios, fileMap]
  );

  const handleBatchDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) autoMatchFiles(files);
    },
    [autoMatchFiles]
  );

  const handleSingleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") setFile(f);
    else toast.error("Apenas arquivos PDF são aceitos.");
  }, []);

  const removeFileFromMap = (funcId: string) => {
    setFileMap((prev) => {
      const next = { ...prev };
      delete next[funcId];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!month) return toast.error("Selecione o mês de referência.");

    if (recipientType === "single") {
      if (!selectedFuncionario) return toast.error("Selecione um funcionário.");
      if (!file) return toast.error("Anexe o arquivo PDF do espelho de ponto.");
    } else {
      if (matchedCount === 0) return toast.error("Associe ao menos um PDF a um funcionário.");
    }

    setLoading(true);
    try {
      const targets =
        recipientType === "single"
          ? funcionarios.filter((f) => f.id === selectedFuncionario)
          : funcionarios.filter((f) => fileMap[f.id]);

      // Check duplicates for the period
      const targetIds = targets.map((t) => t.id);
      const { data: existing } = await supabase
        .from("documents")
        .select("funcionario_id")
        .eq("empresa_id", empresaId!)
        .eq("doc_category", "cartao_ponto")
        .eq("reference_period", month)
        .in("funcionario_id", targetIds);

      const existingSet = new Set((existing || []).map((e) => e.funcionario_id));
      const duplicates = targets.filter((t) => existingSet.has(t.id));
      const validTargets = targets.filter((t) => !existingSet.has(t.id));

      if (duplicates.length > 0 && validTargets.length === 0) {
        const names = duplicates.map((d) => d.nome).join(", ");
        toast.error(`Cartão de ponto de ${month} já existe para: ${names}. Nenhum novo disparo realizado.`);
        setLoading(false);
        return;
      }

      if (duplicates.length > 0) {
        const names = duplicates.map((d) => d.nome).join(", ");
        toast.warning(`Pulando duplicados (já possuem cartão em ${month}): ${names}`);
      }

      setProgress({ current: 0, total: validTargets.length });

      for (let i = 0; i < validTargets.length; i++) {
        const func = validTargets[i];
        const currentFile = recipientType === "single" ? file! : fileMap[func.id];
        setProgress({ current: i + 1, total: validTargets.length });

        // 1. Upload PDF (per funcionário)
        const filePath = `pontos/${empresaId}/${func.id}/${month.replace("/", "-")}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from("employee_vault")
          .upload(filePath, currentFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("employee_vault").getPublicUrl(filePath);

        // 2. Insert document
        const { data: doc, error: insertError } = await supabase
          .from("documents")
          .insert({
            empresa_id: empresaId!,
            funcionario_id: func.id,
            title: `Cartão de Ponto — ${month}`,
            doc_category: "cartao_ponto",
            signature_status: "pendente",
            reference_period: month,
            file_url: urlData.publicUrl,
          })
          .select("id")
          .single();
        if (insertError) throw insertError;

        // 3. Notify via Edge Function
        if (notifyWhatsApp) {
          const pdfBase64 = await fileToBase64(currentFile);
          const { error: fnError } = await supabase.functions.invoke("notify-ponto", {
            body: {
              document_id: doc.id,
              employee_id: func.id,
              employee_name: func.nome,
              phone: func.telefone_whatsapp || "",
              reference_period: month,
              action: "new_ponto",
              pdf_base64: pdfBase64,
              file_name: `ponto_${func.nome.replace(/\s+/g, "_")}_${month.replace("/", "-")}.pdf`,
            },
          });
          if (fnError) {
            toast.warning(`Cartão de ${func.nome} salvo, mas houve um atraso na notificação.`);
          }
        }
      }

      toast.success(`${validTargets.length} cartão(ões) de ponto enviado(s) com sucesso!`);
      resetForm();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar cartão de ponto.");
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const resetForm = () => {
    setMonth("");
    setSelectedFuncionario("");
    setFile(null);
    setFileMap({});
    setNotifyWhatsApp(true);
    setRecipientType("single");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Novo Disparo de Cartão de Ponto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2 overflow-y-auto flex-1 pr-1">
          <div className="space-y-1.5">
            <Label>Mês/Ano de Referência *</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Destinatário</Label>
            <Select value={recipientType} onValueChange={(v) => setRecipientType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Um Funcionário Específico</SelectItem>
                <SelectItem value="batch">Envio em Lote (individual por funcionário)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* === SINGLE === */}
          {recipientType === "single" && (
            <>
              <div className="space-y-1.5">
                <Label>Funcionário *</Label>
                <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Buscar funcionário..." />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome} — {f.setor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
                  dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleSingleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                {file ? (
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Arraste o PDF do espelho de ponto ou clique para selecionar</p>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setFile(e.target.files[0]);
                  }}
                />
              </div>
            </>
          )}

          {/* === BATCH === */}
          {recipientType === "batch" && (
            <>
              <div
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
                  dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleBatchDrop}
                onClick={() => batchFileRef.current?.click()}
              >
                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Arraste <strong>vários PDFs</strong> nomeados com o nome ou CPF do funcionário
                  <br />
                  <span className="text-xs">(ex: joao_silva.pdf, 12345678900.pdf)</span>
                </p>
                <input
                  ref={batchFileRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) autoMatchFiles(e.target.files);
                  }}
                />
              </div>

              {matchedCount > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {matchedCount} de {funcionarios.length} associado(s)
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive"
                    onClick={() => setFileMap({})}
                  >
                    Limpar todos
                  </Button>
                </div>
              )}

              <ScrollArea className="max-h-[280px] rounded-lg border border-border">
                <div className="divide-y divide-border">
                  {funcionarios.map((func) => {
                    const hasFile = !!fileMap[func.id];
                    return (
                      <div
                        key={func.id}
                        className={`flex items-center justify-between gap-3 px-3 py-2.5 ${
                          hasFile ? "bg-success/5" : ""
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{func.nome}</p>
                          <p className="text-xs text-muted-foreground">{func.setor}</p>
                        </div>

                        {hasFile ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs max-w-[140px] truncate">
                              <FileText className="mr-1 h-3 w-3 shrink-0" />
                              <span className="truncate">{fileMap[func.id].name}</span>
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => removeFileFromMap(func.id)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs shrink-0"
                            onClick={() => individualFileRefs.current[func.id]?.click()}
                          >
                            <Upload className="mr-1 h-3 w-3" />
                            Anexar
                            <input
                              ref={(el) => {
                                individualFileRefs.current[func.id] = el;
                              }}
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) setFileMap((prev) => ({ ...prev, [func.id]: f }));
                              }}
                            />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}

          {/* WhatsApp toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <Checkbox
              id="notify-whatsapp-ponto"
              checked={notifyWhatsApp}
              onCheckedChange={(c) => setNotifyWhatsApp(c === true)}
            />
            <Label htmlFor="notify-whatsapp-ponto" className="text-sm cursor-pointer">
              Notificar funcionário(s) via WhatsApp
            </Label>
          </div>

          {progress.total > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              Enviando {progress.current} de {progress.total}...
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
