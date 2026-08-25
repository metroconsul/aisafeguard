import { useCallback, useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  HardHat,
  Clock,
  FileText,
  UserCheck,
  Smartphone,
  Workflow,
  Scale,
  Lock,
  CheckCircle2,
  TrendingUp,
  Server,
  Handshake,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  AlertTriangle,
} from "lucide-react";

const NAVY = "#000c24";
const NAVY_MID = "#0a193a";
const BLUE = "#0047ff";
const LIME = "#def320";

/* ─────────── primitives ─────────── */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-6 text-[22px] font-bold uppercase tracking-[0.18em]"
      style={{ color: LIME }}
    >
      {children}
    </p>
  );
}

function Title({ children, size = 88 }: { children: React.ReactNode; size?: number }) {
  return (
    <h2
      className="font-extrabold text-white"
      style={{ fontSize: size, lineHeight: 1.04, letterSpacing: "-0.035em" }}
    >
      {children}
    </h2>
  );
}

function Body({ children, muted = true }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <p
      className="max-w-[1000px]"
      style={{ fontSize: 32, lineHeight: 1.35, color: muted ? "rgba(255,255,255,0.68)" : "#fff" }}
    >
      {children}
    </p>
  );
}

function Card({
  icon: Icon,
  title,
  children,
  accent = LIME,
}: {
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  children?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      className="flex flex-col gap-4 rounded-3xl p-9"
      style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {Icon && (
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: `${accent}1f` }}
        >
          <Icon className="h-8 w-8" style={{ color: accent }} />
        </div>
      )}
      <h3 className="font-bold text-white" style={{ fontSize: 34, lineHeight: 1.15 }}>
        {title}
      </h3>
      {children && (
        <p style={{ fontSize: 26, lineHeight: 1.35, color: "rgba(255,255,255,0.66)" }}>{children}</p>
      )}
    </div>
  );
}

function Bullets({ items, accent = LIME }: { items: string[]; accent?: string }) {
  return (
    <ul className="flex flex-col gap-6">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-5">
          <CheckCircle2 className="mt-1 h-9 w-9 shrink-0" style={{ color: accent }} />
          <span style={{ fontSize: 32, lineHeight: 1.3, color: "rgba(255,255,255,0.82)" }}>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Stat({ value, label, accent = LIME }: { value: string; label: string; accent?: string }) {
  return (
    <div
      className="rounded-3xl p-9"
      style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <p className="font-extrabold" style={{ fontSize: 86, lineHeight: 1, color: accent }}>
        {value}
      </p>
      <p className="mt-4" style={{ fontSize: 26, lineHeight: 1.3, color: "rgba(255,255,255,0.66)" }}>
        {label}
      </p>
    </div>
  );
}


function Frame({
  children,
  variant = "dark",
}: {
  children: React.ReactNode;
  variant?: "dark" | "hero";
}) {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          variant === "hero"
            ? `radial-gradient(120% 100% at 15% 0%, ${NAVY_MID} 0%, ${NAVY} 60%)`
            : NAVY,
      }}
    >
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full"
        style={{ background: `${BLUE}22`, filter: "blur(90px)" }}
      />
      <div className="relative flex h-full w-full flex-col px-[110px] py-[92px]">{children}</div>
    </div>
  );
}

/* ─────────── slides ─────────── */

const slides: { title: string; render: () => JSX.Element }[] = [
  {
    title: "Capa",
    render: () => (
      <Frame variant="hero">
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-10 flex items-center gap-5">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl"
              style={{ background: LIME }}
            >
              <ShieldCheck className="h-11 w-11" style={{ color: NAVY }} />
            </div>
            <span className="font-extrabold text-white" style={{ fontSize: 44 }}>
              Ava Safeguard
            </span>
          </div>
          <h1
            className="font-extrabold text-white"
            style={{ fontSize: 116, lineHeight: 0.98, letterSpacing: "-0.045em", maxWidth: 1500 }}
          >
            Gestão de EPI, RH e Ponto{" "}
            <span
              style={{
                background: `linear-gradient(90deg, ${BLUE}, ${LIME})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              no automático
            </span>
          </h1>
          <p className="mt-10" style={{ fontSize: 40, color: "rgba(255,255,255,0.7)", maxWidth: 1200 }}>
            Plataforma SaaS para construtoras e indústrias. Assinatura digital, WhatsApp e
            compliance de NR em um só lugar.
          </p>
          <p className="mt-14 font-bold" style={{ fontSize: 26, color: LIME, letterSpacing: "0.14em" }}>
            PROPOSTA DE SOCIEDADE — INFRAESTRUTURA DE AUTOMAÇÕES
          </p>
        </div>
      </Frame>
    ),
  },
  {
    title: "O problema",
    render: () => (
      <Frame>
        <Kicker>O problema</Kicker>
        <Title>Segurança do trabalho ainda roda no papel</Title>
        <div className="mt-14 grid grid-cols-2 gap-8">
          <Card icon={AlertTriangle} title="Ficha de EPI em papel" accent="#f59e0b">
            Assinatura em prancheta, pasta perdida, e nenhuma prova rápida na hora da fiscalização
            da NR-6.
          </Card>
          <Card icon={Clock} title="Ponto manual" accent="#f59e0b">
            Planilha, folha assinada no fim do mês e retrabalho do RH para fechar a jornada.
          </Card>
          <Card icon={FileText} title="Holerite entregue à mão" accent="#f59e0b">
            Sem comprovante de recebimento e sem rastro de quem recebeu o quê.
          </Card>
          <Card icon={AlertTriangle} title="ASO e NR vencendo no escuro" accent="#f59e0b">
            Ninguém é avisado antes do vencimento — o risco aparece só na auditoria.
          </Card>
        </div>
      </Frame>
    ),
  },
  {
    title: "A solução",
    render: () => (
      <Frame>
        <Kicker>A solução</Kicker>
        <Title>Um sistema, três frentes</Title>
        <div className="mt-14 grid grid-cols-3 gap-8">
          <Card icon={ShieldCheck} title="Plataforma de gestão">
            Painel web para Admin, SST, RH e Almoxarifado, com dashboards por papel.
          </Card>
          <Card icon={Smartphone} title="Portal do Colaborador" accent={BLUE}>
            No celular, login por CPF + PIN. Bate ponto, assina EPI, holerite e ponto.
          </Card>
          <Card icon={Workflow} title="Automações WhatsApp">
            Fluxos n8n disparam avisos, links de assinatura e cobranças sozinhos.
          </Card>
        </div>
        <div className="mt-10">
          <Body>
            Todo documento entregue gera assinatura digital com trilha de auditoria — a empresa sai
            do papel sem mudar a rotina da obra.
          </Body>
        </div>
      </Frame>
    ),
  },
  {
    title: "Como funciona",
    render: () => (
      <Frame>
        <Kicker>Como funciona</Kicker>
        <Title>Três camadas conectadas</Title>
        <div className="mt-16 flex items-stretch gap-6">
          {[
            {
              n: "01",
              t: "Aplicação",
              d: "Gestor registra a entrega, o holerite ou o cartão de ponto no painel web.",
              c: LIME,
            },
            {
              n: "02",
              t: "Backend",
              d: "Grava no banco multi-tenant, gera o documento e dispara o evento com segurança.",
              c: BLUE,
            },
            {
              n: "03",
              t: "Automação",
              d: "n8n na VPS envia o WhatsApp com o link do portal e confere o status da assinatura.",
              c: LIME,
            },
          ].map((s) => (
            <div
              key={s.n}
              className="flex-1 rounded-3xl p-10"
              style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <p className="font-extrabold" style={{ fontSize: 62, color: s.c, lineHeight: 1 }}>
                {s.n}
              </p>
              <h3 className="mt-5 font-bold text-white" style={{ fontSize: 36 }}>
                {s.t}
              </h3>
              <p className="mt-4" style={{ fontSize: 26, lineHeight: 1.35, color: "rgba(255,255,255,0.66)" }}>
                {s.d}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-12" style={{ fontSize: 28, color: "rgba(255,255,255,0.6)" }}>
          O colaborador recebe, abre no celular, assina. O gestor vê o status em tempo real.
        </p>
      </Frame>
    ),
  },
  {
    title: "Módulo EPI",
    render: () => (
      <Frame>
        <Kicker>Módulo 1</Kicker>
        <Title>EPI com ficha digital assinada</Title>
        <div className="mt-14 grid grid-cols-[1.1fr_0.9fr] gap-14">
          <Bullets
            items={[
              "Catálogo de EPIs com CA, categoria e validade",
              "Entrega multi-seleção: vários EPIs para o colaborador em um clique",
              "Link de assinatura enviado por WhatsApp automaticamente",
              "Alerta de EPI vencido e solicitação de troca pelo próprio colaborador",
            ]}
          />
          <div className="flex flex-col gap-6">
            <Card icon={HardHat} title="Ficha por colaborador">
              Histórico completo de tudo que foi entregue, com data e assinatura.
            </Card>
            <Card icon={Scale} title="Prova para a NR-6" accent={BLUE}>
              Documento assinado com IP e data/hora, pronto para fiscalização.
            </Card>
          </div>
        </div>
      </Frame>
    ),
  },
  {
    title: "Módulo Ponto",
    render: () => (
      <Frame>
        <Kicker>Módulo 2</Kicker>
        <Title>Ponto pelo celular, fechamento sem retrabalho</Title>
        <div className="mt-14 grid grid-cols-2 gap-8">
          <Card icon={Smartphone} title="Registro com geolocalização">
            O colaborador bate ponto no portal; o sistema guarda local e dispositivo.
          </Card>
          <Card icon={Clock} title="Cartão mensal automático" accent={BLUE}>
            Rotina agendada gera o cartão de ponto do mês para toda a equipe.
          </Card>
          <Card icon={CheckCircle2} title="Assinatura do cartão">
            O colaborador confere e assina no celular; o status atualiza sozinho.
          </Card>
          <Card icon={AlertTriangle} title="Alerta de anomalia" accent="#f59e0b">
            Registro fora do padrão dispara aviso para o RH na hora.
          </Card>
        </div>
      </Frame>
    ),
  },
  {
    title: "Módulo RH",
    render: () => (
      <Frame>
        <Kicker>Módulo 3</Kicker>
        <Title>Holerites e cofre de documentos</Title>
        <div className="mt-14 grid grid-cols-[1fr_1fr] gap-14">
          <Bullets
            items={[
              "Upload de holerites com vínculo automático ao colaborador",
              "Aviso por WhatsApp e confirmação de recebimento registrada",
              "Cofre da empresa: PGR, PCMSO, laudos e certificados",
              "Cofre do colaborador: ASO, exames, treinamentos de NR",
            ]}
            accent={BLUE}
          />
          <div className="flex flex-col gap-6">
            <Card icon={FileText} title="Nada mais entregue à mão">
              Cada holerite tem trilha de quem recebeu e quando confirmou.
            </Card>
            <Card icon={AlertTriangle} title="Vencimentos monitorados" accent="#f59e0b">
              ASO e treinamentos vencendo aparecem no dashboard e no portal.
            </Card>
          </div>
        </div>
      </Frame>
    ),
  },
  {
    title: "Módulo Admissão",
    render: () => (
      <Frame>
        <Kicker>Módulo 4</Kicker>
        <Title>Admissão digital do candidato</Title>
        <div className="mt-16 flex items-stretch gap-6">
          {[
            { n: "01", t: "Link público", d: "RH envia um link exclusivo por WhatsApp ao candidato." },
            { n: "02", t: "Upload de documentos", d: "O candidato manda RG, CPF, CTPS e exames pelo celular." },
            { n: "03", t: "Análise em kanban", d: "RH aprova ou reprova documento por documento." },
            { n: "04", t: "Vira colaborador", d: "Aprovado, entra na base já com ficha e portal ativos." },
          ].map((s) => (
            <div
              key={s.n}
              className="flex-1 rounded-3xl p-8"
              style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <p className="font-extrabold" style={{ fontSize: 54, color: LIME, lineHeight: 1 }}>
                {s.n}
              </p>
              <h3 className="mt-4 font-bold text-white" style={{ fontSize: 32 }}>
                {s.t}
              </h3>
              <p className="mt-3" style={{ fontSize: 24, lineHeight: 1.35, color: "rgba(255,255,255,0.66)" }}>
                {s.d}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-12" style={{ fontSize: 28, color: "rgba(255,255,255,0.6)" }}>
          Zero papel na admissão — e o candidato nunca precisa ir até o escritório.
        </p>
      </Frame>
    ),
  },
  {
    title: "Portal do Colaborador",
    render: () => (
      <Frame>
        <Kicker>Diferencial</Kicker>
        <Title>O Portal do Colaborador</Title>
        <div className="mt-8">
          <Body>Login por CPF + PIN. Sem app para instalar, sem e-mail, sem senha esquecida.</Body>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-8">
          <Card icon={UserCheck} title="Pendências na home">
            Holerite a confirmar, ponto a assinar, NR vencendo — tudo na primeira tela.
          </Card>
          <Card icon={HardHat} title="Meus EPIs" accent={BLUE}>
            Histórico de entregas, assinatura pendente e pedido de troca.
          </Card>
          <Card icon={FileText} title="Meus documentos">
            Holerites, cartões de ponto e documentos pessoais sempre à mão.
          </Card>
        </div>
        <p className="mt-12" style={{ fontSize: 28, color: "rgba(255,255,255,0.6)" }}>
          É aqui que a adoção acontece: o operário resolve tudo em dois toques no WhatsApp.
        </p>
      </Frame>
    ),
  },
  {
    title: "Automações",
    render: () => (
      <Frame>
        <Kicker>O que a VPS destrava</Kicker>
        <Title>7 automações já construídas e testadas</Title>
        <div className="mt-12 grid grid-cols-2 gap-x-14 gap-y-7">
          {[
            ["Entrega de EPI", "WhatsApp com link do portal para assinar a ficha"],
            ["Onboarding de candidato", "Coleta e conferência de documentos de admissão"],
            ["Notificação de ponto", "Aviso do cartão de ponto disponível para assinatura"],
            ["Anomalia de ponto", "Alerta ao RH em registro fora do padrão"],
            ["Notificação de holerite", "Aviso de holerite disponível no portal"],
            ["Retorno de holerite", "Atualiza o status quando o colaborador confirma"],
            ["Cadastro de EPI", "Criação de EPI a partir de fluxo externo"],
          ].map(([t, d]) => (
            <div key={t} className="flex items-start gap-5">
              <div
                className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${LIME}1f` }}
              >
                <Workflow className="h-6 w-6" style={{ color: LIME }} />
              </div>
              <div>
                <p className="font-bold text-white" style={{ fontSize: 30 }}>
                  {t}
                </p>
                <p style={{ fontSize: 24, color: "rgba(255,255,255,0.62)", lineHeight: 1.3 }}>{d}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-12 font-bold" style={{ fontSize: 28, color: LIME }}>
          Tudo isso roda em n8n. Hoje em ambiente de teste. Em VPS, roda 24/7 para clientes reais.
        </p>
      </Frame>
    ),
  },
  {
    title: "Compliance",
    render: () => (
      <Frame>
        <Kicker>Valor jurídico</Kicker>
        <Title>Assinatura com prova, não só com foto</Title>
        <div className="mt-14 grid grid-cols-3 gap-8">
          <Stat value="IP" label="Endereço de origem registrado em cada assinatura" />
          <Stat value="Data/hora" label="Timestamp do servidor, não do celular" accent={BLUE} />
          <Stat value="Imagem" label="Traço da assinatura salvo junto ao documento" />
        </div>
        <div className="mt-12">
          <Bullets
            items={[
              "Log de assinaturas independente do documento, para auditoria",
              "Documentos guardados em storage privado com link temporário assinado",
              "Cada empresa vê apenas os próprios documentos",
            ]}
          />
        </div>
      </Frame>
    ),
  },
  {
    title: "Arquitetura",
    render: () => (
      <Frame>
        <Kicker>Arquitetura e segurança</Kicker>
        <Title>Construído para vender para várias empresas</Title>
        <div className="mt-14 grid grid-cols-2 gap-8">
          <Card icon={Lock} title="Multi-tenant isolado">
            Cada empresa tem os dados separados por políticas no banco e nas pastas de arquivo.
          </Card>
          <Card icon={UserCheck} title="4 papéis de acesso" accent={BLUE}>
            Admin, Técnico de Segurança, RH e Almoxarifado — cada um vê só o seu escopo.
          </Card>
          <Card icon={ShieldCheck} title="Portal sem brecha">
            O portal só fala com o backend por sessão validada; nada exposto ao público.
          </Card>
          <Card icon={Server} title="Backend gerenciado" accent={BLUE}>
            Banco, autenticação, arquivos e funções já em nuvem. A VPS entra só para as automações.
          </Card>
        </div>
      </Frame>
    ),
  },
  {
    title: "O que já está pronto",
    render: () => (
      <Frame>
        <Kicker>Estado atual</Kicker>
        <Title>Não é ideia — é produto rodando</Title>
        <div className="mt-14 grid grid-cols-4 gap-6">
          <Stat value="24" label="Telas do painel e do portal em produção" />
          <Stat value="29" label="Funções de backend publicadas" accent={BLUE} />
          <Stat value="7" label="Fluxos de automação construídos" />
          <Stat value="4" label="Módulos completos: EPI, Ponto, RH, Admissão" accent={BLUE} />
        </div>
        <div className="mt-12">
          <Bullets
            items={[
              "Site institucional com captação de leads já publicado",
              "E-mails transacionais e de autenticação configurados",
              "Auditoria de segurança aplicada: acesso anônimo removido das tabelas sensíveis",
            ]}
          />
        </div>
      </Frame>
    ),
  },
  {
    title: "Mercado e receita",
    render: () => (
      <Frame>
        <Kicker>Mercado e modelo</Kicker>
        <Title>Receita recorrente por contrato</Title>
        <div className="mt-6" style={{ fontSize: 26, color: "rgba(255,255,255,0.55)" }}>
          Números do plano comercial
        </div>
        <div className="mt-10 grid grid-cols-3 gap-8">
          <Stat value="R$ 2.500" label="ticket médio mensal por construtora" />
          <Stat value="R$ 30 mil" label="meta de receita recorrente em até 3 meses" accent={BLUE} />
          <Stat value="12" label="clientes ativos para bater a meta" />
        </div>

        <div className="mt-12">
          <Bullets
            items={[
              "Público: construtoras, indústrias e empresas de serviço com obra em campo",
              "Dor paga: multa de NR e passivo trabalhista custam muito mais que a mensalidade",
              "Expansão natural: começa no EPI e cresce para ponto, RH e admissão",
            ]}
            accent={BLUE}
          />
        </div>
      </Frame>
    ),
  },
  {
    title: "Custos e o sócio",
    render: () => (
      <Frame>
        <Kicker>O papel do sócio</Kicker>
        <Title>A infra é o que falta para vender</Title>
        <div className="mt-6" style={{ fontSize: 26, color: "rgba(255,255,255,0.55)" }}>
          Custo real de infraestrutura (Hostinger VPS KVM 2)
        </div>
        <div className="mt-10 grid grid-cols-[1fr_1fr] gap-14">
          <div className="flex flex-col gap-6">
            <Card icon={Server} title="VPS KVM 2: R$ 43,99/mês">
              Plano de 24 meses (R$ 1.055,76 à vista) com domínio grátis. Renovação a R$ 77,99/mês.
            </Card>
            <Card icon={Smartphone} title="Backup diário: R$ 32,99/mês" accent={BLUE}>
              Opcional recomendado pela Hostinger para as automações em produção.
            </Card>
          </div>
          <div className="flex flex-col gap-6">
            <Card icon={CheckCircle2} title="Domínio: R$ 467,98/ano">
              Também na Hostinger, cerca de R$ 39/mês. Infra total: ~R$ 116/mês.
            </Card>
            <Card icon={TrendingUp} title="Break-even no 1º cliente" accent={BLUE}>
              Um contrato de R$ 2.500/mês cobre a infra inteira mais de 20 vezes.
            </Card>

          </div>
        </div>
      </Frame>
    ),
  },
  {
    title: "Proposta",
    render: () => (
      <Frame variant="hero">
        <Kicker>A proposta</Kicker>
        <Title size={84}>Você leva a operação e as vendas. Eu fico no T.I.</Title>
        <div className="mt-14 grid grid-cols-2 gap-8">
          <Card icon={Handshake} title="Você — sócio operativo">
            Sua empresa de engenharia entra como cliente piloto sem custo. Além da VPS, WhatsApp e operação, você conversa com construtoras e fecha os primeiros contratos pela sua credibilidade no setor.
          </Card>
          <Card icon={ShieldCheck} title="Eu — produto e tecnologia" accent={BLUE}>
            Foco no desenvolvimento, automações, suporte técnico e evolução da plataforma enquanto você valida o produto no mercado.
          </Card>
        </div>
        <div className="mt-12">
          <Bullets
            items={[
              "30 dias: automações na VPS e sua empresa usando como piloto",
              "60 dias: 3 clientes pagantes e cobrança recorrente ativa",
              "90 dias: 10 clientes e divisão societária formalizada",
            ]}
          />
        </div>
        <p className="mt-12 font-extrabold" style={{ fontSize: 40, color: LIME }}>
          Falta só ligar a chave.
        </p>
      </Frame>
    ),
  },
];

/* ─────────── shell ─────────── */

export default function Pitch() {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const go = useCallback((delta: number) => {
    setIndex((i) => Math.min(slides.length - 1, Math.max(0, i + delta)));
  }, []);

  useEffect(() => {
    const resize = () => {
      const el = containerRef.current;
      if (!el) return;
      setScale(Math.min(el.clientWidth / 1920, el.clientHeight / 1080));
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") go(1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  useEffect(() => {
    document.title = `${index + 1}/${slides.length} — ${slides[index].title} | Pitch Ava Safeguard`;
  }, [index]);

  const fullscreen = () => {
    void document.documentElement.requestFullscreen?.();
  };

  return (
    <div className="flex h-screen w-full flex-col" style={{ background: "#05060a" }}>
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: 1920,
            height: 1080,
            marginLeft: -960,
            marginTop: -540,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {slides[index].render()}
        </div>
      </div>

      <div
        className="flex items-center justify-between px-6 py-3"
        style={{ background: NAVY, borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-white/60">
          <ShieldCheck className="h-4 w-4" style={{ color: LIME }} />
          <span>Pitch Ava Safeguard</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => go(-1)}
            disabled={index === 0}
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 disabled:opacity-30"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[70px] text-center text-sm font-bold text-white/80">
            {index + 1} / {slides.length}
          </span>
          <button
            onClick={() => go(1)}
            disabled={index === slides.length - 1}
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 disabled:opacity-30"
            aria-label="Próximo slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={fullscreen}
            className="ml-2 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5"
            style={{ background: LIME, color: NAVY }}
          >
            <Maximize2 className="h-4 w-4" /> Apresentar
          </button>
        </div>
      </div>
    </div>
  );
}
