import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logEpiAudit } from "@/lib/epi-audit";
import type { PoliticaModo } from "@/lib/epi-compliance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";

const OPCOES: { value: PoliticaModo; titulo: string; descricao: string }[] = [
  { value: "none", titulo: "Sem restrição", descricao: "A irregularidade fica apenas visível para a gestão. O colaborador registra o ponto normalmente." },
  { value: "alert", titulo: "Alertar no ponto", descricao: "O colaborador vê um aviso ao bater o ponto, mas o registro é concluído." },
  { value: "hard_block", titulo: "Bloquear o ponto", descricao: "O colaborador não consegue registrar o ponto enquanto houver EPI obrigatório vencido ou não entregue." },
];

export function PoliticaEpiCard() {
  const { perfil } = useAuth();
  const empresaId = perfil?.empresa_id;
  const isAdmin = perfil?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modo, setModo] = useState<PoliticaModo>("none");
  const [modoSalvo, setModoSalvo] = useState<PoliticaModo>("none");
  const [antecedencia, setAntecedencia] = useState("7");
  const [confirmarBloqueio, setConfirmarBloqueio] = useState(false);

  const load = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("epi_policies")
      .select("modo, aviso_antecedencia_dias")
      .eq("empresa_id", empresaId)
      .maybeSingle();
    if (!error && data) {
      setModo(data.modo as PoliticaModo);
      setModoSalvo(data.modo as PoliticaModo);
      setAntecedencia(String(data.aviso_antecedencia_dias ?? 7));
    }
    setLoading(false);
  }, [empresaId]);

  useEffect(() => { void load(); }, [load]);

  const persist = async (novoModo: PoliticaModo) => {
    if (!empresaId) return;
    const dias = Number(antecedencia);
    if (!Number.isInteger(dias) || dias < 0 || dias > 90) {
      toast.error("A antecedência do aviso deve ser um número entre 0 e 90 dias.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("epi_policies")
      .upsert({ empresa_id: empresaId, modo: novoModo, aviso_antecedencia_dias: dias }, { onConflict: "empresa_id" });
    setSaving(false);
    if (error) { toast.error("Erro ao salvar a política: " + error.message); return; }
    await logEpiAudit({
      empresaId, entity: "epi_policy", entityId: empresaId, action: "update",
      oldValue: { modo: modoSalvo }, newValue: { modo: novoModo, aviso_antecedencia_dias: dias },
    });
    setModoSalvo(novoModo);
    toast.success("Política de irregularidade atualizada.");
  };

  const handleSalvar = () => {
    if (modo === "hard_block" && modoSalvo !== "hard_block") { setConfirmarBloqueio(true); return; }
    void persist(modo);
  };

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <p className="app-eyebrow">Conformidade de EPI</p>
        <CardTitle className="mt-1 flex items-center gap-2 text-base">
          <ShieldAlert className="h-5 w-5 text-primary" />
          Política de irregularidade
        </CardTitle>
        <CardDescription>
          Define o que acontece quando um colaborador está com EPI obrigatório vencido ou não entregue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 px-4 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <>
            <RadioGroup
              value={modo}
              onValueChange={(v) => setModo(v as PoliticaModo)}
              disabled={!isAdmin}
              className="space-y-2"
            >
              {OPCOES.map((o) => (
                <label
                  key={o.value}
                  htmlFor={`politica-${o.value}`}
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                    modo === o.value ? "border-primary-300 bg-primary-50/60" : "border-border/80 bg-card hover:bg-muted/25",
                    !isAdmin && "cursor-not-allowed opacity-70",
                  ].filter(Boolean).join(" ")}
                >
                  <RadioGroupItem value={o.value} id={`politica-${o.value}`} className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{o.titulo}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{o.descricao}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="antecedencia">Avisar quantos dias antes do vencimento</Label>
              <Input
                id="antecedencia" type="number" min={0} max={90} disabled={!isAdmin}
                value={antecedencia} onChange={(e) => setAntecedencia(e.target.value)} className="sm:w-40"
              />
              <p className="text-xs text-muted-foreground">Usado nos avisos do painel e do Portal do Colaborador.</p>
            </div>

            {isAdmin ? (
              <Button onClick={handleSalvar} disabled={saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Salvar política
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Somente administradores podem alterar esta política.</p>
            )}
          </>
        )}
      </CardContent>

      <AlertDialog open={confirmarBloqueio} onOpenChange={setConfirmarBloqueio}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ativar bloqueio do ponto?</AlertDialogTitle>
            <AlertDialogDescription>
              Colaboradores com EPI obrigatório vencido ou não entregue não conseguirão registrar o ponto pelo Portal até regularizar.
              Garanta que os kits estão configurados e as entregas em dia antes de ativar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setModo(modoSalvo)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void persist("hard_block")}>Ativar bloqueio</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
