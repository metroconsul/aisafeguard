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
  const { perfil, empresa } = useAuth();
  const empresaId = perfil?.empresa_id;
  const monthOptions = useMemo(generateMonthOptions, []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  const [modalOpen, setModalOpen] = useState(false);
  const [resending, setResending] = useState<string | null>(null);

  const { data: holerites = [], refetch } = useQuery({
    queryKey: ["holerites", empresaId, selectedMonth],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*, funcionarios(nome, setor, telefone_whatsapp)")
        .eq("empresa_id", empresaId!)
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
      // Fetch PDF as base64 for resend
      let pdfBase64 = "";
      let fileName = "";
      if (doc.file_url) {
        try {
          const pdfResp = await fetch(doc.file_url);
          const blob = await pdfResp.blob();
          pdfBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
            reader.readAsDataURL(blob);
          });
          fileName = `holerite_${(func?.nome || "funcionario").replace(/\s+/g, "_")}_${doc.reference_period?.replace("/", "-")}.pdf`;
        } catch (e) {
          console.warn("Não foi possível carregar o PDF para reenvio:", e);
        }
      }

      const { error } = await supabase.functions.invoke("notify-holerite", {
        body: {
          document_id: doc.id,
          employee_id: doc.funcionario_id,
          employee_name: func?.nome || "",
          phone: func?.telefone_whatsapp || "",
          reference_period: doc.reference_period,
          action: "resend_holerite",
          pdf_base64: pdfBase64,
          file_name: fileName,
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
    <div className="mx-auto max-w-[1240px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="app-eyebrow">Folha e comunicação</p><h1 className="mt-1 text-[27px] font-bold tracking-tight text-foreground">Holerites</h1><p className="mt-2 text-sm text-muted-foreground">Dispare, acompanhe e audite a entrega dos comprovantes.</p></div>
        <div className="flex gap-2 print:hidden"><Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4" />Relatório</Button><Button onClick={() => setModalOpen(true)}><Send className="h-4 w-4" />Novo disparo</Button></div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-card p-3 shadow-card print:hidden"><div><p className="app-eyebrow">Período de referência</p><p className="mt-1 text-xs text-muted-foreground">Selecione o mês para consultar os documentos.</p></div><Select value={selectedMonth} onValueChange={setSelectedMonth}><SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger><SelectContent>{monthOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="data-summary"><div className="summary-icon blue"><FileText className="h-4 w-4" /></div><div><span>Total emitido</span><strong>{total}</strong><small>documentos no período</small></div></div><div className="data-summary"><div className="summary-icon" style={{ background: "hsl(var(--success) / .1)", color: "hsl(var(--success))" }}><span>✓</span></div><div><span>Assinados</span><strong>{assinados}</strong><small>{total > 0 ? `${Math.round((assinados / total) * 100)}% do total` : "sem documentos"}</small></div></div><div className="data-summary"><div className="summary-icon amber"><span>!</span></div><div><span>Pendentes</span><strong>{pendentes}</strong><small>{pendentes ? "aguardando assinatura" : "tudo em dia"}</small></div></div></div>

      <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-card"><div className="border-b border-border/80 px-4 py-4"><p className="app-eyebrow">Auditoria do período</p><h2 className="mt-1 text-sm font-bold text-foreground">Entrega e assinatura dos documentos</h2></div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notificação</TableHead>
                <TableHead>Data/Hora Assinatura</TableHead>
                <TableHead className="print:hidden">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holerites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                        {(doc as any).notification_status === "enviado" ? (
                          <Badge className="bg-green-100 text-green-700 border-green-300">Enviado</Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-400 text-amber-600 bg-amber-50">Pendente</Badge>
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
      </div>

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
