import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";
import AdmissaoKanbanCard from "@/components/admissao/AdmissaoKanbanCard";
import AdmissaoModal from "@/components/admissao/AdmissaoModal";

type Stage = "dados_iniciais" | "aso_pendente" | "assinatura" | "pronto_efetivar";

const COLUMNS: { id: Stage; title: string; description: string; color: string }[] = [
  { id: "dados_iniciais", title: "Dados Pessoais", description: "Aguardando informações iniciais", color: "border-t-blue-500" },
  { id: "aso_pendente", title: "Aguardando ASO", description: "Exame ocupacional pendente", color: "border-t-amber-500" },
  { id: "assinatura", title: "Assinatura de Contrato", description: "Contrato enviado ao candidato", color: "border-t-primary-500" },
  { id: "pronto_efetivar", title: "Pronto para Efetivar", description: "Tudo pronto para admissão", color: "border-t-green-500" },
];

interface Employee {
  id: string;
  nome: string;
  cargo: string;
  setor: string;
  cpf: string | null;
  telefone_whatsapp: string | null;
  empresa_id: string | null;
  admission_stage: string;
  doc_count: number;
}

export default function Admissoes() {
  const { perfil } = useAuth();
  const empresaId = perfil?.empresa_id;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);

  // New candidate form
  const [candidateName, setCandidateName] = useState("");
  const [candidateCpf, setCandidateCpf] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [candidateCargo, setCandidateCargo] = useState("");
  const [candidateSetor, setCandidateSetor] = useState("");

  const loadEmployees = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);

    // Fetch employees in admission
    const { data: emps } = await supabase
      .from("funcionarios")
      .select("id, nome, cargo, setor, cpf, telefone_whatsapp, empresa_id, admission_stage")
      .eq("empresa_id", empresaId)
      .eq("status", "em_admissao");

    if (!emps) { setLoading(false); return; }

    // Fetch doc counts per employee
    const empIds = emps.map(e => e.id);
    let docCounts: Record<string, number> = {};
    if (empIds.length > 0) {
      const { data: docs } = await supabase
        .from("documents")
        .select("funcionario_id")
        .in("funcionario_id", empIds);
      if (docs) {
        docs.forEach(d => {
          if (d.funcionario_id) docCounts[d.funcionario_id] = (docCounts[d.funcionario_id] || 0) + 1;
        });
      }
    }

    setEmployees(emps.map(e => ({
      ...e,
      admission_stage: (e as any).admission_stage || "dados_iniciais",
      doc_count: docCounts[e.id] || 0,
    })));
    setLoading(false);
  }, [empresaId]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStage = destination.droppableId as Stage;

    // Optimistic update
    setEmployees(prev =>
      prev.map(e => e.id === draggableId ? { ...e, admission_stage: newStage } : e)
    );

    const { error } = await supabase
      .from("funcionarios")
      .update({ admission_stage: newStage } as any)
      .eq("id", draggableId);

    if (error) {
      toast.error("Erro ao mover card.");
      loadEmployees(); // revert
    }
  };

  const handleNewCandidate = async () => {
    if (!candidateName.trim()) { toast.error("Nome é obrigatório."); return; }
    if (!candidateCargo.trim()) { toast.error("Cargo é obrigatório."); return; }
    if (!candidateSetor.trim()) { toast.error("Setor é obrigatório."); return; }
    if (!empresaId) return;
    setSaving(true);
    const { data: inserted, error } = await supabase.from("funcionarios").insert({
      empresa_id: empresaId,
      nome: candidateName.trim(),
      cpf: candidateCpf.replace(/\D/g, "") || null,
      telefone_whatsapp: candidatePhone || null,
      cargo: candidateCargo.trim(),
      setor: candidateSetor.trim(),
      matricula: `ADM-${Date.now().toString(36).toUpperCase()}`,
      status: "em_admissao",
      admission_stage: "dados_iniciais",
    } as any).select().single();

    if (error || !inserted) {
      toast.error("Erro: " + (error?.message || "Falha ao criar candidato"));
      setSaving(false);
      return;
    }

    // Dispatch webhook to n8n for WhatsApp notification
    try {
      await supabase.functions.invoke("webhook-candidate-onboarding", {
        body: {
          candidate_id: inserted.id,
          name: candidateName.trim(),
          phone: candidatePhone || null,
        },
      });
    } catch (e) {
      console.warn("Webhook candidate-onboarding failed:", e);
    }

    toast.success("Candidato criado! Link de admissão enviado via WhatsApp.");
    setCandidateName(""); setCandidateCpf(""); setCandidatePhone("");
    setCandidateCargo(""); setCandidateSetor("");
    setNewModalOpen(false);
    loadEmployees();
    setSaving(false);
  };

  const handleEfetivar = async (emp: Employee) => {
    setSaving(true);
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const { error } = await supabase
      .from("funcionarios")
      .update({ status: "ativo", access_pin: pin } as any)
      .eq("id", emp.id);

    if (error) {
      toast.error("Erro ao efetivar: " + error.message);
    } else {
      toast.success(`Funcionário efetivado! PIN de acesso ao portal: ${pin}`, { duration: 10000 });
      setSelectedEmp(null);
      loadEmployees();
    }
    setSaving(false);
  };

  const handleResendLink = async (candidateId: string, name: string, phone: string | null) => {
    try {
      await supabase.functions.invoke("webhook-candidate-onboarding", {
        body: { candidate_id: candidateId, name, phone },
      });
      toast.success("Link reenviado via WhatsApp!");
    } catch {
      toast.error("Erro ao reenviar link.");
    }
  };

  const getColumnItems = (stage: Stage) =>
    employees.filter(e => e.admission_stage === stage);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="app-eyebrow">Processo de pessoas</p><h1 className="mt-1 flex items-center gap-2 text-[26px] font-bold text-foreground">
          <UserPlus className="h-5 w-5 text-secondary-400" strokeWidth={1.8} />
          Gestão de admissões
        </h1><p className="mt-1 text-sm text-muted-foreground">Acompanhe cada candidato até a efetivação.</p></div>
        <Button onClick={() => setNewModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Candidato
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map(col => (
              <Droppable key={col.id} droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex min-h-[360px] flex-col rounded-lg border border-border/80 border-t-2 bg-card shadow-card ${col.color} ${
                      snapshot.isDraggingOver ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="border-b border-border/80 px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div><h3 className="text-sm font-semibold text-foreground">{col.title}</h3><p className="mt-1 text-[11px] text-muted-foreground">{col.description}</p></div>
                        <span className="rounded-md bg-muted px-2 py-1 text-xs font-bold tabular-nums text-muted-foreground">
                          {getColumnItems(col.id).length}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 p-3">
                      {getColumnItems(col.id).map((emp, idx) => (
                        <AdmissaoKanbanCard
                          key={emp.id}
                          employee={emp}
                          index={idx}
                          onClick={() => setSelectedEmp(emp)}
                          onResendLink={handleResendLink}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* New Candidate Modal */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Candidato</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome Completo *</Label>
              <Input value={candidateName} onChange={e => setCandidateName(e.target.value)} placeholder="Nome do candidato" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cargo *</Label>
                <Input value={candidateCargo} onChange={e => setCandidateCargo(e.target.value)} placeholder="Ex: Pedreiro" />
              </div>
              <div className="space-y-1.5">
                <Label>Setor *</Label>
                <Input value={candidateSetor} onChange={e => setCandidateSetor(e.target.value)} placeholder="Ex: Obra A" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>CPF</Label>
              <Input value={candidateCpf} onChange={e => setCandidateCpf(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="00000000000" inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input value={candidatePhone} onChange={e => setCandidatePhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleNewCandidate} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Adicionar ao Kanban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admission Detail Sheet */}
      <AdmissaoModal
        employee={selectedEmp}
        open={!!selectedEmp}
        onClose={() => setSelectedEmp(null)}
        onEfetivar={handleEfetivar}
      />
    </div>
  );
}
