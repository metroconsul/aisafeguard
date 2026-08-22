import { useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, GraduationCap, FolderLock, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Documento {
  id: string;
  title: string;
  doc_category: string;
  expiration_date: string | null;
  file_url: string | null;
  created_at: string | null;
}

export default function PortalDocumentos() {
  const { employee, portalApi } = usePortalAuth();
  const [docs, setDocs] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employee) return;
    loadDocs();
  }, [employee]);

  const loadDocs = async () => {
    if (!employee) return;
    setLoading(true);
    try {
      const r = await portalApi<{ documents: Documento[] }>("list_documents", {
        categories: ["treinamento_nr", "admissao", "aso_exames", "aso", "contrato", "demissao"],
      });
      setDocs(r.documents || []);
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar documentos");
    }
    setLoading(false);
  };

  const nrs = docs.filter((d) => d.doc_category === "treinamento_nr");
  const cofre = docs.filter((d) => d.doc_category !== "treinamento_nr");

  const isVencido = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) <= new Date();
  };
  const isVencendo = (dateStr: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    return d > new Date() && d <= in30;
  };

  if (!employee) return null;

  const renderDocCard = (doc: Documento, showExpiration = false) => (
    <div key={doc.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{doc.title}</p>
          {showExpiration && doc.expiration_date && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Validade: {format(new Date(doc.expiration_date), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          )}
          {!showExpiration && doc.created_at && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {showExpiration && doc.expiration_date && (
            isVencido(doc.expiration_date) ? (
              <Badge variant="destructive" className="text-xs">Vencido</Badge>
            ) : isVencendo(doc.expiration_date) ? (
              <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">Vencendo</Badge>
            ) : (
              <Badge className="bg-success/10 text-success border-success/20 text-xs">Válido</Badge>
            )
          )}
        </div>
      </div>
      {doc.file_url && (
        <Button variant="outline" size="sm" className="mt-3 w-full gap-2" asChild>
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" /> Ver Documento
          </a>
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-5 p-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Documentos</h1>
        <p className="text-sm text-muted-foreground">Seus certificados e documentos pessoais</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="nrs">
          <TabsList className="w-full">
            <TabsTrigger value="nrs" className="flex-1 gap-1.5">
              <GraduationCap className="h-4 w-4" /> NRs
            </TabsTrigger>
            <TabsTrigger value="cofre" className="flex-1 gap-1.5">
              <FolderLock className="h-4 w-4" /> Cofre Pessoal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nrs" className="space-y-3 mt-4">
            {nrs.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium text-foreground">Nenhum treinamento registrado</p>
                <p className="text-sm text-muted-foreground mt-1">Seus certificados de NR aparecerão aqui.</p>
              </div>
            ) : (
              nrs.map((doc) => renderDocCard(doc, true))
            )}
          </TabsContent>

          <TabsContent value="cofre" className="space-y-3 mt-4">
            {cofre.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <FolderLock className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium text-foreground">Nenhum documento disponível</p>
                <p className="text-sm text-muted-foreground mt-1">Contrato, ASOs e outros documentos aparecerão aqui.</p>
              </div>
            ) : (
              cofre.map((doc) => renderDocCard(doc, false))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
