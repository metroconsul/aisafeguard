import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Eye, Loader2, FileText } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface TrainingDoc {
  id: string;
  title: string;
  issue_date: string | null;
  expiration_date: string | null;
  workload_hours: number | null;
  provider_or_lead: string | null;
  file_url: string | null;
  created_at: string | null;
  funcionario_nome?: string;
}

export default function Treinamentos() {
  const { perfil } = useAuth();
  const [docs, setDocs] = useState<TrainingDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!perfil?.empresa_id) return;
    supabase
      .from("documents")
      .select("id, title, issue_date, expiration_date, workload_hours, provider_or_lead, file_url, created_at, funcionarios:funcionario_id(nome)")
      .eq("empresa_id", perfil.empresa_id)
      .eq("doc_category", "treinamento_nr")
      .order("expiration_date", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setDocs(data.map((d: any) => ({ ...d, funcionario_nome: d.funcionarios?.nome })));
        }
        setLoading(false);
      });
  }, [perfil?.empresa_id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" /> Treinamentos (NRs)
        </h1>
        <p className="text-sm text-muted-foreground">{docs.length} treinamentos registrados</p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        {docs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum treinamento registrado. Adicione pelo perfil do funcionário.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Norma</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Funcionário</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Carga</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Realização</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vencimento</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Instrutor</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Certificado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {docs.map((doc) => {
                  const days = doc.expiration_date ? differenceInDays(new Date(doc.expiration_date), new Date()) : null;
                  const isExpired = days !== null && days < 0;
                  const isNear = days !== null && days >= 0 && days <= 30;
                  return (
                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        {doc.title}
                      </td>
                      <td className="px-4 py-3 text-foreground">{doc.funcionario_nome || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{doc.workload_hours ? `${doc.workload_hours}h` : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {doc.issue_date ? format(new Date(doc.issue_date), "dd/MM/yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {doc.expiration_date ? (
                          <span className={isExpired ? "text-destructive font-semibold" : isNear ? "text-amber-600 font-medium" : "text-foreground"}>
                            {format(new Date(doc.expiration_date), "dd/MM/yyyy")}
                            {isExpired && " (Vencido)"}
                            {isNear && ` (${days}d)`}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{doc.provider_or_lead || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {doc.file_url ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4 mr-1" /> Ver</a>
                          </Button>
                        ) : (
                          <Badge variant="secondary">Sem arquivo</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
