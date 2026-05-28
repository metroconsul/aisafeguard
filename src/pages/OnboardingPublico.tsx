import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle2, FileText, Camera, ShieldCheck } from "lucide-react";

const DOC_TYPES = [
  { type: "rg_cpf", label: "RG / CPF", required: true },
  { type: "comprovante_residencia", label: "Comprovante de Residência", required: true },
  { type: "cnh", label: "CNH (opcional)", required: false },
];

interface Candidate {
  id: string;
  nome: string;
  cargo: string;
  setor: string;
  empresa_id: string;
  status: string;
}

interface Doc {
  id: string;
  doc_category: string;
  title: string;
  file_url: string | null;
}

export default function OnboardingPublico() {
  const { id } = useParams<{ id: string }>();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [empresaName, setEmpresaName] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (id) loadCandidate();
  }, [id]);

  const loadCandidate = async () => {
    setLoading(true);

    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
      setCandidate(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.functions.invoke("onboarding-public", {
      body: { action: "get_candidate", funcionario_id: id },
    });

    if (error || !data?.candidate) {
      setCandidate(null);
      setLoading(false);
      return;
    }

    setCandidate(data.candidate as Candidate);
    setEmpresaName(data.empresa_nome || "");
    setDocs(Array.isArray(data.docs) ? (data.docs as Doc[]) : []);
    setLoading(false);
  };

  const handleUpload = async (docType: string, file: File) => {
    if (!candidate) return;
    setUploading(docType);

    try {
      const file_base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] || "");
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("onboarding-public", {
        body: {
          action: "upload_document",
          funcionario_id: candidate.id,
          doc_type: docType,
          file_base64,
          file_name: file.name,
          content_type: file.type || "application/octet-stream",
        },
      });

      if (error || !data?.doc) throw new Error(error?.message || data?.error || "Falha no upload");
      const newDoc = data.doc as Doc;
      setDocs(prev => [...prev.filter(d => d.title !== newDoc.title), newDoc]);
      toast.success("Documento enviado!");
    } catch (err: any) {
      toast.error("Erro no upload: " + err.message);
    } finally {
      setUploading(null);
    }
  };

  const handleSubmitAll = async () => {
    if (!candidate) return;
    await supabase.functions.invoke("onboarding-public", {
      body: { action: "submit", funcionario_id: candidate.id },
    });
    setSubmitted(true);
    toast.success("Documentos enviados ao RH com sucesso!");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-5">
        <div className="text-center space-y-3">
          <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Link expirado ou inválido</h1>
          <p className="text-muted-foreground text-sm">Verifique o link recebido pelo RH ou entre em contato.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-5">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto h-20 w-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Tudo certo!</h1>
          <p className="text-muted-foreground">
            O RH já recebeu seus documentos. Você será informado(a) sobre os próximos passos.
          </p>
        </div>
      </div>
    );
  }

  const uploadedLabels = docs.map(d => d.title);
  const requiredDone = DOC_TYPES.filter(d => d.required).every(dt =>
    uploadedLabels.includes(dt.label)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Bem-vindo(a) à {empresaName || "Empresa"}!
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Olá, <strong className="text-foreground">{candidate.nome}</strong>! Por favor, envie seus documentos para finalizar sua admissão.
          </p>
        </div>

        {/* Document upload cards */}
        <div className="space-y-3">
          {DOC_TYPES.map(dt => {
            const existing = docs.find(d => d.title === dt.label);
            const isUploading = uploading === dt.type;

            return (
              <div
                key={dt.type}
                className={`rounded-xl border p-4 transition-all ${
                  existing
                    ? "border-green-300 bg-green-50 dark:bg-green-950/20"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className={`h-5 w-5 ${existing ? "text-green-600" : "text-muted-foreground"}`} />
                    <div>
                      <p className="font-medium text-foreground text-sm">{dt.label}</p>
                      {!dt.required && <p className="text-xs text-muted-foreground">Opcional</p>}
                    </div>
                  </div>
                  {existing ? (
                    <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Enviado
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isUploading}
                      onClick={() => fileInputRefs.current[dt.type]?.click()}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Camera className="mr-1 h-4 w-4" />
                          Enviar
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <input
                  ref={el => { fileInputRefs.current[dt.type] = el; }}
                  type="file"
                  accept="image/*,.pdf"
                  capture="environment"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(dt.type, f);
                    e.target.value = "";
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        {requiredDone ? (
          <Button
            onClick={handleSubmitAll}
            className="w-full h-14 text-base font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl"
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Enviar Documentos ao RH
          </Button>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Envie os documentos obrigatórios acima para prosseguir.
          </p>
        )}
      </div>
    </div>
  );
}
