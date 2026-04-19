import { useState, useMemo } from "react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Send, Printer, Eye, Trash2, MapPin, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { NovoPontoModal } from "@/components/NovoPontoModal";

const TIPO_LABEL: Record<string, string> = {
  entrada: "Entrada",
  saida_almoco: "Saída p/ Almoço",
  volta_almoco: "Retorno do Almoço",
  saida: "Saída",
};

const TIPO_COLOR: Record<string, string> = {
  entrada: "bg-green-100 text-green-700 border-green-300",
  saida_almoco: "bg-amber-100 text-amber-700 border-amber-300",
  volta_almoco: "bg-blue-100 text-blue-700 border-blue-300",
  saida: "bg-rose-100 text-rose-700 border-rose-300",
};

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

export default function CartaoPonto() {
  const { perfil, empresa } = useAuth();
  const empresaId = perfil?.empresa_id;
  const monthOptions = useMemo(generateMonthOptions, []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: pontos = [], refetch } = useQuery({
    queryKey: ["pontos", empresaId, selectedMonth],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*, funcionarios(nome, setor, telefone_whatsapp)")
        .eq("empresa_id", empresaId!)
        .eq("doc_category", "cartao_ponto")
        .eq("reference_period", selectedMonth);
      if (error) throw error;
      return data || [];
    },
  });

  const total = pontos.length;
  const assinados = pontos.filter((h) => h.signature_status === "assinado").length;
  const pendentes = total - assinados;

  // Monitoramento em Tempo Real
  const { data: timeEntries = [], refetch: refetchEntries, isFetching: fetchingEntries } = useQuery({
    queryKey: ["time_entries", empresaId, selectedDate],
    enabled: !!empresaId,
    refetchInterval: 30000,
    queryFn: async () => {
      const dayStart = new Date(`${selectedDate}T00:00:00`);
      const dayEnd = new Date(`${selectedDate}T23:59:59`);
      const { data, error } = await supabase
        .from("time_entries")
        .select("*, funcionarios(nome, setor)")
        .eq("empresa_id", empresaId!)
        .gte("recorded_at", dayStart.toISOString())
        .lte("recorded_at", dayEnd.toISOString())
        .order("recorded_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const totalBatidas = timeEntries.length;
  const presentes = new Set(timeEntries.map((e: any) => e.funcionario_id)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Gestão de Cartão de Ponto
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="print:hidden">
            <Printer className="mr-2 h-4 w-4" />
            Relatório
          </Button>
          <Button onClick={() => setModalOpen(true)} className="print:hidden">
            <Send className="mr-2 h-4 w-4" />
            Novo Disparo de Ponto
          </Button>
        </div>
      </div>

      <Tabs defaultValue="cartoes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cartoes">Cartões Mensais</TabsTrigger>
          <TabsTrigger value="monitoramento">Monitoramento em Tempo Real</TabsTrigger>
        </TabsList>

        {/* === Aba 1: Cartões Mensais === */}
        <TabsContent value="cartoes" className="space-y-6">
          <div className="flex items-center gap-3 print:hidden">
            <span className="text-sm font-medium text-muted-foreground">Mês/Ano:</span>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                <span className={`text-3xl font-bold ${pendentes > 0 ? "text-amber-600" : "text-foreground"}`}>{pendentes}</span>
                <span className={`text-sm ${pendentes > 0 ? "text-amber-700" : "text-muted-foreground"}`}>Pendentes</span>
              </CardContent>
            </Card>
          </div>

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
                  {pontos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhum cartão de ponto encontrado para este período.
                      </TableCell>
                    </TableRow>
                  ) : pontos.map((doc) => {
                    const func = doc.funcionarios as any;
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{func?.nome || "—"}</TableCell>
                        <TableCell>{func?.setor || "—"}</TableCell>
                        <TableCell>
                          {doc.file_url ? (
                            <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-primary underline text-sm">Ver PDF</a>
                          ) : <span className="text-muted-foreground text-sm">Sem arquivo</span>}
                        </TableCell>
                        <TableCell>
                          {doc.signature_status === "assinado" ? (
                            <div>
                              <Badge className="bg-green-100 text-green-700 border-green-300">Assinado digitalmente</Badge>
                              {doc.signed_at && (
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  {format(new Date(doc.signed_at), "dd/MM/yyyy HH:mm")}
                                  {doc.signature_ip ? ` — IP: ${doc.signature_ip}` : ""}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="border-amber-400 text-amber-600 bg-amber-50">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell>{doc.signed_at ? format(new Date(doc.signed_at), "dd/MM/yyyy HH:mm") : "—"}</TableCell>
                        <TableCell className="print:hidden">
                          <div className="flex items-center gap-1">
                            {doc.file_url && (
                              <Button variant="ghost" size="icon" asChild>
                                <a href={doc.file_url} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /></a>
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir cartão de ponto?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação removerá permanentemente o cartão de ponto de <strong>{func?.nome}</strong> referente a {doc.reference_period}. Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={async () => {
                                      try {
                                        if (doc.file_url) {
                                          const marker = "/employee_vault/";
                                          const idx = doc.file_url.indexOf(marker);
                                          if (idx !== -1) {
                                            const path = decodeURIComponent(doc.file_url.substring(idx + marker.length));
                                            await supabase.storage.from("employee_vault").remove([path]);
                                          }
                                        }
                                        const { error } = await supabase.from("documents").delete().eq("id", doc.id);
                                        if (error) throw error;
                                        toast.success("Cartão de ponto excluído");
                                        refetch();
                                      } catch (err: any) {
                                        toast.error("Erro ao excluir: " + (err.message || "tente novamente"));
                                      }
                                    }}
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="hidden print:block mt-8">
            <h2 className="text-lg font-bold mb-2">Relatório de Cartão de Ponto — {selectedMonth}</h2>
            <p className="text-sm mb-4">Empresa: {empresa?.nome_fantasia} | Gerado em: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          </div>
        </TabsContent>

        {/* === Aba 2: Monitoramento em Tempo Real === */}
        <TabsContent value="monitoramento" className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Data:</span>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[180px]"
            />
            <Button variant="outline" size="sm" onClick={() => refetchEntries()} disabled={fetchingEntries}>
              <RefreshCw className={`mr-2 h-4 w-4 ${fetchingEntries ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">Auto-atualiza a cada 30s</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <span className="text-3xl font-bold text-foreground">{totalBatidas}</span>
                <span className="text-sm text-muted-foreground">Batidas registradas</span>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="flex flex-col items-center justify-center py-6">
                <span className="text-3xl font-bold text-green-600">{presentes}</span>
                <span className="text-sm text-green-700">Funcionários presentes</span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Precisão GPS</TableHead>
                    <TableHead>Localização</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhuma batida registrada nesta data.
                      </TableCell>
                    </TableRow>
                  ) : timeEntries.map((entry: any) => {
                    const func = entry.funcionarios as any;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{func?.nome || "—"}</TableCell>
                        <TableCell>{func?.setor || "—"}</TableCell>
                        <TableCell className="font-mono tabular-nums">
                          {format(new Date(entry.recorded_at), "HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={TIPO_COLOR[entry.tipo] || ""}>
                            {TIPO_LABEL[entry.tipo] || entry.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entry.accuracy ? `±${Math.round(entry.accuracy)}m` : "—"}
                        </TableCell>
                        <TableCell>
                          {entry.latitude && entry.longitude ? (
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={`https://www.google.com/maps?q=${entry.latitude},${entry.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <MapPin className="mr-1 h-3.5 w-3.5" />
                                Ver no mapa
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem GPS</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NovoPontoModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={() => { refetch(); setModalOpen(false); }} />
    </div>
  );
}
