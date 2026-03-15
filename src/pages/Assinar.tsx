import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { triggerSignatureWebhook } from "@/lib/webhook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, Camera, XCircle, ShieldCheck, AlertTriangle } from "lucide-react";

interface EntregaData {
  id: string;
  funcionario: { nome: string; telefone_whatsapp: string | null; cpf: string | null };
  epi: { nome_equipamento: string; numero_ca: string };
  data_entrega: string | null;
  status_assinatura: string | null;
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function stripCpf(value: string) {
  return value.replace(/\D/g, "");
}

const TERMO_ACEITE =
  "Declaro, sob as penas da lei e mediante a validação do meu CPF pessoal e registro fotográfico, que recebi o Equipamento de Proteção Individual (EPI) descrito nesta tela, em perfeitas condições de uso. Comprometo-me a utilizá-lo exclusivamente durante minhas atividades, zelar por sua conservação e devolvê-lo quando solicitado, conforme determina a NR-06.";

export default function Assinar() {
  const { id } = useParams<{ id: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [entrega, setEntrega] = useState<EntregaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // CPF state
  const [cpfInput, setCpfInput] = useState("");
  const [cpfValid, setCpfValid] = useState<boolean | null>(null);

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("entregas")
      .select("id, data_entrega, status_assinatura, funcionarios(nome, telefone_whatsapp, cpf), epis(nome_equipamento, numero_ca)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const funcData = data.funcionarios as unknown as { nome: string; telefone_whatsapp: string | null; cpf: string | null };
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

  // CPF validation
  const handleCpfChange = (value: string) => {
    const formatted = formatCpf(value);
    setCpfInput(formatted);
    const raw = stripCpf(formatted);
    if (raw.length === 11 && entrega?.funcionario.cpf) {
      setCpfValid(raw === stripCpf(entrega.funcionario.cpf));
    } else {
      setCpfValid(null);
    }
  };

  // Camera
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      alert("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPhotoData(dataUrl);
    closeCamera();
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const removePhoto = () => setPhotoData(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Canvas drawing
  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }, []);

  const startDrawing = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    setHasDrawn(true);
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

  const stopDrawing = useCallback(() => setIsDrawing(false), []);

  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasDrawn(false);
    }
  };

  // Submit validation
  const canSubmit = cpfValid === true && !!photoData && hasDrawn;

  const save = async () => {
    if (!canvasRef.current || !id || !entrega || !canSubmit) return;
    setSaving(true);
    const signatureDataUrl = canvasRef.current.toDataURL("image/png");
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("entregas")
      .update({
        imagem_assinatura: signatureDataUrl,
        foto_assinatura: photoData,
        status_assinatura: "Assinado",
      })
      .eq("id", id);

    if (error) {
      setSaving(false);
      return;
    }

    await triggerSignatureWebhook({
      id_entrega: id,
      nome_funcionario: entrega.funcionario.nome,
      telefone_whatsapp: entrega.funcionario.telefone_whatsapp || "",
      nome_epi: entrega.epi.nome_equipamento,
      data_assinatura: now,
      imagem_assinatura: signatureDataUrl,
      foto_assinatura: photoData!,
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
      <div className="w-full max-w-md space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-foreground">Confirmação de Recebimento</h1>
          <p className="text-sm text-muted-foreground">
            Funcionário: <strong className="text-foreground">{entrega.funcionario.nome}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            EPI:{" "}
            <strong className="text-foreground">
              {entrega.epi.nome_equipamento} (CA: {entrega.epi.numero_ca})
            </strong>
          </p>
        </div>

        {/* Termo de Aceite */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <p className="text-xs font-semibold text-foreground">Termo de Aceite</p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{TERMO_ACEITE}</p>
        </div>

        {/* CPF Validation */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Validação de CPF</label>
          <div className="relative">
            <Input
              placeholder="000.000.000-00"
              value={cpfInput}
              onChange={(e) => handleCpfChange(e.target.value)}
              maxLength={14}
              className={
                cpfValid === true
                  ? "border-success pr-10"
                  : cpfValid === false
                  ? "border-destructive pr-10"
                  : ""
              }
            />
            {cpfValid === true && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
            )}
            {cpfValid === false && (
              <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
            )}
          </div>
          {cpfValid === false && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> CPF não corresponde ao cadastro.
            </p>
          )}
          {!entrega.funcionario.cpf && (
            <p className="text-xs text-warning flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> CPF não cadastrado para este funcionário.
            </p>
          )}
        </div>

        {/* Camera / Photo */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Registro Fotográfico</label>
          {cameraOpen ? (
            <div className="space-y-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg border border-border aspect-[4/3] object-cover bg-black"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeCamera} className="flex-1" size="sm">
                  Cancelar
                </Button>
                <Button onClick={capturePhoto} className="flex-1" size="sm">
                  <Camera className="mr-1.5 h-4 w-4" /> Capturar
                </Button>
              </div>
            </div>
          ) : photoData ? (
            <div className="space-y-2">
              <img
                src={photoData}
                alt="Foto capturada"
                className="w-full rounded-lg border border-border aspect-[4/3] object-cover"
              />
              <Button variant="outline" onClick={removePhoto} className="w-full" size="sm">
                Remover e tirar outra foto
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={openCamera} className="w-full" size="sm">
              <Camera className="mr-1.5 h-4 w-4" /> Abrir Câmera
            </Button>
          )}
        </div>

        {/* Signature Canvas */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Assinatura Digital</p>
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            className="w-full rounded-lg border border-border bg-muted/30 touch-none"
            style={{ height: "180px" }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={clear} className="flex-1">
            Limpar
          </Button>
          <Button onClick={save} disabled={!canSubmit || saving} className="flex-1">
            {saving ? "Salvando..." : "Confirmar Assinatura"}
          </Button>
        </div>

        {/* Status indicators */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${cpfValid ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
            {cpfValid ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} CPF
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${photoData ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
            {photoData ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} Foto
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${hasDrawn ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
            {hasDrawn ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} Assinatura
          </span>
        </div>
      </div>
    </div>
  );
}
