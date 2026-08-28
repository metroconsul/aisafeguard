import { describe, expect, it } from "vitest";
import {
  calcVencimento,
  dadosSuficientes,
  deriveStatus,
  isIrregular,
  mediaAnterior,
  mensagemBloqueioPonto,
  motivoPrincipal,
  resumoRequisitos,
  validarItemKit,
  variacaoPercentual,
} from "@/lib/epi-compliance";

describe("calcVencimento", () => {
  it("soma dias corridos", () => {
    expect(calcVencimento(new Date("2026-01-10T12:00:00Z"), 30, "days").toISOString().slice(0, 10)).toBe("2026-02-09");
  });

  it("soma meses de calendário preservando o dia", () => {
    const d = calcVencimento(new Date(2026, 0, 15), 6, "months");
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 6, 15]);
  });

  it("ajusta para o último dia quando o mês destino é mais curto", () => {
    const d = calcVencimento(new Date(2026, 0, 31), 1, "months");
    expect([d.getMonth(), d.getDate()]).toEqual([1, 28]);
  });
});

describe("validarItemKit", () => {
  const base = { epiId: "a", quantidade: 1, validadeValor: 30, itensExistentes: [] as { epiId: string }[] };
  it("aceita item válido", () => expect(validarItemKit(base)).toBeNull());
  it("recusa quantidade inválida", () => expect(validarItemKit({ ...base, quantidade: 0 })).toMatch(/quantidade/i));
  it("recusa vida útil inválida", () => expect(validarItemKit({ ...base, validadeValor: -3 })).toMatch(/vida útil/i));
  it("recusa item duplicado", () => expect(validarItemKit({ ...base, itensExistentes: [{ epiId: "a" }] })).toMatch(/já está/i));
});

describe("deriveStatus", () => {
  const agora = new Date(2026, 5, 1);
  it("pendente sem entrega", () =>
    expect(deriveStatus({ quantidadeNecessaria: 2, quantidadeEntregue: 0, vencimento: null, agora })).toBe("pending"));
  it("parcial quando entregue menos que o necessário", () =>
    expect(deriveStatus({ quantidadeNecessaria: 2, quantidadeEntregue: 1, vencimento: new Date(2026, 8, 1), agora })).toBe("partial"));
  it("em dia quando completo e no prazo", () =>
    expect(deriveStatus({ quantidadeNecessaria: 2, quantidadeEntregue: 2, vencimento: new Date(2026, 8, 1), agora })).toBe("valid"));
  it("vencido tem prioridade", () =>
    expect(deriveStatus({ quantidadeNecessaria: 2, quantidadeEntregue: 2, vencimento: new Date(2026, 3, 1), agora })).toBe("expired"));
  it("exceção aprovada", () =>
    expect(deriveStatus({ quantidadeNecessaria: 2, quantidadeEntregue: 0, vencimento: null, dispensado: true, agora })).toBe("waived"));
});

describe("resumo e irregularidade", () => {
  const reqs = [
    { status: "valid" as const, obrigatorio: true, proxima_vencimento: "2026-09-01" },
    { status: "expired" as const, obrigatorio: true, proxima_vencimento: "2026-04-01" },
    { status: "waived" as const, obrigatorio: true, proxima_vencimento: null },
  ];

  it("marca irregular com item vencido obrigatório", () => expect(isIrregular(reqs)).toBe(true));
  it("não marca irregular quando só há itens válidos ou dispensados", () =>
    expect(isIrregular([reqs[0], reqs[2]])).toBe(false));
  it("resume contagens e pior vencimento", () => {
    const r = resumoRequisitos(reqs);
    expect(r.emDia).toBe(1);
    expect(r.vencidos).toBe(1);
    expect(r.dispensados).toBe(1);
    expect(r.piorVencimento?.toISOString().slice(0, 10)).toBe("2026-04-01");
  });
  it("prioriza vencido no motivo principal", () => expect(motivoPrincipal(reqs)).toBe("Item vencido"));
  it("item pendente vira motivo quando não há vencido", () =>
    expect(motivoPrincipal([{ status: "pending", obrigatorio: true }])).toBe("Item nunca entregue"));
});

describe("indicadores", () => {
  it("calcula variação percentual", () => expect(variacaoPercentual(120, 100)).toBeCloseTo(20));
  it("retorna null sem base de comparação", () => expect(variacaoPercentual(120, 0)).toBeNull());
  it("média dos períodos anteriores", () => expect(mediaAnterior([10, 20, 30], 2)).toBe(15));
  it("sem períodos anteriores retorna null", () => expect(mediaAnterior([10], 0)).toBeNull());
  it("exige ao menos 3 pontos para falar de tendência", () => {
    expect(dadosSuficientes(2)).toBe(false);
    expect(dadosSuficientes(3)).toBe(true);
  });
});

describe("mensagem de bloqueio", () => {
  it("descreve vencidos e pendentes", () => {
    expect(mensagemBloqueioPonto(1, 0)).toContain("1 item de EPI vencido");
    expect(mensagemBloqueioPonto(0, 2)).toContain("2 itens de EPI não entregues");
    expect(mensagemBloqueioPonto(0, 0)).toContain("pendência de EPI");
  });
});
