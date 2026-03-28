import { useState, useMemo } from "react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Send, Printer, Eye, MessageCircle, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { NovoHoleriteModal } from "@/components/NovoHoleriteModal";

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

export default function Holerites() {
  const { empresa } = useAuth();
  const monthOptions = useMemo(generateMonthOptions, []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  const [modalOpen, setModalOpen] = useState(false);
  const [resending, setResending] = useState<string | null>(null);

  const { data: holerites = [], refetch } = useQuery({
    queryKey: ["holerites", empresa?.id, selectedMonth],
    enabled: !!empresa?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*, funcionarios(nome, setor, telefone_whatsapp)")
        .eq("empresa_id", empresa!.id)
        .eq("doc_category", "holerite")
        .eq("reference_period", selectedMonth);
      if (error) throw error;
      return data || [];
    },
  });

  const total = holerites.length;
  const assinados = holerites.filter((h) => h.signature_status === "assinado").length;
  const pendentes = total - assinados;

  const handleResend = async (doc: any) => {
    setResending(doc.id);
    try {
      const func = doc.funcionarios as any;
      const { error } = await supabase.functions.invoke("notify-holerite", {
        body: {
          document_id: doc.id,
          employee_id: doc.funcionario_id,
          employee_name: func?.nome || "",
          phone: func?.telefone_whatsapp || "",
          reference_period: doc.reference_period,
          action: "resend_holerite",
        },
      });
      if (error) throw error;
      toast.success("Notificação reenviada com sucesso!");
    } catch {
      toast.error("Erro ao reenviar notificação.");
    } finally {
      setResending(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Gestão de Holerites
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="print:hidden">
            <Printer className="mr-2 h-4 w-4" />
            Relatório de Fechamento
          </Button>
          <Button onClick={() => setModalOpen(true)} className="print:hidden">
            <Send className="mr-2 h-4 w-4" />
            Novo Disparo de Holerite
          </Button>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-3 print:hidden">
        <span className="text-sm font-medium text-muted-foreground">Mês/Ano de Referência:</span>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <span className="text-3xl font-bold text-foreground">{total}</span>
            <span className="text-sm text-muted-foreground">Total Emitido</span>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <span className="text-3xl font-bold text-green-600">{assinados}</span>
            <span className="text-sm text-green-700">
              Assinados {total > 0 ? `(${Math.round((assinados / total) * 100)}%)` : ""}
            </span>
          </CardContent>
        </Card>
        <Card className={pendentes > 0 ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20" : ""}>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <span className={`text-3xl font-bold ${pendentes > 0 ? "text-amber-600" : "text-foreground"}`}>
              {pendentes}
            </span>
            <span className={`text-sm ${pendentes > 0 ? "text-amber-700" : "text-muted-foreground"}`}>
              Pendentes
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Auditoria */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data/Hora Assinatura</TableHead>
                <TableHead className="print:hidden">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holerites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum holerite encontrado para este período.
                  </TableCell>
                </TableRow>
              ) : (
                holerites.map((doc) => {
                  const func = doc.funcionarios as any;
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{func?.nome || "—"}</TableCell>
                      <TableCell>{func?.setor || "—"}</TableCell>
                      <TableCell>
                        {doc.file_url ? (
                          <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-primary underline text-sm">
                            Ver PDF
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem arquivo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.signature_status === "assinado" ? (
                          <div>
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              Assinado digitalmente
                            </Badge>
                            {doc.signed_at && (
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {format(new Date(doc.signed_at), "dd/MM/yyyy HH:mm")}
                                {doc.signature_ip ? ` — IP: ${doc.signature_ip}` : ""}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="border-amber-400 text-amber-600 bg-amber-50">
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.signed_at ? format(new Date(doc.signed_at), "dd/MM/yyyy HH:mm") : "—"}
                      </TableCell>
                      <TableCell className="print:hidden">
                        <div className="flex gap-1">
                          {doc.file_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={doc.file_url} target="_blank" rel="noreferrer">
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {doc.signature_status !== "assinado" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResend(doc)}
                              disabled={resending === doc.id}
                            >
                              {resending === doc.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <MessageCircle className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Print-only report */}
      <div className="hidden print:block mt-8">
        <h2 className="text-lg font-bold mb-2">Relatório de Fechamento — {selectedMonth}</h2>
        <p className="text-sm mb-4">Empresa: {empresa?.nome_fantasia} | Gerado em: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
      </div>

      <NovoHoleriteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => { refetch(); setModalOpen(false); }}
      />
    </div>
  );
}
