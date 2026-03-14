import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { triggerSignatureWebhook } from "@/lib/webhook";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

interface EntregaData {
  id: string;
  funcionario: { nome: string; telefone_whatsapp: string | null };
  epi: { nome_equipamento: string; numero_ca: string };
  data_entrega: string | null;
  status_assinatura: string | null;
}

export default function Assinar() {
  const { id } = useParams<{ id: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [entrega, setEntrega] = useState<EntregaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("entregas")
      .select("id, data_entrega, status_assinatura, funcionarios(nome, telefone_whatsapp), epis(nome_equipamento, numero_ca)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const funcData = data.funcionarios as unknown as { nome: string; telefone_whatsapp: string | null };
          const epiData = data.epis as unknown as { nome_equipamento: string; numero_ca: string };
          setEntrega({
            id: data.id,
            funcionario: funcData,
            epi: epiData,
            data_entrega: data.data_entrega,
            status_assinatura: data.status_assinatura,
          });
          if (data.status_assinatura === "Assinado") setDone(true);
        }
        setLoading(false);
      });
  }, [id]);

  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [getPos]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, getPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const save = async () => {
    if (!canvasRef.current || !id || !entrega) return;
    setSaving(true);
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("entregas")
      .update({ imagem_assinatura: dataUrl, status_assinatura: "Assinado" })
      .eq("id", id);

    if (error) {
      setSaving(false);
      return;
    }

    // Disparar webhook de confirmação
    await triggerSignatureWebhook({
      id_entrega: id,
      nome_funcionario: entrega.funcionario.nome,
      telefone_whatsapp: entrega.funcionario.telefone_whatsapp || "",
      nome_epi: entrega.epi.nome_equipamento,
      data_assinatura: now,
      imagem_assinatura: dataUrl,
    });

    setSaving(false);
    setDone(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!entrega) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-muted-foreground">Entrega não encontrada.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="rounded-full bg-success/10 p-4 mb-4">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Assinatura registrada com sucesso!</h1>
        <p className="mt-2 text-sm text-muted-foreground">Você pode fechar esta página.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-foreground">Confirmação de Recebimento</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Eu, <strong className="text-foreground">{entrega.funcionario.nome}</strong>, confirmo o
            recebimento do equipamento{" "}
            <strong className="text-foreground">
              {entrega.epi.nome_equipamento} (CA: {entrega.epi.numero_ca})
            </strong>{" "}
            em perfeitas condições de uso.
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Assine abaixo</p>
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            className="w-full rounded-lg border border-border bg-muted/30 touch-none"
            style={{ height: "200px" }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={clear} className="flex-1">
            Limpar
          </Button>
          <Button onClick={save} disabled={saving} className="flex-1">
            {saving ? "Salvando..." : "Confirmar Assinatura"}
          </Button>
        </div>
      </div>
    </div>
  );
}
