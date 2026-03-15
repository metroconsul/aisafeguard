import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { triggerWebhook } from "@/lib/webhook";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Funcionario { id: string; nome: string; telefone_whatsapp: string | null; }
interface Epi { id: string; nome_equipamento: string; numero_ca: string; dias_validade: number; }

export default function NovaEntrega() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [epis, setEpis] = useState<Epi[]>([]);
  const [funcId, setFuncId] = useState("");
  const [epiId, setEpiId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("funcionarios").select("id, nome, telefone_whatsapp").then(({ data }) => { if (data) setFuncionarios(data); });
    supabase.from("epis").select("id, nome_equipamento, numero_ca, dias_validade").then(({ data }) => { if (data) setEpis(data); });
  }, []);

  const handleSubmit = async () => {
    if (!funcId || !epiId) { toast.error("Selecione funcionário e EPI."); return; }
    if (!perfil?.empresa_id) { toast.error("Perfil não carregado."); return; }
    setLoading(true);

    const selectedEpi = epis.find((e) => e.id === epiId)!;
    const selectedFunc = funcionarios.find((f) => f.id === funcId)!;
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + selectedEpi.dias_validade);

    const { data, error } = await supabase
      .from("entregas")
      .insert({ funcionario_id: funcId, epi_id: epiId, data_vencimento: dataVencimento.toISOString(), empresa_id: perfil.empresa_id })
      .select().single();

    if (error) { toast.error("Erro ao registrar entrega."); setLoading(false); return; }

    await triggerWebhook({
      nome_funcionario: selectedFunc.nome,
      telefone_whatsapp: selectedFunc.telefone_whatsapp || "",
      nome_epi: selectedEpi.nome_equipamento,
      link_assinatura: `${window.location.origin}/assinar/${data.id}`,
    });

    toast.success("Entrega registrada com sucesso!");
    setLoading(false);
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Nova Entrega de EPI</h1>
        <p className="text-sm text-muted-foreground">Registre a entrega e envie para assinatura</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card space-y-5">
        <div className="space-y-2">
          <Label>Funcionário</Label>
          <Select value={funcId} onValueChange={setFuncId}>
            <SelectTrigger><SelectValue placeholder="Selecione o funcionário" /></SelectTrigger>
            <SelectContent>{funcionarios.map((f) => (<SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>))}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Equipamento (EPI)</Label>
          <Select value={epiId} onValueChange={setEpiId}>
            <SelectTrigger><SelectValue placeholder="Selecione o EPI" /></SelectTrigger>
            <SelectContent>{epis.map((e) => (<SelectItem key={e.id} value={e.id}>{e.nome_equipamento} — {e.numero_ca}</SelectItem>))}</SelectContent>
          </Select>
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "Registrando..." : "Gerar Entrega"}
        </Button>
      </div>
    </div>
  );
}
