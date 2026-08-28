/**
 * Núcleo puro do módulo de Escala de Turnos (produto de restaurantes).
 * Sem dependência de Supabase/React — totalmente testável.
 * Não contém nenhuma regra de EPI.
 */

export interface TurnoDef {
  id: string;
  nome: string;
  hora_inicio: string; // "HH:MM" ou "HH:MM:SS"
  hora_fim: string;
  cruza_meia_noite: boolean;
}

export interface ModeloItem {
  id: string;
  funcionario_id: string;
  dia_semana: number; // 0 = domingo
  turno_id: string | null;
  ordem: number;
  folga: boolean;
}

export interface BlocoPrevisto {
  turno_id: string | null;
  turno_nome_snapshot: string | null;
  ordem: number;
  inicio_previsto: string; // ISO
  fim_previsto: string; // ISO
}

export interface EscalaProjetada {
  funcionario_id: string;
  data: string; // YYYY-MM-DD
  folga: boolean;
  blocos: BlocoPrevisto[];
}

export interface EscalaExistente {
  funcionario_id: string;
  data: string;
  status: "rascunho" | "publicada" | "cancelada";
  editado_manualmente: boolean;
}

export interface ResultadoProjecao {
  criar: EscalaProjetada[];
  preservadas: EscalaProjetada[]; // já existem publicadas/manuais — exigem confirmação
  atualizar: EscalaProjetada[]; // rascunhos automáticos que podem ser regravados
}

/* ---------------- utilitários de tempo ---------------- */

export function parseHora(h: string): { horas: number; minutos: number } {
  const [hh, mm] = h.split(":");
  return { horas: Number(hh), minutos: Number(mm ?? 0) };
}

export function duracaoTurnoHoras(turno: TurnoDef): number {
  const ini = parseHora(turno.hora_inicio);
  const fim = parseHora(turno.hora_fim);
  const iniMin = ini.horas * 60 + ini.minutos;
  let fimMin = fim.horas * 60 + fim.minutos;
  if (turno.cruza_meia_noite || fimMin <= iniMin) fimMin += 24 * 60;
  return (fimMin - iniMin) / 60;
}

export function addDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function diaSemana(data: string): number {
  return new Date(`${data}T00:00:00Z`).getUTCDay();
}

export function listarDatas(inicio: string, fim: string): string[] {
  const out: string[] = [];
  let cur = inicio;
  let guard = 0;
  while (cur <= fim && guard < 800) {
    out.push(cur);
    cur = addDias(cur, 1);
    guard++;
  }
  return out;
}

/** Converte um turno em bloco datado, tratando cruzamento de meia-noite. */
export function blocoDeTurno(data: string, turno: TurnoDef, ordem: number): BlocoPrevisto {
  const ini = parseHora(turno.hora_inicio);
  const fim = parseHora(turno.hora_fim);
  const inicio = new Date(`${data}T00:00:00Z`);
  inicio.setUTCHours(ini.horas, ini.minutos, 0, 0);
  const fimDate = new Date(`${data}T00:00:00Z`);
  fimDate.setUTCHours(fim.horas, fim.minutos, 0, 0);
  const cruza =
    turno.cruza_meia_noite || fimDate.getTime() <= inicio.getTime();
  if (cruza) fimDate.setUTCDate(fimDate.getUTCDate() + 1);
  return {
    turno_id: turno.id,
    turno_nome_snapshot: turno.nome,
    ordem,
    inicio_previsto: inicio.toISOString(),
    fim_previsto: fimDate.toISOString(),
  };
}

/* ---------------- projeção idempotente ---------------- */

export function projetarModelo(params: {
  itens: ModeloItem[];
  turnos: TurnoDef[];
  inicio: string;
  fim: string;
  existentes?: EscalaExistente[];
}): ResultadoProjecao {
  const { itens, turnos, inicio, fim, existentes = [] } = params;
  const turnoMap = new Map(turnos.map((t) => [t.id, t]));
  const existMap = new Map(existentes.map((e) => [`${e.funcionario_id}|${e.data}`, e]));

  const porChave = new Map<string, EscalaProjetada>();

  for (const data of listarDatas(inicio, fim)) {
    const dow = diaSemana(data);
    const doDia = itens
      .filter((i) => i.dia_semana === dow)
      .sort((a, b) => a.ordem - b.ordem);

    for (const item of doDia) {
      const chave = `${item.funcionario_id}|${data}`;
      let escala = porChave.get(chave);
      if (!escala) {
        escala = { funcionario_id: item.funcionario_id, data, folga: false, blocos: [] };
        porChave.set(chave, escala);
      }
      if (item.folga) {
        if (escala.blocos.length === 0) escala.folga = true;
        continue;
      }
      const turno = item.turno_id ? turnoMap.get(item.turno_id) : undefined;
      if (!turno) continue;
      // idempotência interna: não duplica o mesmo turno no mesmo dia
      if (escala.blocos.some((b) => b.turno_id === turno.id)) continue;
      escala.folga = false;
      escala.blocos.push(blocoDeTurno(data, turno, escala.blocos.length + 1));
    }
  }

  const criar: EscalaProjetada[] = [];
  const atualizar: EscalaProjetada[] = [];
  const preservadas: EscalaProjetada[] = [];

  for (const [chave, escala] of porChave) {
    const existente = existMap.get(chave);
    if (!existente) criar.push(escala);
    else if (existente.status === "publicada" || existente.editado_manualmente) preservadas.push(escala);
    else atualizar.push(escala);
  }

  const ord = (a: EscalaProjetada, b: EscalaProjetada) =>
    a.data.localeCompare(b.data) || a.funcionario_id.localeCompare(b.funcionario_id);

  return { criar: criar.sort(ord), atualizar: atualizar.sort(ord), preservadas: preservadas.sort(ord) };
}

/* ---------------- regimes ---------------- */

export interface RegimeConfig {
  tipo: "6x1" | "5x2" | "12x36" | "personalizado";
  dias_trabalho: number;
  dias_folga: number;
  carga_semanal_horas: number;
  intervalo_minimo_horas: number;
  ciclo_dias?: number | null;
}

export const REGIME_PRESETS: Record<"6x1" | "5x2" | "12x36", Omit<RegimeConfig, "tipo">> = {
  "6x1": { dias_trabalho: 6, dias_folga: 1, carga_semanal_horas: 44, intervalo_minimo_horas: 11, ciclo_dias: 7 },
  "5x2": { dias_trabalho: 5, dias_folga: 2, carga_semanal_horas: 44, intervalo_minimo_horas: 11, ciclo_dias: 7 },
  "12x36": { dias_trabalho: 1, dias_folga: 1, carga_semanal_horas: 44, intervalo_minimo_horas: 36, ciclo_dias: 2 },
};

/** Marca os dias de trabalho de um regime a partir de uma data inicial. */
export function diasDeTrabalhoDoRegime(regime: RegimeConfig, inicio: string, fim: string): string[] {
  const ciclo = regime.ciclo_dias || regime.dias_trabalho + regime.dias_folga;
  const datas = listarDatas(inicio, fim);
  return datas.filter((_, idx) => idx % ciclo < regime.dias_trabalho);
}

/* ---------------- validação / alertas ---------------- */

export type TipoAlerta =
  | "conflito"
  | "excesso_horas"
  | "intervalo_insuficiente"
  | "sobreposicao"
  | "sem_cobertura"
  | "ponto_sem_escala";

export interface Alerta {
  tipo: TipoAlerta;
  severidade: "info" | "aviso" | "critico";
  funcionario_id: string | null;
  data?: string;
  mensagem: string;
  detalhe?: Record<string, unknown>;
}

export interface EscalaComBlocos {
  funcionario_id: string;
  data: string;
  folga: boolean;
  blocos: { inicio_previsto: string; fim_previsto: string; turno_nome_snapshot?: string | null }[];
}

export interface RegrasJornada {
  carga_semanal_max_horas: number;
  intervalo_minimo_horas: number;
}

function horas(ms: number) {
  return ms / 3_600_000;
}

/**
 * Gera alertas OPERACIONAIS (não conclusões jurídicas) a partir das escalas.
 * Todos os limites vêm da configuração da empresa.
 */
export function analisarJornada(escalas: EscalaComBlocos[], regras: RegrasJornada): Alerta[] {
  const alertas: Alerta[] = [];
  const porFunc = new Map<string, EscalaComBlocos[]>();
  for (const e of escalas) {
    if (!porFunc.has(e.funcionario_id)) porFunc.set(e.funcionario_id, []);
    porFunc.get(e.funcionario_id)!.push(e);
  }

  for (const [funcionarioId, lista] of porFunc) {
    const blocos = lista
      .flatMap((e) =>
        e.blocos.map((b) => ({
          data: e.data,
          inicio: new Date(b.inicio_previsto).getTime(),
          fim: new Date(b.fim_previsto).getTime(),
          nome: b.turno_nome_snapshot ?? null,
        }))
      )
      .sort((a, b) => a.inicio - b.inicio);

    // sobreposição e intervalo entre jornadas
    for (let i = 1; i < blocos.length; i++) {
      const ant = blocos[i - 1];
      const atual = blocos[i];
      if (atual.inicio < ant.fim) {
        alertas.push({
          tipo: "sobreposicao",
          severidade: "critico",
          funcionario_id: funcionarioId,
          data: atual.data,
          mensagem: `Turnos sobrepostos em ${atual.data}.`,
          detalhe: { anterior: ant.nome, atual: atual.nome },
        });
        continue;
      }
      const intervalo = horas(atual.inicio - ant.fim);
      if (intervalo < regras.intervalo_minimo_horas) {
        alertas.push({
          tipo: "intervalo_insuficiente",
          severidade: "aviso",
          funcionario_id: funcionarioId,
          data: atual.data,
          mensagem: `Intervalo de ${intervalo.toFixed(1)}h entre jornadas, abaixo do mínimo configurado de ${regras.intervalo_minimo_horas}h.`,
          detalhe: { intervalo_horas: Number(intervalo.toFixed(2)) },
        });
      }
    }

    // carga por semana ISO (segunda a domingo)
    const porSemana = new Map<string, number>();
    for (const b of blocos) {
      const d = new Date(`${b.data}T00:00:00Z`);
      const dow = (d.getUTCDay() + 6) % 7; // 0 = segunda
      const semana = addDias(b.data, -dow);
      porSemana.set(semana, (porSemana.get(semana) ?? 0) + horas(b.fim - b.inicio));
    }
    for (const [semana, total] of porSemana) {
      if (total > regras.carga_semanal_max_horas) {
        alertas.push({
          tipo: "excesso_horas",
          severidade: "aviso",
          funcionario_id: funcionarioId,
          data: semana,
          mensagem: `${total.toFixed(1)}h planejadas na semana de ${semana}, acima do limite configurado de ${regras.carga_semanal_max_horas}h.`,
          detalhe: { total_horas: Number(total.toFixed(2)), semana },
        });
      }
    }
  }

  return alertas;
}

/** Dias do período sem nenhum colaborador escalado (falta de cobertura). */
export function analisarCobertura(escalas: EscalaComBlocos[], inicio: string, fim: string): Alerta[] {
  const comTrabalho = new Set(
    escalas.filter((e) => !e.folga && e.blocos.length > 0).map((e) => e.data)
  );
  return listarDatas(inicio, fim)
    .filter((d) => !comTrabalho.has(d))
    .map<Alerta>((d) => ({
      tipo: "sem_cobertura",
      severidade: "aviso",
      funcionario_id: null,
      data: d,
      mensagem: `Nenhum colaborador escalado em ${d}.`,
    }));
}

/* ---------------- validações de cadastro ---------------- */

export function validarTurno(input: {
  nome: string;
  hora_inicio: string;
  hora_fim: string;
  cruza_meia_noite: boolean;
}): string[] {
  const erros: string[] = [];
  if (!input.nome.trim()) erros.push("Informe o nome do turno.");
  const re = /^\d{2}:\d{2}(:\d{2})?$/;
  if (!re.test(input.hora_inicio) || !re.test(input.hora_fim)) {
    erros.push("Horários devem estar no formato HH:MM.");
    return erros;
  }
  const dur = duracaoTurnoHoras({
    id: "x",
    nome: input.nome,
    hora_inicio: input.hora_inicio,
    hora_fim: input.hora_fim,
    cruza_meia_noite: input.cruza_meia_noite,
  });
  if (dur <= 0) erros.push("A duração do turno deve ser maior que zero.");
  if (dur > 24) erros.push("A duração do turno não pode passar de 24 horas.");
  if (!input.cruza_meia_noite && input.hora_fim <= input.hora_inicio) {
    erros.push("Se o turno termina no dia seguinte, marque 'cruza meia-noite'.");
  }
  return erros;
}

export function turnosSobrepostos(a: TurnoDef, b: TurnoDef, data = "2024-01-01"): boolean {
  const ba = blocoDeTurno(data, a, 1);
  const bb = blocoDeTurno(data, b, 1);
  return (
    new Date(ba.inicio_previsto) < new Date(bb.fim_previsto) &&
    new Date(bb.inicio_previsto) < new Date(ba.fim_previsto)
  );
}
