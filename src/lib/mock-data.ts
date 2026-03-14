// Mock/seed data for when DB is empty

export const mockFuncionarios = [
  { nome: "Carlos Silva", matricula: "EMP-001", cargo: "Operador de Máquinas", setor: "Produção", telefone_whatsapp: "+5511999990001" },
  { nome: "Maria Santos", matricula: "EMP-002", cargo: "Soldadora", setor: "Manutenção", telefone_whatsapp: "+5511999990002" },
  { nome: "João Oliveira", matricula: "EMP-003", cargo: "Eletricista", setor: "Elétrica", telefone_whatsapp: "+5511999990003" },
  { nome: "Ana Costa", matricula: "EMP-004", cargo: "Técnica Química", setor: "Laboratório", telefone_whatsapp: "+5511999990004" },
  { nome: "Pedro Almeida", matricula: "EMP-005", cargo: "Mecânico", setor: "Manutenção", telefone_whatsapp: "+5511999990005" },
  { nome: "Fernanda Lima", matricula: "EMP-006", cargo: "Operadora", setor: "Logística", telefone_whatsapp: "+5511999990006" },
];

export const mockEpis = [
  { nome_equipamento: "Luva de Proteção Mecânica", numero_ca: "CA-15834", dias_validade: 180, quantidade_estoque: 45 },
  { nome_equipamento: "Óculos de Segurança", numero_ca: "CA-26573", dias_validade: 365, quantidade_estoque: 120 },
  { nome_equipamento: "Bota de Segurança", numero_ca: "CA-31284", dias_validade: 365, quantidade_estoque: 30 },
  { nome_equipamento: "Capacete de Proteção", numero_ca: "CA-42198", dias_validade: 730, quantidade_estoque: 60 },
  { nome_equipamento: "Protetor Auricular", numero_ca: "CA-18723", dias_validade: 90, quantidade_estoque: 200 },
  { nome_equipamento: "Máscara Respiratória PFF2", numero_ca: "CA-39412", dias_validade: 30, quantidade_estoque: 500 },
  { nome_equipamento: "Avental de Raspa", numero_ca: "CA-22145", dias_validade: 365, quantidade_estoque: 25 },
  { nome_equipamento: "Luva Isolante", numero_ca: "CA-50321", dias_validade: 180, quantidade_estoque: 15 },
];

// Chart mock data
export const entregasPorSetorData = [
  { mes: "Jul", Produção: 12, Manutenção: 8, Elétrica: 5, Laboratório: 3, Logística: 6 },
  { mes: "Ago", Produção: 15, Manutenção: 10, Elétrica: 7, Laboratório: 4, Logística: 8 },
  { mes: "Set", Produção: 18, Manutenção: 12, Elétrica: 6, Laboratório: 5, Logística: 9 },
  { mes: "Out", Produção: 14, Manutenção: 9, Elétrica: 8, Laboratório: 3, Logística: 7 },
  { mes: "Nov", Produção: 20, Manutenção: 11, Elétrica: 4, Laboratório: 6, Logística: 10 },
  { mes: "Dez", Produção: 22, Manutenção: 14, Elétrica: 9, Laboratório: 7, Logística: 12 },
];

export const entregasSemanaData = [
  { dia: "Dom", entregas: 2 },
  { dia: "Seg", entregas: 8 },
  { dia: "Ter", entregas: 12 },
  { dia: "Qua", entregas: 6 },
  { dia: "Qui", entregas: 9 },
  { dia: "Sex", entregas: 14 },
  { dia: "Sáb", entregas: 3 },
];

export const distribuicaoEpiData = [
  { name: "Luvas", value: 32, fill: "hsl(239, 84%, 67%)" },
  { name: "Óculos", value: 24, fill: "hsl(187, 85%, 53%)" },
  { name: "Botas", value: 18, fill: "hsl(217, 91%, 60%)" },
  { name: "Capacetes", value: 14, fill: "hsl(142, 71%, 45%)" },
  { name: "Protetores", value: 8, fill: "hsl(215, 16%, 47%)" },
  { name: "Máscaras", value: 4, fill: "hsl(38, 92%, 50%)" },
];

export const ultimasEntregas = [
  { funcionario: "Carlos Silva", epi: "Luva de Proteção", ca: "CA-15834", status: "Assinado" as const, setor: "Produção" },
  { funcionario: "Maria Santos", epi: "Óculos de Segurança", ca: "CA-26573", status: "Pendente" as const, setor: "Manutenção" },
  { funcionario: "João Oliveira", epi: "Luva Isolante", ca: "CA-50321", status: "Assinado" as const, setor: "Elétrica" },
  { funcionario: "Ana Costa", epi: "Máscara PFF2", ca: "CA-39412", status: "Pendente" as const, setor: "Laboratório" },
  { funcionario: "Pedro Almeida", epi: "Bota de Segurança", ca: "CA-31284", status: "Assinado" as const, setor: "Manutenção" },
];
