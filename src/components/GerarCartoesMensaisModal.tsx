import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId?: string;
  onSuccess?: () => void;
}

export function GerarCartoesMensaisModal({ open, onOpenChange, empresaId, onSuccess }: Props) {
  const now = new Date();
  const [mes, setMes] = useState(String(now.getMonth() + 1));
  const [ano, setAno] = useState(String(now.getFullYear()));

  const anos = Array.from({ length: 3 }, (_, i) => String(now.getFullYear() - i));

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("gerar-cartao-ponto-mensal", {
        body: { empresa_id: empresaId, mes: Number(mes), ano: Number(ano) },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.error) {
        toast.error("Erro: " + data.error);
        return;
      }
      const n = data?.gerados ?? 0;
      const erros = data?.erros?.length ?? 0;
      if (n === 0) {
        toast.warning(data?.mensagem || "Nenhum cartão gerado (sem batidas no período).");
      } else {
        toast.success(`${n} cartão(ões) gerado(s) com sucesso!${erros ? ` (${erros} erro(s))` : ""}`);
      }
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error("Erro ao gerar: " + (err.message || "tente novamente"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Gerar Cartões do Mês
          </DialogTitle>
          <DialogDescription>
            Consolida automaticamente todas as batidas registradas em PDFs por funcionário,
            prontos para o ciclo de assinatura digital.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Mês</label>
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MESES.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ano</label>
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {anos.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Apenas funcionários com batidas no período terão cartões gerados.
          Cartões já assinados não serão sobrescritos.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="gap-2">
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? "Gerando PDFs..." : "Gerar Agora"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
