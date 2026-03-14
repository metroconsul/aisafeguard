import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EntregaDetail {
  id: string;
  funcionario_nome: string;
  funcionario_matricula: string;
  epi_nome: string;
  epi_ca: string;
  data_entrega: string | null;
  status_assinatura: string | null;
  imagem_assinatura: string | null;
}

interface EntregaDetailModalProps {
  entregaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EntregaDetailModal({ entregaId, open, onOpenChange }: EntregaDetailModalProps) {
  const [data, setData] = useState<EntregaDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entregaId || !open) {
      setData(null);
      return;
    }
    setLoading(true);
    supabase
      .from("entregas")
      .select("id, data_entrega, status_assinatura, imagem_assinatura, funcionarios(nome, matricula), epis(nome_equipamento, numero_ca)")
      .eq("id", entregaId)
      .maybeSingle()
      .then(({ data: row }) => {
        if (row) {
          const func = row.funcionarios as unknown as { nome: string; matricula: string };
          const epi = row.epis as unknown as { nome_equipamento: string; numero_ca: string };
          setData({
            id: row.id,
            funcionario_nome: func?.nome ?? "—",
            funcionario_matricula: func?.matricula ?? "—",
            epi_nome: epi?.nome_equipamento ?? "—",
            epi_ca: epi?.numero_ca ?? "—",
            data_entrega: row.data_entrega,
            status_assinatura: row.status_assinatura,
            imagem_assinatura: row.imagem_assinatura,
          });
        }
        setLoading(false);
      });
  }, [entregaId, open]);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const signed = data?.status_assinatura === "Assinado";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes da Ficha de EPI</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : data ? (
          <div className="space-y-5">
            {/* Structured data */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Funcionário</p>
                <p className="font-medium text-foreground">{data.funcionario_nome}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Matrícula</p>
                <p className="font-medium text-foreground">{data.funcionario_matricula}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">EPI Recebido</p>
                <p className="font-medium text-foreground">{data.epi_nome}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Número CA</p>
                <p className="font-medium text-foreground">{data.epi_ca}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Data da Entrega</p>
                <p className="font-medium text-foreground">{formatDate(data.data_entrega)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <Badge
                  variant={signed ? "default" : "outline"}
                  className={
                    signed
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-warning/10 text-warning border-warning/20"
                  }
                >
                  {signed ? "Assinado" : "Pendente"}
                </Badge>
              </div>
            </div>

            {/* Signature image */}
            {signed && data.imagem_assinatura && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">Assinatura Digital</p>
                <div className="rounded-lg border border-border bg-muted/20 p-4 flex items-center justify-center">
                  <img
                    src={data.imagem_assinatura}
                    alt="Assinatura do funcionário"
                    className="max-h-40 w-auto"
                  />
                </div>
                <Button variant="outline" className="w-full gap-2" disabled>
                  <Download className="h-4 w-4" />
                  Baixar Ficha PDF
                </Button>
              </div>
            )}

            {!signed && (
              <p className="text-xs text-muted-foreground text-center py-2">
                A assinatura ainda não foi registrada.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">Entrega não encontrada.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
