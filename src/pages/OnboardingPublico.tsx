import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2, FileText, Camera, ShieldCheck } from "lucide-react";

const DOC_TYPES = [
  { type: "rg", label: "RG / Identidade", icon: FileText },
  { type: "cpf", label: "CPF", icon: FileText },
  { type: "comprovante_residencia", label: "Comprovante de Endereço", icon: FileText },
  { type: "carteira_trabalho", label: "Carteira de Trabalho", icon: FileText },
];

interface AdmissionDoc {
  id: string;
  doc_type: string;
  file_url: string;
  status: string;
  feedback_rh: string | null;
}

export default function OnboardingPublico() {
  const { token } = useParams<{ token: string }>();
  const [admissionId, setAdmissionId] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [empresaName, setEmpresaName] = useState("");
  const [status, setStatus] = useState("");
  const [docs, setDocs] = useState<AdmissionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!token) return;
    loadAdmission();
  }, [token]);

  const loadAdmission = async () => {
    setLoading(true);
    const { data: req, error } = await supabase
      .from("admission_requests")
      .select("id, candidate_name, status, empresa_id")
      .eq("token", token!)
      .maybeSingle();
    
    if (error || !req) {
      setLoading(false);
      return;
    }

    setAdmissionId(req.id);
    setCandidateName(req.candidate_name);
    setStatus(req.status);

    // Get empresa name
    const { data: emp } = await supabase.from("empresas").select("nome_fantasia").eq("id", req.empresa_id).maybeSingle();
    if (emp) setEmpresaName(emp.nome_fantasia);

    // Load existing docs
    const { data: existingDocs } = await supabase
      .from("admission_documents")
      .select("*")
      .eq("admission_id", req.id);
    setDocs((existingDocs as AdmissionDoc[]) || []);
    setLoading(false);
  };

  const handleUpload = async (docType: string, file: File) => {
    if (!admissionId) return;
    setUploading(docType);
    
    try {
      const path = `onboarding/${admissionId}/${docType}_${Date.now()}.${file.name.split('.').pop()}`;
      const { error: upErr } = await supabase.storage.from("admission-docs").upload(path, file);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("admission-docs").getPublicUrl(path);

      const { data: newDoc, error: insertErr } = await supabase.from("admission_documents").insert({
        admission_id: admissionId,
        doc_type: docType,
        file_url: urlData.publicUrl,
      }).select().single();
      
      if (insertErr) throw insertErr;
      setDocs(prev => [...prev.filter(d => d.doc_type !== docType), newDoc as AdmissionDoc]);
      toast.success("Documento enviado!");
    } catch (err: any) {
      toast.error("Erro no upload: " + err.message);
    } finally {
      setUploading(null);
    }
  };

  const handleSubmitAll = async () => {
    if (!admissionId) return;
    // Update status to em_analise
    const { error } = await supabase.from("admission_requests").update({ status: "em_analise" }).eq("id", admissionId);
    if (error) { toast.error("Erro ao enviar."); return; }
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!admissionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-5">
        <div className="text-center space-y-3">
          <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Link inválido ou expirado</h1>
          <p className="text-muted-foreground">Verifique o link recebido pelo RH.</p>
        </div>
      </div>
    );
  }

  if (submitted || status === "em_analise" || status === "aprovado") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-5">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold text-foreground">
            {status === "aprovado" ? "Admissão Aprovada!" : "Documentos em Análise"}
          </h1>
          <p className="text-muted-foreground">
            {status === "aprovado"
              ? "Parabéns! Sua admissão foi aprovada pelo RH."
              : "Seus documentos foram enviados e estão sendo analisados pelo RH. Você será informado sobre o resultado."}
          </p>
        </div>
      </div>
    );
  }

  const uploadedTypes = docs.map(d => d.doc_type);
  const allUploaded = DOC_TYPES.every(dt => uploadedTypes.includes(dt.type));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Bem-vindo à {empresaName || "Empresa"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Olá, <strong>{candidateName}</strong>. Envie seus documentos para admissão.
          </p>
        </div>

        {/* Document cards */}
        <div className="space-y-3">
          {DOC_TYPES.map(dt => {
            const existing = docs.find(d => d.doc_type === dt.type);
            const isUploading = uploading === dt.type;
            const wasRejected = existing?.status === "rejeitado";

            return (
              <div key={dt.type} className={`rounded-xl border p-4 transition-colors ${
                existing && !wasRejected
                  ? "border-green-300 bg-green-50 dark:bg-green-950/20"
                  : wasRejected
                  ? "border-red-300 bg-red-50 dark:bg-red-950/20"
                  : "border-border bg-card"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <dt.icon className={`h-5 w-5 ${existing && !wasRejected ? "text-green-600" : "text-muted-foreground"}`} />
                    <div>
                      <p className="font-medium text-foreground text-sm">{dt.label}</p>
                      {wasRejected && existing?.feedback_rh && (
                        <p className="text-xs text-red-600 mt-0.5">⚠️ {existing.feedback_rh}</p>
                      )}
                    </div>
                  </div>
                  {existing && !wasRejected ? (
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Enviado
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant={wasRejected ? "destructive" : "default"}
                      disabled={isUploading}
                      onClick={() => fileInputRefs.current[dt.type]?.click()}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Camera className="mr-1 h-4 w-4" />
                          {wasRejected ? "Reenviar" : "Enviar"}
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

        {/* Submit */}
        {allUploaded && (
          <Button onClick={handleSubmitAll} className="w-full h-14 text-base font-semibold bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Enviar para Análise do RH
          </Button>
        )}

        {!allUploaded && (
          <p className="text-center text-xs text-muted-foreground">
            Envie todos os documentos acima para prosseguir.
          </p>
        )}
      </div>
    </div>
  );
}
