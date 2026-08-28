import { describe, expect, it } from "vitest";
import {
  REGIME_PRESETS,
  analisarCobertura,
  analisarJornada,
  blocoDeTurno,
  diasDeTrabalhoDoRegime,
  duracaoTurnoHoras,
  listarDatas,
  projetarModelo,
  turnosSobrepostos,
  validarTurno,
  type ModeloItem,
  type TurnoDef,
} from "@/lib/escala/core";

const almoco: TurnoDef = { id: "t1", nome: "Almoço", hora_inicio: "10:00", hora_fim: "15:00", cruza_meia_noite: false };
const jantar: TurnoDef = { id: "t2", nome: "Jantar", hora_inicio: "18:00", hora_fim: "23:00", cruza_meia_noite: false };
const fechamento: TurnoDef = { id: "t3", nome: "Fechamento", hora_inicio: "22:00", hora_fim: "03:00", cruza_meia_noite: true };

describe("turnos", () => {
  it("calcula duração simples", () => {
    expect(duracaoTurnoHoras(almoco)).toBe(5);
  });

  it("calcula duração cruzando meia-noite", () => {
    expect(duracaoTurnoHoras(fechamento)).toBe(5);
  });

  it("gera bloco datado no dia seguinte quando cruza meia-noite", () => {
    const b = blocoDeTurno("2026-03-10", fechamento, 1);
    expect(b.inicio_previsto.startsWith("2026-03-10")).toBe(true);
    expect(b.fim_previsto.startsWith("2026-03-11")).toBe(true);
  });

  it("detecta sobreposição entre turnos", () => {
    expect(turnosSobrepostos(almoco, jantar)).toBe(false);
    expect(turnosSobrepostos(jantar, fechamento)).toBe(true);
  });

  it("valida cadastro de turno", () => {
    expect(validarTurno({ nome: "Almoço", hora_inicio: "10:00", hora_fim: "15:00", cruza_meia_noite: false })).toEqual([]);
    expect(validarTurno({ nome: "", hora_inicio: "10:00", hora_fim: "15:00", cruza_meia_noite: false }).length).toBe(1);
    expect(validarTurno({ nome: "X", hora_inicio: "22:00", hora_fim: "03:00", cruza_meia_noite: false }).length).toBeGreaterThan(0);
  });
});

describe("projeção", () => {
  const itens: ModeloItem[] = [
    { id: "i1", funcionario_id: "f1", dia_semana: 2, turno_id: "t1", ordem: 1, folga: false },
    { id: "i2", funcionario_id: "f1", dia_semana: 2, turno_id: "t2", ordem: 2, folga: false },
    { id: "i3", funcionario_id: "f1", dia_semana: 3, turno_id: null, ordem: 1, folga: true },
  ];
  const turnos = [almoco, jantar, fechamento];

  it("permite múltiplos blocos no mesmo dia", () => {
    const r = projetarModelo({ itens, turnos, inicio: "2026-03-10", fim: "2026-03-10" });
    expect(r.criar).toHaveLength(1);
    expect(r.criar[0].blocos).toHaveLength(2);
    expect(r.criar[0].blocos.map((b) => b.ordem)).toEqual([1, 2]);
  });

  it("marca folga", () => {
    const r = projetarModelo({ itens, turnos, inicio: "2026-03-11", fim: "2026-03-11" });
    expect(r.criar[0].folga).toBe(true);
    expect(r.criar[0].blocos).toHaveLength(0);
  });

  it("é idempotente: repetir a projeção não duplica escalas", () => {
    const primeira = projetarModelo({ itens, turnos, inicio: "2026-03-10", fim: "2026-03-16" });
    const existentes = primeira.criar.map((e) => ({
      funcionario_id: e.funcionario_id,
      data: e.data,
      status: "rascunho" as const,
      editado_manualmente: false,
    }));
    const segunda = projetarModelo({ itens, turnos, inicio: "2026-03-10", fim: "2026-03-16", existentes });
    expect(segunda.criar).toHaveLength(0);
    expect(segunda.atualizar).toHaveLength(primeira.criar.length);
  });

  it("preserva escalas publicadas e editadas manualmente", () => {
    const existentes = [
      { funcionario_id: "f1", data: "2026-03-10", status: "publicada" as const, editado_manualmente: false },
      { funcionario_id: "f1", data: "2026-03-11", status: "rascunho" as const, editado_manualmente: true },
    ];
    const r = projetarModelo({ itens, turnos, inicio: "2026-03-10", fim: "2026-03-11", existentes });
    expect(r.criar).toHaveLength(0);
    expect(r.preservadas).toHaveLength(2);
  });

  it("não duplica o mesmo turno repetido no modelo", () => {
    const dup: ModeloItem[] = [
      { id: "a", funcionario_id: "f1", dia_semana: 2, turno_id: "t1", ordem: 1, folga: false },
      { id: "b", funcionario_id: "f1", dia_semana: 2, turno_id: "t1", ordem: 2, folga: false },
    ];
    const r = projetarModelo({ itens: dup, turnos, inicio: "2026-03-10", fim: "2026-03-10" });
    expect(r.criar[0].blocos).toHaveLength(1);
  });
});

describe("regimes", () => {
  it("6x1 escala 6 dias e folga 1 no ciclo de 7", () => {
    const dias = diasDeTrabalhoDoRegime({ tipo: "6x1", ...REGIME_PRESETS["6x1"] }, "2026-03-02", "2026-03-08");
    expect(dias).toHaveLength(6);
  });

  it("5x2 escala 5 dias no ciclo de 7", () => {
    const dias = diasDeTrabalhoDoRegime({ tipo: "5x2", ...REGIME_PRESETS["5x2"] }, "2026-03-02", "2026-03-08");
    expect(dias).toHaveLength(5);
  });

  it("12x36 alterna dia trabalhado e dia de folga", () => {
    const dias = diasDeTrabalhoDoRegime({ tipo: "12x36", ...REGIME_PRESETS["12x36"] }, "2026-03-02", "2026-03-07");
    expect(dias).toEqual(["2026-03-02", "2026-03-04", "2026-03-06"]);
  });
});

describe("conformidade", () => {
  const regras = { carga_semanal_max_horas: 44, intervalo_minimo_horas: 11 };

  it("detecta sobreposição", () => {
    const alertas = analisarJornada(
      [
        {
          funcionario_id: "f1",
          data: "2026-03-10",
          folga: false,
          blocos: [
            { inicio_previsto: "2026-03-10T10:00:00Z", fim_previsto: "2026-03-10T19:00:00Z" },
            { inicio_previsto: "2026-03-10T18:00:00Z", fim_previsto: "2026-03-10T23:00:00Z" },
          ],
        },
      ],
      regras
    );
    expect(alertas.some((a) => a.tipo === "sobreposicao")).toBe(true);
  });

  it("detecta intervalo insuficiente entre jornadas", () => {
    const alertas = analisarJornada(
      [
        { funcionario_id: "f1", data: "2026-03-10", folga: false, blocos: [{ inicio_previsto: "2026-03-10T14:00:00Z", fim_previsto: "2026-03-10T23:00:00Z" }] },
        { funcionario_id: "f1", data: "2026-03-11", folga: false, blocos: [{ inicio_previsto: "2026-03-11T08:00:00Z", fim_previsto: "2026-03-11T17:00:00Z" }] },
      ],
      regras
    );
    expect(alertas.some((a) => a.tipo === "intervalo_insuficiente")).toBe(true);
  });

  it("detecta excesso de horas semanais conforme configuração", () => {
    const blocos = listarDatas("2026-03-02", "2026-03-07").map((d) => ({
      funcionario_id: "f1",
      data: d,
      folga: false,
      blocos: [{ inicio_previsto: `${d}T08:00:00Z`, fim_previsto: `${d}T18:00:00Z` }],
    }));
    const alertas = analisarJornada(blocos, regras);
    expect(alertas.some((a) => a.tipo === "excesso_horas")).toBe(true);
  });

  it("respeita limite configurado maior", () => {
    const blocos = listarDatas("2026-03-02", "2026-03-07").map((d) => ({
      funcionario_id: "f1",
      data: d,
      folga: false,
      blocos: [{ inicio_previsto: `${d}T08:00:00Z`, fim_previsto: `${d}T18:00:00Z` }],
    }));
    const alertas = analisarJornada(blocos, { carga_semanal_max_horas: 70, intervalo_minimo_horas: 11 });
    expect(alertas.some((a) => a.tipo === "excesso_horas")).toBe(false);
  });

  it("detecta dias sem cobertura", () => {
    const alertas = analisarCobertura(
      [{ funcionario_id: "f1", data: "2026-03-10", folga: false, blocos: [{ inicio_previsto: "2026-03-10T10:00:00Z", fim_previsto: "2026-03-10T15:00:00Z" }] }],
      "2026-03-10",
      "2026-03-12"
    );
    expect(alertas.map((a) => a.data)).toEqual(["2026-03-11", "2026-03-12"]);
  });
});
