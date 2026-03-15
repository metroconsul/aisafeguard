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
import jsPDF from "jspdf";


interface EntregaDetail {
  id: string;
  funcionario_nome: string;
  funcionario_matricula: string;
  funcionario_telefone: string;
  epi_nome: string;
  epi_ca: string;
  data_entrega: string | null;
  status_assinatura: string | null;
  imagem_assinatura: string | null;
  foto_assinatura: string | null;
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
      .select("id, data_entrega, status_assinatura, imagem_assinatura, foto_assinatura, funcionarios(nome, matricula, telefone_whatsapp), epis(nome_equipamento, numero_ca)")
      .eq("id", entregaId)
      .maybeSingle()
      .then(({ data: row }) => {
        if (row) {
          const func = row.funcionarios as unknown as { nome: string; matricula: string; telefone_whatsapp: string | null };
          const epi = row.epis as unknown as { nome_equipamento: string; numero_ca: string };
          setData({
            id: row.id,
            funcionario_nome: func?.nome ?? "—",
            funcionario_matricula: func?.matricula ?? "—",
            funcionario_telefone: func?.telefone_whatsapp ?? "",
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

  const downloadPdf = async () => {
    if (!data) return;
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Ficha de Entrega de EPI", margin, y);
    y += 14;

    doc.setDrawColor(200);
    doc.line(margin, y, 190, y);
    y += 10;

    const addField = (label: string, value: string) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text(label, margin, y);
      y += 5;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30);
      doc.text(value, margin, y);
      y += 10;
    };

    addField("Funcionário", data.funcionario_nome);
    addField("Matrícula", data.funcionario_matricula);
    addField("EPI Recebido", data.epi_nome);
    addField("Número CA", data.epi_ca);
    addField("Data da Entrega", formatDate(data.data_entrega));
    addField("Status", data.status_assinatura ?? "Pendente");

    if (data.imagem_assinatura) {
      y += 5;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text("Assinatura Digital", margin, y);
      y += 5;
      doc.setDrawColor(200);
      doc.rect(margin, y, 100, 50);
      try {
        doc.addImage(data.imagem_assinatura, "PNG", margin + 2, y + 2, 96, 46);
      } catch {
        // ignore image errors
      }
      y += 55;
    }

    y += 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    doc.text(`Documento gerado em ${new Date().toLocaleDateString("pt-BR")} — SafeGuard EPI`, margin, y);

    // Salvar localmente
    doc.save(`ficha-epi-${data.funcionario_nome.replace(/\s+/g, "-").toLowerCase()}.pdf`);

    // Upload para storage e enviar URL no webhook
    try {
      const pdfBlob = doc.output("blob");
      const fileName = `ficha-${data.id}-${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("fichas-pdf")
        .upload(fileName, pdfBlob, { contentType: "application/pdf", upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("fichas-pdf")
        .getPublicUrl(fileName);

      await fetch("https://n8n-n8n.is8ujj.easypanel.host/webhook-test/Pdf-Confirmação", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "ficha_pdf",
          id_entrega: data.id,
          nome_funcionario: data.funcionario_nome,
          matricula: data.funcionario_matricula,
          telefone_whatsapp: data.funcionario_telefone,
          nome_epi: data.epi_nome,
          numero_ca: data.epi_ca,
          data_entrega: data.data_entrega,
          pdf_url: urlData.publicUrl,
        }),
      });
    } catch (err) {
      console.error("Webhook PDF error:", err);
    }
  };

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
                <Button variant="outline" className="w-full gap-2" onClick={downloadPdf}>
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
