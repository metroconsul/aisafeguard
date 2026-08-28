/**
 * Regras puras de conformidade de EPI (kits por cargo).
 * Mantidas fora dos componentes para permitir testes unitários.
 */

export type ValidadeUnidade = "days" | "months";
export type RequisitoStatus = "pending" | "partial" | "valid" | "expired" | "waived";
export type PoliticaModo = "none" | "alert" | "hard_block";

/**
 * Soma a vida útil à data base.
 * - `days`: soma dias corridos.
 * - `months`: soma meses de calendário preservando o dia; quando o mês destino
 *   não possui aquele dia (ex.: 31/01 + 1 mês), usa o último dia do mês.
 */
export function calcVencimento(base: Date, valor: number, unidade: ValidadeUnidade): Date {
  const d = new Date(base.getTime());
  if (unidade === "months") {
    const dia = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + valor);
    const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(dia, ultimoDia));
    return d;
  }
  d.setDate(d.getDate() + valor);
  return d;
}

export function validarItemKit(input: {
  quantidade: number;
  validadeValor: number;
  epiId: string;
  itensExistentes: { epiId: string }[];
}): string | null {
  if (!input.epiId) return "Selecione o equipamento.";
  if (!Number.isInteger(input.quantidade) || input.quantidade <= 0) return "A quantidade deve ser um número inteiro maior que zero.";
  if (!Number.isInteger(input.validadeValor) || input.validadeValor <= 0) return "A vida útil deve ser um número inteiro maior que zero.";
  if (input.itensExistentes.some((i) => i.epiId === input.epiId)) return "Este equipamento já está no kit.";
  return null;
}

export function deriveStatus(input: {
  quantidadeNecessaria: number;
  quantidadeEntregue: number;
  vencimento: Date | null;
  dispensado?: boolean;
  agora?: Date;
}): RequisitoStatus {
  if (input.dispensado) return "waived";
  const agora = input.agora ?? new Date();
  if (input.quantidadeEntregue <= 0) return "pending";
  if (input.vencimento && input.vencimento.getTime() <= agora.getTime()) return "expired";
  if (input.quantidadeEntregue < input.quantidadeNecessaria) return "partial";
  return "valid";
}

export const STATUS_META: Record<RequisitoStatus, { label: string; portalLabel: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  valid: { label: "Em dia", portalLabel: "Recebido e válido", tone: "success" },
  partial: { label: "Parcial", portalLabel: "Falta parte do item", tone: "warning" },
  pending: { label: "Pendente", portalLabel: "Ainda não recebido", tone: "danger" },
  expired: { label: "Vencido", portalLabel: "Vencido — precisa trocar", tone: "danger" },
  waived: { label: "Exceção aprovada", portalLabel: "Dispensado pela empresa", tone: "neutral" },
};

export const TONE_CLASS: Record<"success" | "warning" | "danger" | "neutral", string> = {
  success: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  warning: "bg-amber-500/10 text-amber-700 border-amber-200",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

export interface RequisitoLike {
  status: RequisitoStatus;
  obrigatorio: boolean;
  proxima_vencimento?: string | null;
}

/** Um colaborador é irregular quando tem item obrigatório pendente, parcial ou vencido. */
export function isIrregular(reqs: RequisitoLike[]): boolean {
  return reqs.some((r) => r.obrigatorio && (r.status === "pending" || r.status === "partial" || r.status === "expired"));
}

export function resumoRequisitos(reqs: RequisitoLike[]) {
  const emDia = reqs.filter((r) => r.status === "valid").length;
  const pendentes = reqs.filter((r) => r.status === "pending").length;
  const parciais = reqs.filter((r) => r.status === "partial").length;
  const vencidos = reqs.filter((r) => r.status === "expired").length;
  const dispensados = reqs.filter((r) => r.status === "waived").length;
  const datas = reqs
    .map((r) => (r.proxima_vencimento ? new Date(r.proxima_vencimento) : null))
    .filter((d): d is Date => !!d && !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  return {
    total: reqs.length,
    emDia,
    pendentes,
    parciais,
    vencidos,
    dispensados,
    irregular: isIrregular(reqs),
    proximaData: datas[0] ?? null,
    piorVencimento: datas[0] ?? null,
  };
}

export function motivoPrincipal(reqs: RequisitoLike[]): string {
  if (reqs.some((r) => r.obrigatorio && r.status === "expired")) return "Item vencido";
  if (reqs.some((r) => r.obrigatorio && r.status === "pending")) return "Item nunca entregue";
  if (reqs.some((r) => r.obrigatorio && r.status === "partial")) return "Entrega parcial";
  return "Sem pendências";
}

/** Variação percentual em relação a uma média de referência. `null` quando não há base. */
export function variacaoPercentual(atual: number, media: number): number | null {
  if (!media || media <= 0) return null;
  return ((atual - media) / media) * 100;
}

/** Média dos períodos anteriores ao índice informado. */
export function mediaAnterior(valores: number[], indice: number): number | null {
  const anteriores = valores.slice(0, indice);
  if (anteriores.length === 0) return null;
  return anteriores.reduce((a, b) => a + b, 0) / anteriores.length;
}

/** Dados suficientes para falar de tendência? Regra simples e explicável do MVP. */
export function dadosSuficientes(pontos: number): boolean {
  return pontos >= 3;
}

export function mensagemBloqueioPonto(vencidos: number, pendentes: number): string {
  const partes: string[] = [];
  if (vencidos > 0) partes.push(`${vencidos} item${vencidos > 1 ? "ns" : ""} de EPI vencido${vencidos > 1 ? "s" : ""}`);
  if (pendentes > 0) partes.push(`${pendentes} item${pendentes > 1 ? "ns" : ""} de EPI não entregue${pendentes > 1 ? "s" : ""}`);
  const motivo = partes.join(" e ") || "pendência de EPI";
  return `Ponto bloqueado porque existe ${motivo}. Procure o responsável pelo almoxarifado.`;
}
