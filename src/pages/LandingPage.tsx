import { motion, useReducedMotion, type Easing, type Variants } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  MessageSquare,
  Menu,
  X,
  Loader2,
  Lock,
  BarChart3,
  HardHat,
  FileText,
  Boxes,
  Mail,
  Smartphone,
  PenLine,
  FolderLock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Link2,
  Upload,
  UserCheck,
  Check,
  Star,
  Clock,
  Linkedin,
  Instagram,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ─────────────────────────────────────────────
   DESIGN TOKENS — landing Ava Safeguard
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

/* Section wrapper with consistent breathing room */
function Section({
  id,
  children,
  tone = "bg",
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  tone?: "bg" | "surface";
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`px-5 ${className}`}
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

/* ───────── lead modal (lógica preservada) ───────── */
function LeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-lead-email", {
        body: { nome, empresa, email, whatsapp },
      });
      if (error) throw error;
      toast.success("Recebemos seus dados! Entraremos em contato em breve.");
      setNome("");
      setEmpresa("");
      setEmail("");
      setWhatsapp("");
      onClose();
    } catch {
      toast.error("Não foi possível enviar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-900 outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Agendar demonstração">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md bg-white p-8"
        style={{ borderRadius: T.radiusPanel, boxShadow: T.shadowFloat }}
      >
        <button
          onClick={onClose}
          aria-label="Fechar formulário"
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: T.primary }}>
          <ShieldCheck className="h-5 w-5" style={{ color: T.accent }} />
        </div>
        <h3 className="mt-4 text-xl font-bold" style={{ color: T.ink }}>Agendar demonstração</h3>
        <p className="mt-1 text-sm" style={{ color: T.muted }}>Preencha seus dados e um consultor entrará em contato.</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label htmlFor="lead-nome" className="text-xs font-semibold text-slate-600">Nome *</label>
            <input id="lead-nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" className={inputClass} required />
          </div>
          <div>
            <label htmlFor="lead-empresa" className="text-xs font-semibold text-slate-600">Empresa *</label>
            <input id="lead-empresa" type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nome da empresa" className={inputClass} required />
          </div>
          <div>
            <label htmlFor="lead-email" className="text-xs font-semibold text-slate-600">E-mail corporativo *</label>
            <input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com.br" className={inputClass} required />
          </div>
          <div>
            <label htmlFor="lead-whats" className="text-xs font-semibold text-slate-600">WhatsApp</label>
            <input id="lead-whats" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: T.primary }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Enviando..." : "Solicitar demonstração"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ───────── dados reais do produto ───────── */
const personas = [
  { icon: BarChart3, title: "Administrador", desc: "Custos com EPI, risco jurídico e visão financeira consolidada." },
  { icon: HardHat, title: "Técnico de SST", desc: "Conformidade, NRs vencendo e controle de treinamentos." },
  { icon: FileText, title: "Recursos Humanos", desc: "Holerites em lote, ASOs e funil de admissão digital." },
  { icon: Boxes, title: "Almoxarifado", desc: "Baixa e entrega de EPIs direto no canteiro de obras." },
];

const automacoes = [
  { title: "Entrega de EPI", desc: "O almoxarifado registra a entrega e o EPI fica disponível no portal, aguardando assinatura." },
  { title: "Holerite disponível", desc: "Ao rodar a folha em lote, cada colaborador recebe o holerite com assinatura digital." },
  { title: "Cartão de ponto mensal", desc: "Fechamento mensal gerado automaticamente e assinado pelo colaborador no portal." },
  { title: "Admissão digital", desc: "O candidato envia documentos pelo celular por um link público — sem ir até o RH." },
];

const passos = [
  { icon: Link2, num: "01", title: "Link público", desc: "O RH cadastra nome e WhatsApp. O sistema gera um link único." },
  { icon: Upload, num: "02", title: "Upload responsivo", desc: "O candidato fotografa RG e comprovante pelo próprio celular." },
  { icon: UserCheck, num: "03", title: "Conversão em 1 clique", desc: "Documentos validados caem no cofre digital do funcionário." },
];

const canais = [
  { icon: MessageSquare, name: "WhatsApp", categoria: "Notificação manual", desc: "O gestor envia lembretes de assinatura pelo WhatsApp quando fizer sentido — nunca em disparo automático." },
  { icon: Mail, name: "E-mail transacional", categoria: "Comunicação", desc: "Holerites, convites de equipe e confirmações de assinatura enviados por e-mail com histórico." },
  { icon: Smartphone, name: "Portal do colaborador", categoria: "Acesso mobile", desc: "Login por CPF e PIN. O funcionário consulta EPIs, holerites, pontos e documentos pelo celular." },
  { icon: PenLine, name: "Assinatura digital", categoria: "Conformidade", desc: "Cada assinatura registra IP, data, hora e dispositivo, formando trilha de auditoria." },
  { icon: FolderLock, name: "Cofre de documentos", categoria: "Armazenamento", desc: "Arquivos isolados por empresa, com acesso por link assinado e expiração controlada." },
];

/* TODO: substituir por depoimentos reais (nome, cargo, empresa, nota, texto e avatar autorizado). */
type Depoimento = { nome: string; cargo: string; empresa?: string; nota: number; texto: string; avatarUrl?: string };
const depoimentos: Depoimento[] = [];

const pricingPlans = [
  {
    name: "Padrão",
    price: "R$ 149",
    period: "/mês",
    desc: "Para pequenas obras e indústrias.",
    features: ["Até 50 funcionários", "EPIs + Holerites", "Portal do Colaborador", "Assinatura Digital", "Suporte por e-mail"],
    highlighted: false,
  },
  {
    name: "Construtora Pro",
    price: "R$ 349",
    period: "/mês",
    desc: "Para construtoras de médio porte.",
    features: ["Até 300 funcionários", "Tudo do Padrão", "Lembretes por WhatsApp", "Admissão Digital", "Treinamentos & NRs", "Suporte prioritário"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    period: "",
    desc: "Para grandes construtoras e redes.",
    features: ["Funcionários ilimitados", "Tudo do Pro", "Multi-obras (CNPJ)", "API dedicada", "Gerente de conta", "SLA customizado"],
    highlighted: false,
  },
];

const faqs = [
  { q: "Como o sistema beneficia minha construtora?", a: "O Ava Safeguard elimina processos em papel, centraliza as assinaturas no portal do colaborador e gera um cofre digital auditável. Isso reduz o risco de multas trabalhistas e economiza horas da equipe de RH e SST." },
  { q: "Os dados dos meus funcionários estão seguros?", a: "Sim. Utilizamos isolamento completo de dados por empresa (Row Level Security), hospedagem em nuvem com backups automáticos e estamos em conformidade com a LGPD." },
  { q: "O sistema é adequado para pequenas empresas?", a: "Absolutamente. O plano Padrão foi pensado para obras menores, com interface simplificada e preço acessível. Você escala conforme cresce." },
];

/* ───────── mockup central do produto ───────── */
function DashboardMockup() {
  return (
    <div className="bg-white p-4 md:p-6" style={{ borderRadius: T.radiusPanel, boxShadow: T.shadowFloat }} aria-label="Prévia do painel Ava Safeguard" role="img">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: T.primary }}>
          <ShieldCheck className="h-4 w-4" style={{ color: T.accent }} />
        </div>
        <span className="text-sm font-bold" style={{ color: T.ink }}>Painel Ava Safeguard</span>
        <span className="ml-auto rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: T.primarySoft, color: T.primary }}>Tempo real</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Funcionários", val: "312" },
          { label: "EPIs entregues", val: "1.847" },
          { label: "Holerites assinados", val: "98%" },
          { label: "Treinamentos", val: "45" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl p-3" style={{ background: T.bg }}>
            <p className="truncate text-[10px] font-medium" style={{ color: T.muted }}>{k.label}</p>
            <p className="mt-1 text-lg font-bold" style={{ color: T.ink }}>{k.val}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <div className="flex-1 rounded-2xl p-3" style={{ background: T.bg }}>
          <p className="mb-2 text-[10px] font-semibold" style={{ color: T.muted }}>Entregas por semana</p>
          <div className="flex h-16 items-end gap-1">
            {[40, 60, 45, 80, 65, 75, 55, 70, 85, 50, 68, 90].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i >= 10 ? T.accent : T.primary, opacity: i >= 10 ? 1 : 0.35 + i * 0.05 }} />
            ))}
          </div>
        </div>
        <div className="flex w-28 flex-col items-center justify-center rounded-2xl p-3" style={{ background: T.bg }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 text-xs font-bold" style={{ borderColor: T.accent, color: T.ink }}>98%</div>
          <p className="mt-1 text-[9px]" style={{ color: T.muted }}>Conformidade</p>
        </div>
      </div>
    </div>
  );
}

/* elemento orbital flutuante */
function Orbit({
  children,
  className,
  delay = 0,
  reduced,
}: {
  children: React.ReactNode;
  className: string;
  delay?: number;
  reduced: boolean;
}) {
  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.35 + delay, duration: 0.5, ease: easeOut }}
      className={`pointer-events-none absolute hidden xl:block ${className}`}
    >
      <motion.div
        animate={reduced ? undefined : { y: [0, -8, 0] }}
        transition={reduced ? undefined : { duration: 4.5 + delay * 2, repeat: Infinity, ease: "easeInOut" }}
        className="bg-white px-3.5 py-2.5"
        style={{ borderRadius: "16px", boxShadow: T.shadowFloat }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ───────── carrossel de canais ───────── */
function CanaisCarousel() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((dir: number) => {
    setIndex((i) => (i + dir + canais.length) % canais.length);
  }, []);

  useEffect(() => {
    if (reduced || paused) return;
    const t = setInterval(() => go(1), 4500);
    return () => clearInterval(t);
  }, [reduced, paused, go]);

  const ativo = canais[index];
  const AtivoIcon = ativo.icon;

  return (
    <div
      className="mt-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
      role="group"
      aria-roledescription="carrossel"
      aria-label="Canais e conexões do Ava Safeguard"
    >
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5">
        {canais.map((c, i) => {
          const Icon = c.icon;
          const isActive = i === index;
          return (
            <button
              key={c.name}
              onClick={() => setIndex(i)}
              aria-label={`Ver detalhes de ${c.name}`}
              aria-current={isActive}
              className="flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:h-[68px] md:w-[68px]"
              style={{
                background: isActive ? T.primary : T.surface,
                color: isActive ? T.accent : T.muted,
                transform: isActive ? "scale(1.12)" : "scale(1)",
                boxShadow: isActive ? T.shadowFloat : T.shadowSoft,
                outlineColor: T.primary,
              }}
            >
              <Icon className="h-6 w-6" />
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-8 flex max-w-2xl items-center gap-3">
        <button
          onClick={() => go(-1)}
          aria-label="Canal anterior"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white transition-transform hover:-translate-y-0.5"
          style={{ boxShadow: T.shadowSoft, color: T.primary }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex-1 bg-white p-6 text-center" style={{ borderRadius: T.radiusCard, boxShadow: T.shadowSoft }} aria-live="polite">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: T.primarySoft, color: T.primary }}>
            <AtivoIcon className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-lg font-bold" style={{ color: T.ink }}>{ativo.name}</h3>
          <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: T.accent }}>{ativo.categoria}</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: T.muted }}>{ativo.desc}</p>
        </div>

        <button
          onClick={() => go(1)}
          aria-label="Próximo canal"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white transition-transform hover:-translate-y-0.5"
          style={{ boxShadow: T.shadowSoft, color: T.primary }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {canais.map((c, i) => (
          <button
            key={c.name}
            onClick={() => setIndex(i)}
            aria-label={`Ir para ${c.name}`}
            className="flex h-11 w-6 items-center justify-center"
          >
            <span
              className="block h-1.5 rounded-full transition-all"
              style={{ width: i === index ? 22 : 8, background: i === index ? T.primary : "#CBD5E1" }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────── slider de depoimentos (renderiza só com dados reais) ───────── */
function DepoimentosSlider() {
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  if (depoimentos.length === 0) return null;

  const go = (dir: number) => setIndex((i) => (i + dir + depoimentos.length) % depoimentos.length);
  const d = depoimentos[index];

  return (
    <Section tone="bg">
      <SectionHeading eyebrow="Clientes" title="Quem usa o Ava Safeguard" />
      <div
        className="relative mx-auto mt-12 max-w-2xl"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
        tabIndex={0}
        role="group"
        aria-roledescription="carrossel"
        aria-label="Depoimentos de clientes"
      >
        <div
          aria-hidden="true"
          className="absolute -inset-6 -z-10 rounded-[48px]"
          style={{ background: `linear-gradient(140deg, ${T.primarySoft}, rgba(77,216,255,0.18))` }}
        />
        <div className="bg-white p-8 text-center" style={{ borderRadius: T.radiusPanel, boxShadow: T.shadowSoft }}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full" style={{ background: T.primarySoft }}>
            {d.avatarUrl ? (
              <img src={d.avatarUrl} alt={`Foto de ${d.nome}`} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <span className="text-sm font-bold" style={{ color: T.primary }}>{d.nome.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="mt-3 flex justify-center gap-1" aria-label={`Nota ${d.nota} de 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4" style={{ color: i < d.nota ? T.warning : "#E2E8F0", fill: i < d.nota ? T.warning : "#E2E8F0" }} />
            ))}
          </div>
          <p className="mt-4 text-base leading-relaxed" style={{ color: T.ink }}>&ldquo;{d.texto}&rdquo;</p>
          <p className="mt-4 text-sm font-semibold" style={{ color: T.ink }}>{d.nome}</p>
          <p className="text-sm" style={{ color: T.muted }}>{d.cargo}{d.empresa ? ` · ${d.empresa}` : ""}</p>
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={() => go(-1)} aria-label="Depoimento anterior" className="flex h-11 w-11 items-center justify-center rounded-full bg-white" style={{ boxShadow: T.shadowSoft, color: T.primary }}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-semibold" style={{ color: T.muted }}>{index + 1} / {depoimentos.length}</span>
          <button onClick={() => go(1)} aria-label="Próximo depoimento" className="flex h-11 w-11 items-center justify-center rounded-full bg-white" style={{ boxShadow: T.shadowSoft, color: T.primary }}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Section>
  );
}

/* ───────── página ───────── */
export default function LandingPage() {
  const reduced = !!useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const openModal = () => setModalOpen(true);

  const navLinks = [
    { href: "#funcionalidades", label: "Funcionalidades" },
    { href: "#automacoes", label: "Automações" },
    { href: "#canais", label: "Canais" },
    { href: "#precos", label: "Preços" },
  ];

  return (
    <div className="min-h-screen antialiased" style={{ background: T.bg, fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
      <LeadModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ─── Navbar ─── */}
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
        <nav className="mx-auto w-full" style={{ maxWidth: T.contentMax }} aria-label="Navegação principal">
          <div
            className="flex items-center justify-between gap-4 px-4 py-2.5 md:px-6"
            style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(14px)", borderRadius: T.radiusPanel, boxShadow: T.shadowSoft }}
          >
            <Link to="/" className="flex items-center gap-2.5 text-lg font-bold" style={{ color: T.ink }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: T.primary }}>
                <ShieldCheck className="h-5 w-5" style={{ color: T.accent }} />
              </span>
              Ava Safeguard
            </Link>

            <div className="hidden items-center gap-7 text-sm font-medium lg:flex" style={{ color: T.muted }}>
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="transition-colors hover:text-slate-900">{l.label}</a>
              ))}
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/sobre-o-portal"
                className="flex min-h-[44px] items-center rounded-full px-4 text-sm font-medium transition-colors hover:bg-slate-100"
                style={{ color: T.muted }}
              >
                Portal do Colaborador
              </Link>
              <button
                onClick={openModal}
                className="flex min-h-[44px] items-center rounded-full px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                style={{ background: T.primary }}
              >
                Começar agora
              </button>
            </div>

            <button
              className="flex h-11 w-11 items-center justify-center rounded-full md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              style={{ color: T.ink }}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 bg-white p-4 md:hidden"
              style={{ borderRadius: T.radiusPanel, boxShadow: T.shadowSoft }}
            >
              <div className="flex flex-col">
                {navLinks.map((l) => (
                  <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="flex min-h-[44px] items-center text-sm font-medium" style={{ color: T.ink }}>
                    {l.label}
                  </a>
                ))}
                <Link to="/sobre-o-portal" onClick={() => setMenuOpen(false)} className="flex min-h-[44px] items-center text-sm font-medium" style={{ color: T.ink }}>
                  Portal do Colaborador
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); openModal(); }}
                  className="mt-2 flex min-h-[48px] items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ background: T.primary }}
                >
                  Começar agora
                </button>
              </div>
            </motion.div>
          )}
        </nav>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-5 pb-16 pt-32 md:pb-24 md:pt-40" style={{ background: T.bg }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
          style={{ background: "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(77,216,255,0.20), transparent 70%)" }}
        />
        <div className="relative mx-auto" style={{ maxWidth: T.contentMax }}>
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center">
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold"
              style={{ color: T.primary, boxShadow: T.shadowSoft }}
            >
              <Lock className="h-3.5 w-3.5" /> Conformidade auditável para SST e RH
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="mx-auto mt-6 max-w-4xl font-extrabold"
              style={{ color: T.ink, letterSpacing: "-0.035em", fontSize: "clamp(2.25rem, 6vw, 4rem)", lineHeight: 1.05 }}
            >
              Adeus papel. A gestão definitiva de{" "}
              <span style={{ color: T.primary }}>SST e RH</span> para a construção civil.
            </motion.h1>

            <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: T.muted }}>
              Registre EPIs, holerites e cartões de ponto em um só lugar. O colaborador assina pelo portal e sua empresa fica com uma trilha de auditoria completa.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap justify-center gap-3">
              <button
                onClick={openModal}
                className="flex min-h-[52px] items-center rounded-full px-8 text-sm font-semibold text-white transition-transform hover:-translate-y-1"
                style={{ background: T.primary, boxShadow: T.shadowFloat }}
              >
                Começar agora
              </button>
              <button
                onClick={openModal}
                className="flex min-h-[52px] items-center rounded-full bg-white px-8 text-sm font-semibold transition-transform hover:-translate-y-1"
                style={{ color: T.ink, boxShadow: T.shadowSoft }}
              >
                Agendar demo
              </button>
            </motion.div>
          </motion.div>

          {/* composição central */}
          <div className="relative mx-auto mt-14 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: easeOut }}>
              <DashboardMockup />
            </motion.div>

            <Orbit className="-left-[210px] top-4 w-[200px]" delay={0} reduced={reduced}>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${T.success}1a`, color: T.success }}>
                  <PenLine className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold" style={{ color: T.ink }}>Ficha de EPI assinada</p>
                  <p className="text-[10px]" style={{ color: T.muted }}>Capacete MSA · CA 12345</p>
                </div>
              </div>
            </Orbit>

            <Orbit className="-right-[210px] -top-2 w-[200px]" delay={0.12} reduced={reduced}>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: T.primarySoft, color: T.primary }}>
                  <Clock className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold" style={{ color: T.ink }}>Cartão de ponto</p>
                  <p className="text-[10px]" style={{ color: T.muted }}>Fechamento mensal pronto</p>
                </div>
              </div>
            </Orbit>

            <Orbit className="-left-[200px] bottom-8 w-[190px]" delay={0.24} reduced={reduced}>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${T.success}1a`, color: T.success }}>
                  <MessageSquare className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold" style={{ color: T.ink }}>Lembrete enviado</p>
                  <p className="text-[10px]" style={{ color: T.muted }}>WhatsApp · ação do gestor</p>
                </div>
              </div>
            </Orbit>

            <Orbit className="-right-[205px] bottom-10 w-[195px]" delay={0.36} reduced={reduced}>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: T.primarySoft, color: T.primary }}>
                  <FolderLock className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold" style={{ color: T.ink }}>Cofre digital</p>
                  <p className="text-[10px]" style={{ color: T.muted }}>IP e timestamp registrados</p>
                </div>
              </div>
            </Orbit>

            <Orbit className="-right-[190px] top-1/2 -translate-y-1/2" delay={0.48} reduced={reduced}>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${T.warning}1a`, color: T.warning }}>
                  <UserCheck className="h-3.5 w-3.5" />
                </span>
                <p className="text-[11px] font-bold" style={{ color: T.ink }}>Admissão em análise</p>
              </div>
            </Orbit>

          </div>
        </div>
      </section>

      {/* ─── Fluxo principal ─── */}
      <Section id="automacoes" tone="surface">
        <SectionHeading
          eyebrow="Fluxo principal"
          title="Do canteiro à assinatura, sem papel no caminho"
          subtitle="O sistema registra o evento, publica no portal do colaborador e acompanha a assinatura. O lembrete por WhatsApp é uma ação manual do gestor, quando fizer sentido."
        />

        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={stagger} className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div variants={fadeUp} className="space-y-6">
            {automacoes.map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ background: `${T.success}1a` }}>
                  <Check className="h-3.5 w-3.5" style={{ color: T.success }} />
                </span>
                <div>
                  <h3 className="text-base font-bold" style={{ color: T.ink }}>{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: T.muted }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="relative mx-auto w-full max-w-sm">
            <div className="space-y-3 p-6" style={{ background: T.bg, borderRadius: T.radiusPanel }}>
              {[
                { titulo: "Holerite disponível", desc: "Abril/2026 publicado no portal de João Silva", estado: "Aguardando assinatura", cor: T.warning, hora: "09:32" },
                { titulo: "EPI entregue", desc: "Capacete MSA · CA 12345", estado: "Assinado", cor: T.success, hora: "14:15" },
                { titulo: "Documentos de admissão", desc: "Link público enviado ao candidato", estado: "Em análise", cor: T.primary, hora: "10:48" },
              ].map((m) => (
                <div key={m.titulo} className="bg-white p-4" style={{ borderRadius: T.radiusCard, boxShadow: T.shadowSoft }}>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold" style={{ color: T.ink }}>{m.titulo}</p>
                    <span className="ml-auto text-[10px]" style={{ color: T.muted }}>{m.hora}</span>
                  </div>
                  <p className="mt-1 text-[11px]" style={{ color: T.muted }}>{m.desc}</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: `${m.cor}14`, color: m.cor }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.cor }} />
                    {m.estado}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </Section>

      {/* ─── Bento grid de capacidades ─── */}
      <Section id="funcionalidades" tone="bg">
        <SectionHeading
          eyebrow="Capacidades"
          title="Uma plataforma, diferentes visões"
          subtitle="Cada perfil enxerga exatamente o que precisa — nem mais, nem menos."
        />

        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={stagger} className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {personas.map((p) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                variants={fadeUp}
                className="bg-white p-7 transition-transform hover:-translate-y-1.5"
                style={{ borderRadius: T.radiusCard, boxShadow: T.shadowSoft }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: T.primarySoft, color: T.primary }}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold" style={{ color: T.ink }}>{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: T.muted }}>{p.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={stagger} className="mt-5 grid gap-5 lg:grid-cols-5">
          {/* Cofre digital */}
          <motion.div
            variants={fadeUp}
            className="bg-white p-8 lg:col-span-3"
            style={{ borderRadius: T.radiusPanel, boxShadow: T.shadowSoft }}
          >
            <h3 className="text-xl font-bold" style={{ color: T.ink }}>Cofre digital com assinatura auditável</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed" style={{ color: T.muted }}>
              Cada assinatura registra IP, data, hora e dispositivo. Documentos ficam isolados por empresa e acessíveis por link temporário.
            </p>
            <div className="mt-6 space-y-2.5">
              {[
                { nome: "Ficha de EPI — Capacete MSA", estado: "Assinado", cor: T.success },
                { nome: "Holerite Abril/2026", estado: "Aguardando", cor: T.warning },
                { nome: "Cartão de ponto — Março/2026", estado: "Assinado", cor: T.success },
              ].map((doc) => (
                <div key={doc.nome} className="flex items-center gap-3 p-3" style={{ background: T.bg, borderRadius: "14px" }}>
                  <FileText className="h-4 w-4 flex-shrink-0" style={{ color: T.primary }} />
                  <span className="truncate text-xs font-medium" style={{ color: T.ink }}>{doc.nome}</span>
                  <span className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: `${doc.cor}14`, color: doc.cor }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: doc.cor }} />
                    {doc.estado}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Admissão em 3 passos */}
          <motion.div
            variants={fadeUp}
            className="bg-white p-8 lg:col-span-2"
            style={{ borderRadius: T.radiusPanel, boxShadow: T.shadowSoft }}
          >
            <h3 className="text-xl font-bold" style={{ color: T.ink }}>Admissão digital em 3 passos</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: T.muted }}>Do cadastro à conversão, sem papel.</p>
            <div className="mt-6 space-y-4">
              {passos.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.num} className="flex gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: T.primarySoft, color: T.primary }}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: T.ink }}>
                        <span style={{ color: T.accent }}>{s.num}</span> · {s.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed" style={{ color: T.muted }}>{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </Section>

      {/* ─── Canais e conexões ─── */}
      <Section id="canais" tone="surface">
        <SectionHeading
          eyebrow="Canais e conexões"
          title="Conectado onde a sua equipe já está"
          subtitle="Os canais que o Ava Safeguard usa hoje para levar documentos e assinaturas até o colaborador."
        />
        <CanaisCarousel />
      </Section>

      {/* ─── Depoimentos (aparece quando houver dados reais) ─── */}
      <DepoimentosSlider />

      {/* ─── Preços ─── */}
      <Section id="precos" tone="bg">
        <SectionHeading
          eyebrow="Planos"
          title="Planos flexíveis para cada equipe"
          subtitle="Comece pequeno e escale conforme sua operação cresce."
        />

        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={stagger} className="mt-14 grid gap-5 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              className="relative p-8 transition-transform hover:-translate-y-1.5"
              style={{
                borderRadius: T.radiusPanel,
                background: plan.highlighted ? T.primary : T.surface,
                boxShadow: plan.highlighted ? T.shadowFloat : T.shadowSoft,
              }}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold" style={{ background: T.accent, color: T.primary }}>
                  Mais popular
                </span>
              )}
              <h3 className="text-lg font-bold" style={{ color: plan.highlighted ? "#FFFFFF" : T.ink }}>{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold" style={{ color: plan.highlighted ? "#FFFFFF" : T.ink }}>{plan.price}</span>
                {plan.period && <span className="text-sm" style={{ color: plan.highlighted ? "rgba(255,255,255,0.65)" : T.muted }}>{plan.period}</span>}
              </div>
              <p className="mt-2 text-sm" style={{ color: plan.highlighted ? "rgba(255,255,255,0.7)" : T.muted }}>{plan.desc}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <Check className="h-4 w-4 flex-shrink-0" style={{ color: plan.highlighted ? T.accent : T.primary }} />
                    <span className="text-sm" style={{ color: plan.highlighted ? "rgba(255,255,255,0.85)" : "#334155" }}>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={openModal}
                className="mt-8 flex min-h-[48px] w-full items-center justify-center rounded-full text-sm font-semibold transition-transform hover:-translate-y-0.5"
                style={plan.highlighted ? { background: T.accent, color: T.primary } : { background: T.bg, color: T.ink }}
              >
                {plan.highlighted ? "Começar agora" : "Escolher plano"}
              </button>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ─── FAQ ─── */}
      <Section tone="surface">
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="Dúvidas" title="Perguntas frequentes" />
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={stagger} className="mt-12 space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={faq.q} variants={fadeUp} className="overflow-hidden" style={{ background: T.bg, borderRadius: T.radiusCard }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="text-base font-semibold" style={{ color: T.ink }}>{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} style={{ color: T.primary }} />
                </button>
                {openFaq === i && (
                  <div className="-mt-1 px-6 pb-6">
                    <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ─── CTA final ─── */}
      <section className="px-5 pb-8" style={{ background: T.bg }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="mx-auto px-8 py-16 text-center md:px-16 md:py-20"
          style={{ maxWidth: T.contentMax, background: T.primary, borderRadius: "36px" }}
        >
          <h2 className="font-extrabold text-white" style={{ letterSpacing: "-0.03em", fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>
            Blinde sua operação hoje mesmo.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm md:text-base" style={{ color: "rgba(255,255,255,0.7)" }}>
            Do canteiro de obras ao RH, a burocracia é com a gente.
          </p>
          <button
            onClick={openModal}
            className="mt-8 inline-flex min-h-[52px] items-center rounded-full px-10 text-sm font-semibold transition-transform hover:-translate-y-1"
            style={{ background: T.accent, color: T.primary }}
          >
            Começar agora
          </button>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-5 pb-6 pt-8" style={{ background: T.bg }}>
        <div className="mx-auto" style={{ maxWidth: T.contentMax }}>
          <div className="relative overflow-hidden bg-white px-8 pt-12 md:px-14" style={{ borderRadius: "36px", boxShadow: T.shadowSoft }}>
            <div className="flex flex-col gap-10 md:flex-row md:justify-between">
              <div className="max-w-xs">
                <Link to="/" className="flex items-center gap-2.5 text-lg font-bold" style={{ color: T.ink }}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: T.primary }}>
                    <ShieldCheck className="h-5 w-5" style={{ color: T.accent }} />
                  </span>
                  Ava Safeguard
                </Link>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: T.muted }}>
                  Gestão de SST, RH e conformidade legal para construtoras e indústrias — com assinatura digital auditável.
                </p>
                <div className="mt-5 flex gap-2">
                  <a href="#" aria-label="LinkedIn do Ava Safeguard" className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: T.bg, color: T.primary }}>
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a href="#" aria-label="Instagram do Ava Safeguard" className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: T.bg, color: T.primary }}>
                    <Instagram className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                {[
                  { title: "Produto", links: [{ label: "Funcionalidades", href: "#funcionalidades" }, { label: "Canais", href: "#canais" }, { label: "Preços", href: "#precos" }] },
                  { title: "Colaborador", links: [{ label: "Portal do Colaborador", href: "/sobre-o-portal" }, { label: "Acessar portal", href: "/portal/login" }, { label: "Entrar na plataforma", href: "/login" }] },
                  { title: "Empresa", links: [{ label: "Agendar demonstração", href: "#precos" }, { label: "Privacidade", href: "#" }, { label: "LGPD", href: "#" }] },
                ].map((col) => (
                  <div key={col.title}>
                    <h3 className="text-sm font-bold" style={{ color: T.ink }}>{col.title}</h3>
                    <ul className="mt-3 space-y-1">
                      {col.links.map((l) => (
                        <li key={l.label}>
                          {l.href.startsWith("/") ? (
                            <Link to={l.href} className="flex min-h-[36px] items-center text-sm transition-colors hover:text-slate-900" style={{ color: T.muted }}>{l.label}</Link>
                          ) : (
                            <a href={l.href} className="flex min-h-[36px] items-center text-sm transition-colors hover:text-slate-900" style={{ color: T.muted }}>{l.label}</a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row" style={{ borderColor: "#EEF2F7" }}>
              <p className="text-xs" style={{ color: T.muted }}>© {new Date().getFullYear()} Ava Safeguard. Todos os direitos reservados.</p>
              <div className="flex gap-4 text-xs" style={{ color: T.muted }}>
                <a href="#" className="hover:text-slate-700">Termos de uso</a>
                <a href="#" className="hover:text-slate-700">Privacidade</a>
              </div>
            </div>

            {/* wordmark gigante */}
            <motion.p
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.94, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, ease: easeOut }}
              className="pointer-events-none -mb-6 mt-6 select-none whitespace-nowrap text-center font-extrabold leading-none md:-mb-10"
              style={{ color: T.accent, opacity: 0.28, fontSize: "clamp(4rem, 15vw, 11rem)", letterSpacing: "-0.05em" }}
            >
              Ava Safeguard
            </motion.p>
          </div>
        </div>
      </footer>
    </div>
  );
}
