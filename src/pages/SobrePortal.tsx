import { motion, useReducedMotion, type Easing, type Variants } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Smartphone,
  MessageSquare,
  Lock,
  FileText,
  HardHat,
  Award,
  ArrowLeft,
  ArrowRight,
  PenLine,
  BellRing,
  Fingerprint,
} from "lucide-react";

/* ─────────────────────────────────────────────
   DESIGN TOKENS — mesmos da landing Ava Safeguard
   ───────────────────────────────────────────── */
const T = {
  bg: "#F4F6FA",
  surface: "#FFFFFF",
  ink: "#101114",
  muted: "#6F8CAA",
  primary: "#00378A",
  primarySoft: "#E6EEF7",
  accent: "#4dd8ff",
  success: "#059669",
  warning: "#D97706",
  radiusCard: "20px",
  radiusPanel: "28px",
  shadowSoft: "0 12px 34px rgba(16,17,20,.07)",
  shadowFloat: "0 16px 28px rgba(16,17,20,.12)",
  contentMax: "1180px",
};

const easeOut: Easing = "easeOut";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOut } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const viewportOnce = { once: true, amount: 0.2 } as const;

function Section({
  id,
  children,
  tone = "bg",
}: {
  id?: string;
  children: React.ReactNode;
  tone?: "bg" | "surface";
}) {
  return (
    <section
      id={id}
      className="px-5"
      style={{
        background: tone === "bg" ? T.bg : T.surface,
        paddingTop: "clamp(72px, 10vw, 130px)",
        paddingBottom: "clamp(72px, 10vw, 130px)",
      }}
    >
      <div className="mx-auto w-full" style={{ maxWidth: T.contentMax }}>
        {children}
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={stagger} className="text-center">
      {eyebrow && (
        <motion.span
          variants={fadeUp}
          className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ background: T.primarySoft, color: T.primary }}
        >
          {eyebrow}
        </motion.span>
      )}
      <motion.h2
        variants={fadeUp}
        className="mt-4 font-extrabold"
        style={{ color: T.ink, letterSpacing: "-0.03em", fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)", lineHeight: 1.12 }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-base leading-relaxed" style={{ color: T.muted }}>
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}

/* ───────── chip flutuante ao redor do celular ───────── */
function Orbit({
  className,
  delay,
  reduced,
  children,
}: {
  className?: string;
  delay: number;
  reduced: boolean | null;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={`absolute hidden rounded-2xl bg-white p-3 xl:block ${className ?? ""}`}
      style={{ boxShadow: T.shadowFloat }}
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={
        reduced
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 1, y: [0, -7, 0], scale: 1 }
      }
      transition={
        reduced
          ? { duration: 0.4, delay }
          : {
              opacity: { duration: 0.5, delay },
              scale: { duration: 0.5, delay },
              y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay },
            }
      }
    >
      {children}
    </motion.div>
  );
}

/* ───────── mockup do portal (celular) ───────── */
function PhoneMockup() {
  const items = [
    { icon: FileText, label: "Meus holerites", badge: "1 novo", tone: T.primary },
    { icon: HardHat, label: "Meus EPIs", badge: "3 ativos", tone: T.primary },
    { icon: Award, label: "Treinamentos", badge: "NR-35 ok", tone: T.success },
    { icon: Lock, label: "Documentos", badge: "", tone: T.muted },
  ];

  return (
    <div
      className="w-[260px] rounded-[40px] border border-black/5 bg-white p-3 sm:w-[280px]"
      style={{ boxShadow: T.shadowFloat }}
    >
      <div className="overflow-hidden rounded-[32px]" style={{ background: T.bg }}>
        <div className="p-5" style={{ background: T.primary }}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" style={{ color: T.accent }} />
            <span className="text-[11px] font-bold text-white">Portal do Colaborador</span>
          </div>
          <p className="mt-3 text-lg font-extrabold text-white" style={{ letterSpacing: "-0.02em" }}>
            Olá, João
          </p>
          <p className="mt-0.5 text-[11px] text-white/60">Operador · Construtora Alpha</p>
        </div>

        <div className="space-y-2.5 p-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex min-w-0 items-center gap-3 rounded-2xl bg-white p-3"
                style={{ boxShadow: "0 4px 14px rgba(16,17,20,.05)" }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: T.primarySoft, color: T.primary }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-semibold" style={{ color: T.ink }}>
                  {item.label}
                </span>
                {item.badge && (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold"
                    style={{ background: `${item.tone}14`, color: item.tone }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}

          <div
            className="rounded-2xl p-3"
            style={{ background: `${T.success}0f`, border: `1px solid ${T.success}26` }}
          >
            <div className="flex items-center gap-2">
              <PenLine className="h-3.5 w-3.5" style={{ color: T.success }} />
              <p className="text-[11px] font-bold" style={{ color: T.ink }}>
                Assinar agora
              </p>
            </div>
            <p className="mt-1 text-[10px]" style={{ color: T.muted }}>
              Capacete MSA · CA 12345
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const beneficios = [
  {
    icon: Fingerprint,
    title: "Entrar é simples",
    desc: "Só CPF e o PIN que o RH te passa. Sem e-mail corporativo, sem senha para esquecer.",
  },
  {
    icon: FileText,
    title: "Holerite sem fila",
    desc: "Assine e baixe o holerite do mês pelo celular, com assinatura digital registrada.",
  },
  {
    icon: HardHat,
    title: "Seus EPIs em ordem",
    desc: "Veja o que já recebeu, assine a ficha de entrega e acompanhe o que está pendente.",
  },
  {
    icon: Award,
    title: "Certificados na mão",
    desc: "Mostre suas NRs válidas na portaria da obra direto da tela do celular.",
  },
];

const passos = [
  {
    n: "01",
    icon: BellRing,
    title: "Você recebe o aviso",
    desc: "Quando um documento fica disponível, o gestor te avisa e o portal já mostra o pendente.",
  },
  {
    n: "02",
    icon: Smartphone,
    title: "Entra com CPF e PIN",
    desc: "Abre o link no celular, digita o CPF e o PIN e cai direto no que precisa assinar.",
  },
  {
    n: "03",
    icon: PenLine,
    title: "Assina e guarda",
    desc: "A assinatura registra data, hora e dispositivo. O documento fica salvo no seu cofre.",
  },
];

export default function SobrePortal() {
  const reduced = useReducedMotion();

  return (
    <div className="min-h-screen overflow-x-hidden antialiased" style={{ background: T.bg, fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
      {/* ─── Navbar flutuante ─── */}
      <header className="fixed inset-x-0 top-0 z-50 px-5 pt-4">
        <div
          className="mx-auto flex items-center justify-between rounded-full bg-white px-4 py-2.5 sm:px-6"
          style={{ maxWidth: T.contentMax, boxShadow: T.shadowSoft }}
        >
          <Link to="/" className="flex items-center gap-2.5 font-extrabold" style={{ color: T.ink, letterSpacing: "-0.02em" }}>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: T.primary }}>
              <ShieldCheck className="h-4 w-4 text-white" />
            </span>
            <span className="text-base sm:text-lg">Ava Safeguard</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="hidden text-sm font-semibold transition-colors sm:inline hover:opacity-70"
              style={{ color: T.muted }}
            >
              Site da empresa
            </Link>
            <Link
              to="/portal/login"
              className="rounded-full px-4 py-2 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 sm:px-5"
              style={{ background: T.primary }}
            >
              Acessar meu portal
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section
        className="px-5"
        style={{ background: T.bg, paddingTop: "clamp(120px, 15vw, 170px)", paddingBottom: "clamp(72px, 10vw, 120px)" }}
      >
        <div className="mx-auto w-full" style={{ maxWidth: T.contentMax }}>
          <motion.div initial="hidden" animate="visible" variants={stagger} className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
            <div className="text-center lg:text-left">
              <motion.span
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold"
                style={{ color: T.primary, boxShadow: T.shadowSoft }}
              >
                <Lock className="h-3.5 w-3.5" />
                Acesso do colaborador com CPF e PIN
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="mt-6 font-extrabold"
                style={{ color: T.ink, letterSpacing: "-0.035em", fontSize: "clamp(2.25rem, 5.4vw, 3.6rem)", lineHeight: 1.05 }}
              >
                Seus documentos de trabalho{" "}
                <span style={{ color: T.primary }}>na palma da mão.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mx-auto mt-6 max-w-xl text-base leading-relaxed sm:text-lg lg:mx-0"
                style={{ color: T.muted }}
              >
                Holerite, ficha de EPI, cartão de ponto e certificados de NR em um só lugar. Você abre pelo celular,
                confere e assina — sem passar no RH.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  to="/portal/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 sm:w-auto"
                  style={{ background: T.primary, boxShadow: T.shadowFloat }}
                >
                  Acessar meu portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex w-full items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-bold transition-transform hover:-translate-y-0.5 sm:w-auto"
                  style={{ color: T.ink, boxShadow: T.shadowSoft }}
                >
                  Como funciona
                </a>
              </motion.div>
            </div>

            {/* Celular + chips orbitais */}
            <motion.div variants={fadeUp} className="relative flex justify-center">
              <PhoneMockup />

              <Orbit className="-left-[190px] top-6 w-[186px]" delay={0} reduced={reduced}>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${T.success}1a`, color: T.success }}>
                    <PenLine className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold" style={{ color: T.ink }}>Holerite assinado</p>
                    <p className="text-[10px]" style={{ color: T.muted }}>Abril/2026</p>
                  </div>
                </div>
              </Orbit>

              <Orbit className="-right-[180px] top-16 w-[178px]" delay={0.14} reduced={reduced}>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: T.primarySoft, color: T.primary }}>
                    <HardHat className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold" style={{ color: T.ink }}>EPI pendente</p>
                    <p className="text-[10px]" style={{ color: T.muted }}>Botina · CA 41000</p>
                  </div>
                </div>
              </Orbit>

              <Orbit className="-left-[176px] bottom-12 w-[174px]" delay={0.28} reduced={reduced}>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${T.warning}1a`, color: T.warning }}>
                    <Award className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold" style={{ color: T.ink }}>NR-35 válida</p>
                    <p className="text-[10px]" style={{ color: T.muted }}>Vence em 8 meses</p>
                  </div>
                </div>
              </Orbit>

              <Orbit className="-right-[168px] bottom-6 w-[166px]" delay={0.42} reduced={reduced}>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: T.primarySoft, color: T.primary }}>
                    <Fingerprint className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[11px] font-bold" style={{ color: T.ink }}>Login por CPF + PIN</p>
                </div>
              </Orbit>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Benefícios ─── */}
      <Section tone="surface">
        <SectionHeading
          eyebrow="No seu bolso"
          title="Tudo que você precisa, sem papel"
          subtitle="O portal foi feito para ser usado no celular, no meio da obra, em poucos toques."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
          className="mt-12 grid gap-5 sm:grid-cols-2"
        >
          {beneficios.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                variants={fadeUp}
                className="min-w-0 p-7 transition-transform hover:-translate-y-1"
                style={{ background: T.bg, borderRadius: T.radiusPanel }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: T.surface, color: T.primary, boxShadow: T.shadowSoft }}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold" style={{ color: T.ink, letterSpacing: "-0.02em" }}>
                  {card.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed" style={{ color: T.muted }}>
                  {card.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </Section>

      {/* ─── Como funciona ─── */}
      <Section id="como-funciona">
        <SectionHeading
          eyebrow="Como funciona"
          title="Do aviso à assinatura em três toques"
          subtitle="Nada de aplicativo para instalar: é o navegador do seu celular."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
          className="mt-12 grid gap-5 md:grid-cols-3"
        >
          {passos.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.n}
                variants={fadeUp}
                className="min-w-0 bg-white p-7"
                style={{ borderRadius: T.radiusPanel, boxShadow: T.shadowSoft }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: T.primarySoft, color: T.primary }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-extrabold" style={{ color: T.accentText ?? T.primary }}>
                    {step.n}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold" style={{ color: T.ink, letterSpacing: "-0.02em" }}>
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed" style={{ color: T.muted }}>
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </Section>

      {/* ─── Aviso por WhatsApp (manual) ─── */}
      <Section tone="surface">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
          className="grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_.85fr]"
          style={{ background: T.bg, borderRadius: T.radiusPanel }}
        >
          <motion.div variants={fadeUp} className="min-w-0">
            <span
              className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ background: T.primarySoft, color: T.primary }}
            >
              Avisos
            </span>
            <h2
              className="mt-4 font-extrabold"
              style={{ color: T.ink, letterSpacing: "-0.03em", fontSize: "clamp(1.5rem, 3vw, 2.1rem)", lineHeight: 1.15 }}
            >
              O portal é a fonte oficial. O WhatsApp é só o lembrete.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed sm:text-base" style={{ color: T.muted }}>
              Todo documento novo aparece no portal na hora. Se o gestor achar necessário, ele envia um lembrete pelo
              WhatsApp com o link — mas você pode simplesmente entrar no portal e resolver.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="min-w-0 bg-white p-5"
            style={{ borderRadius: T.radiusCard, boxShadow: T.shadowSoft }}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${T.success}14`, color: T.success }}>
                <MessageSquare className="h-4 w-4" />
              </span>
              <p className="text-xs font-bold" style={{ color: T.ink }}>Lembrete enviado pelo gestor</p>
            </div>
            <div className="mt-4 rounded-2xl p-4" style={{ background: T.bg }}>
              <p className="text-xs leading-relaxed" style={{ color: T.ink }}>
                Olá, João. Sua ficha de entrega de EPI está disponível no portal para assinatura.
              </p>
              <p className="mt-3 truncate text-[11px] font-semibold" style={{ color: T.primary }}>
                ava-safeguard · /portal/login
              </p>
            </div>
            <p className="mt-3 text-[11px]" style={{ color: T.muted }}>
              Envio manual, quando faz sentido — nunca automático.
            </p>
          </motion.div>
        </motion.div>
      </Section>

      {/* ─── CTA final ─── */}
      <Section>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
          className="px-6 py-14 text-center sm:px-12"
          style={{ background: T.primary, borderRadius: T.radiusPanel }}
        >
          <motion.h2
            variants={fadeUp}
            className="mx-auto max-w-2xl font-extrabold text-white"
            style={{ letterSpacing: "-0.03em", fontSize: "clamp(1.6rem, 3.4vw, 2.4rem)", lineHeight: 1.12 }}
          >
            Pronto para acessar seus documentos?
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
            Use o CPF e o PIN que o RH da sua empresa forneceu. Se você não tem o PIN, fale com o RH.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/portal/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold transition-transform hover:-translate-y-0.5 sm:w-auto"
              style={{ color: T.primary }}
            >
              Acessar meu portal
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="/#precos"
              className="inline-flex w-full items-center justify-center rounded-full px-7 py-3.5 text-sm font-bold text-white transition-colors sm:w-auto"
              style={{ border: "1px solid rgba(255,255,255,.25)" }}
            >
              Sou gestor, quero conhecer
            </a>
          </motion.div>
        </motion.div>
      </Section>

      {/* ─── Footer ─── */}
      <footer className="px-5 pb-12" style={{ background: T.bg }}>
        <div className="mx-auto w-full" style={{ maxWidth: T.contentMax }}>
          <div className="flex flex-col items-center gap-6 border-t pt-10 text-center" style={{ borderColor: "rgba(16,17,20,.08)" }}>
            <Link to="/" className="flex items-center gap-2.5 font-extrabold" style={{ color: T.ink, letterSpacing: "-0.02em" }}>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: T.primary }}>
                <ShieldCheck className="h-4 w-4 text-white" />
              </span>
              Ava Safeguard
            </Link>

            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: T.muted }}>
              <ArrowLeft className="h-4 w-4" />
              Voltar para o site da empresa
            </Link>

            <p className="text-xs" style={{ color: T.muted }}>
              © {new Date().getFullYear()} Ava Safeguard. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
