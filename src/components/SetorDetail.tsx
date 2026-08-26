import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  HardHat,
  Users,
} from "lucide-react";

interface SetorDetailProps {
  setorId: string;
  setorNome: string;
  onBack: () => void;
}

interface EpiItem {
  id: string;
  nome_equipamento: string;
  numero_ca: string;
}

interface SetorEpi {
  id: string;
  epi_id: string;
  epi: EpiItem;
}

interface FuncAnalise {
  id: string;
  nome: string;
  matricula: string;
  cargo: string;
  epis_faltando: string[];
  status: "protegido" | "irregular";
}

export default function SetorDetail({
  setorId,
  setorNome,
  onBack,
}: SetorDetailProps) {
  const { perfil } = useAuth();
  const [setorEpis, setSetorEpis] = useState<SetorEpi[]>([]);
  const [allEpis, setAllEpis] = useState<EpiItem[]>([]);
  const [selectedEpiId, setSelectedEpiId] = useState("");
  const [analise, setAnalise] = useState<FuncAnalise[]>([]);
  const [loadingAnalise, setLoadingAnalise] = useState(false);

  const loadEpis = async () => {
    const { data } = await supabase
      .from("setores_epis")
      .select("id, epi_id, epis:epi_id(id, nome_equipamento, numero_ca)")
      .eq("setor_id", setorId);

    if (data) {
      setSetorEpis(
        data.map((d: any) => ({
          id: d.id,
          epi_id: d.epi_id,
          epi: d.epis,
        }))
      );
    }

    const { data: allData } = await supabase
      .from("epis")
      .select("id, nome_equipamento, numero_ca")
      .order("nome_equipamento");

    if (allData) setAllEpis(allData);
  };

  const loadAnalise = async () => {
    setLoadingAnalise(true);

    // Get required EPIs for this setor
    const { data: requiredEpis } = await supabase
      .from("setores_epis")
      .select("epi_id, epis:epi_id(nome_equipamento)")
      .eq("setor_id", setorId);

    // Get funcionarios from this setor
    const { data: funcionarios } = await supabase
      .from("funcionarios")
      .select("id, nome, matricula, cargo")
      .eq("setor_id", setorId);

    if (!funcionarios || !requiredEpis) {
      setAnalise([]);
      setLoadingAnalise(false);
      return;
    }

    const now = new Date().toISOString();

    // Get all valid (non-expired, signed) entregas for these funcionarios
    const funcIds = funcionarios.map((f) => f.id);
    const { data: entregas } = await supabase
      .from("entregas")
      .select("funcionario_id, epi_id, data_vencimento, status_assinatura")
      .in("funcionario_id", funcIds.length > 0 ? funcIds : ["__none__"])
      .gte("data_vencimento", now)
      .eq("status_assinatura", "Assinado");

    const result: FuncAnalise[] = funcionarios.map((func) => {
      const funcEntregas = entregas?.filter(
        (e) => e.funcionario_id === func.id
      ) || [];
      const episCobertos = new Set(funcEntregas.map((e) => e.epi_id));

      const faltando = requiredEpis
        .filter((re) => !episCobertos.has(re.epi_id))
        .map((re: any) => re.epis?.nome_equipamento || "EPI desconhecido");

      return {
        ...func,
        epis_faltando: faltando,
        status: faltando.length === 0 ? "protegido" : "irregular",
      };
    });

    setAnalise(result);
    setLoadingAnalise(false);
  };

  useEffect(() => {
    loadEpis();
    loadAnalise();
  }, [setorId]);

  const handleAddEpi = async () => {
    if (!selectedEpiId || !perfil?.empresa_id) return;

    if (setorEpis.some((se) => se.epi_id === selectedEpiId)) {
      toast.error("Este EPI já está na matriz deste setor.");
      return;
    }

    const { error } = await supabase.from("setores_epis").insert({
      setor_id: setorId,
      epi_id: selectedEpiId,
      empresa_id: perfil.empresa_id,
    });

    if (error) {
      toast.error("Erro ao adicionar EPI: " + error.message);
      return;
    }

    toast.success("EPI adicionado à matriz!");
    setSelectedEpiId("");
    loadEpis();
    loadAnalise();
  };

  const handleRemoveEpi = async (id: string) => {
    const { error } = await supabase.from("setores_epis").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover EPI.");
      return;
    }
    toast.success("EPI removido da matriz.");
    loadEpis();
    loadAnalise();
  };

  const availableEpis = allEpis.filter(
    (e) => !setorEpis.some((se) => se.epi_id === e.id)
  );

  const protegidos = analise.filter((a) => a.status === "protegido").length;
  const irregulares = analise.filter((a) => a.status === "irregular").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div><p className="app-eyebrow">Matriz de risco</p><h1 className="mt-1 text-[25px] font-bold tracking-tight text-foreground">
            {setorNome}
          </h1></div>
          <p className="text-sm text-muted-foreground">
            Matriz de risco do setor
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <HardHat className="h-4 w-4" /> EPIs Obrigatórios
          </div>
          <p className="text-2xl font-bold text-foreground">
            {setorEpis.length}
          </p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-sm mb-1 text-emerald-600">
            <ShieldCheck className="h-4 w-4" /> Protegidos
          </div>
          <p className="text-2xl font-bold text-emerald-600">{protegidos}</p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-sm mb-1 text-destructive">
            <ShieldAlert className="h-4 w-4" /> Irregulares
          </div>
          <p className="text-2xl font-bold text-destructive">{irregulares}</p>
        </div>
      </div>

      <Tabs defaultValue="epis">
        <TabsList className="h-auto rounded-lg border border-border/80 bg-card p-1 shadow-card">
          <TabsTrigger value="epis" className="gap-1.5">
            <HardHat className="h-3.5 w-3.5" /> EPIs Obrigatórios
          </TabsTrigger>
          <TabsTrigger value="analise" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Análise de Risco
          </TabsTrigger>
        </TabsList>

        {/* Tab 1 - EPIs */}
        <TabsContent value="epis" className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-foreground">
                Adicionar EPI à Matriz
              </label>
              <Select
                value={selectedEpiId}
                onValueChange={setSelectedEpiId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um EPI..." />
                </SelectTrigger>
                <SelectContent>
                  {availableEpis.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome_equipamento} — CA {e.numero_ca}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddEpi} disabled={!selectedEpiId}>
              <Plus className="mr-1 h-4 w-4" /> Adicionar
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/25">
                  <th className="px-4 py-3 text-left app-eyebrow">
                    Equipamento
                  </th>
                  <th className="px-4 py-3 text-left app-eyebrow">
                    Nº CA
                  </th>
                  <th className="px-4 py-3 text-right app-eyebrow">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {setorEpis.map((se) => (
                  <tr
                    key={se.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {se.epi.nome_equipamento}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {se.epi.numero_ca}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveEpi(se.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {setorEpis.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Nenhum EPI obrigatório definido para este setor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Tab 2 - Análise de Risco */}
        <TabsContent value="analise" className="space-y-4">
          {loadingAnalise ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Analisando conformidade...
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/25">
                    <th className="px-4 py-3 text-left app-eyebrow">
                      Funcionário
                    </th>
                    <th className="px-4 py-3 text-left app-eyebrow">
                      Matrícula
                    </th>
                    <th className="px-4 py-3 text-left app-eyebrow">
                      Cargo
                    </th>
                    <th className="px-4 py-3 text-left app-eyebrow">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left app-eyebrow">
                      EPIs Pendentes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analise.map((func) => (
                    <tr
                      key={func.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {func.nome}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {func.matricula}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {func.cargo}
                      </td>
                      <td className="px-4 py-3">
                        {func.status === "protegido" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Protegido
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <ShieldAlert className="h-3 w-3" />
                            Irregular
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {func.epis_faltando.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {func.epis_faltando.map((epi, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs border-destructive/30 text-destructive"
                              >
                                {epi}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {analise.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        {setorEpis.length === 0
                          ? "Defina os EPIs obrigatórios na aba anterior para analisar."
                          : "Nenhum funcionário vinculado a este setor."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
