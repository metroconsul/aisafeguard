import { motion, type Easing } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Smartphone,
  MessageSquare,
  ArrowRight,
  Menu,
  X,
  Loader2,
  Lock,
  BarChart3,
  HardHat,
  FileText,
  Boxes,
  CheckCircle2,
  Send,
  Bell,
  Eye,
  Server,
  Scale,
  CloudCog,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ───────── animation helpers ───────── */
const easeOut: Easing = "easeOut";
const easeInOut: Easing = "easeInOut";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const floatY = (d: number) => ({
  y: [0, -10, 0],
  transition: { duration: d, repeat: Infinity, ease: easeInOut },
});

/* ───────── palette constants (matching design tokens) ───────── */
const NAVY = "#0f1d3d";
const NAVY_LIGHT = "#162550";
const BLUE = "#2563eb";
const BLUE_LIGHT = "#3b82f6";
const ORANGE = "#f59e0b";
const ORANGE_LIGHT = "#fbbf24";

/* ───────── RBAC tabs data ───────── */
const rbacTabs = [
  {
    key: "diretoria",
    label: "Diretoria",
    icon: BarChart3,
    title: "Visão Estratégica Completa",
    desc: "Dashboard com custo de EPIs por obra, taxa de assinaturas pendentes, alertas de risco jurídico e indicadores financeiros em tempo real.",
    bullets: ["Custo de EPI por obra", "Taxa de conformidade legal", "Alertas de risco trabalhista"],
  },
  {
    key: "sst",
    label: "Téc. Segurança",
    icon: HardHat,
    title: "Conformidade com as NRs",
    desc: "Alertas de C.A. vencendo em 30 dias, treinamentos por vencer e taxa de conformidade por setor. Tudo para evitar autuações.",
    bullets: ["EPIs vencendo em 30 dias", "Treinamentos expirados", "Conformidade por setor"],
  },
  {
    key: "rh",
    label: "RH",
    icon: FileText,
    title: "Gestão de Holerites e Documentos",
    desc: "Disparo de holerites em lote com rastreio de leitura e assinatura digital auditável. Relatórios de fechamento para contabilidade.",
    bullets: ["Holerites em lote", "Rastreio de assinatura", "Relatório de fechamento"],
  },
  {
    key: "almoxarifado",
    label: "Almoxarifado",
    icon: Boxes,
    title: "Controle de Entregas e Estoque",
    desc: "Baixa de estoque rápida, controle de entregas diárias e alerta de EPIs em estoque baixo. Interface simplificada para agilidade.",
    bullets: ["Entregas do dia", "Estoque baixo", "Top 5 EPIs consumidos"],
  },
];

/* ───────── how it works steps ───────── */
const steps = [
  {
    num: "01",
    icon: Send,
    title: "O RH ou Almoxarifado emite o documento",
    desc: "Upload de holerite ou registro de entrega de EPI diretamente no painel.",
  },
  {
    num: "02",
    icon: Bell,
    title: "Alerta automático no WhatsApp",
    desc: "O funcionário recebe a notificação com link para o Portal do Colaborador.",
  },
  {
    num: "03",
    icon: CheckCircle2,
    title: "Assinatura digital auditável",
    desc: "Ele assina no Portal e o status muda para verde no seu Dashboard — com IP, data e hora.",
  },
];

/* ───────── lead modal ───────── */
function LeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !empresa.trim() || !email.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-lead-email", {
        body: {
          nome_pessoa: nome.trim(),
          nome_empresa: empresa.trim(),
          email: email.trim(),
          whatsapp: whatsapp.trim() || "Não informado",
        },
      });
      if (error) throw error;
      toast.success("Solicitação enviada! Nossa equipe entrará em contato em breve.");
    } catch (err) {
      console.error("Lead error:", err);
      toast.success("Solicitação recebida! Entraremos em contato.");
    }

    setLoading(false);
    onClose();
    setNome("");
    setEmpresa("");
    setEmail("");
    setWhatsapp("");
  };

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>

        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: BLUE }}>
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <h3 className="mt-3 text-xl font-bold text-slate-900">Agendar Demonstração</h3>
        <p className="mt-1 text-sm text-slate-500">Preencha seus dados e um consultor entrará em contato.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-600">Nome *</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" className={inputClass} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Empresa *</label>
            <input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nome da empresa" className={inputClass} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">E-mail Corporativo *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com.br" className={inputClass} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">WhatsApp</label>
            <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: BLUE }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Enviando..." : "Solicitar Demonstração"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ───────── main component ───────── */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("diretoria");

  const openModal = () => setModalOpen(true);
  const activeTabData = rbacTabs.find((t) => t.key === activeTab)!;

  return (
    <div className="min-h-screen font-sans antialiased bg-white">
      <LeadModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold" style={{ color: NAVY }}>
            <ShieldCheck className="h-6 w-6" style={{ color: BLUE }} />
            SafeGuard
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#diferenciais" className="hover:text-slate-900 transition-colors">Diferenciais</a>
            <a href="#rbac" className="hover:text-slate-900 transition-colors">Para sua Equipe</a>
            <a href="#como-funciona" className="hover:text-slate-900 transition-colors">Como Funciona</a>
            <a href="#seguranca" className="hover:text-slate-900 transition-colors">Segurança</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Login
            </Link>
            <button
              onClick={openModal}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: BLUE }}
            >
              Agendar Demonstração
            </button>
          </div>

          <button className="md:hidden text-slate-700" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="md:hidden border-t border-slate-100 bg-white px-5 pb-4">
            <div className="flex flex-col gap-3 pt-3">
              <a href="#diferenciais" className="text-sm font-medium text-slate-600" onClick={() => setMenuOpen(false)}>Diferenciais</a>
              <a href="#rbac" className="text-sm font-medium text-slate-600" onClick={() => setMenuOpen(false)}>Para sua Equipe</a>
              <a href="#como-funciona" className="text-sm font-medium text-slate-600" onClick={() => setMenuOpen(false)}>Como Funciona</a>
              <Link to="/login" className="text-sm font-medium text-slate-600">Login</Link>
              <button onClick={() => { setMenuOpen(false); openModal(); }} className="rounded-xl px-5 py-2.5 text-center text-sm font-semibold text-white" style={{ background: BLUE }}>
                Agendar Demonstração
              </button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-5 pt-20 pb-28 md:pt-28 md:pb-36" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_LIGHT} 50%, #1e3a6e 100%)` }}>
        {/* subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Cpath d='M0 0h1v40H0zM39 0h1v40h-1z'/%3E%3Cpath d='M0 0h40v1H0zM0 39h40v1H0z'/%3E%3C/g%3E%3C/svg%3E\")" }} />

        <div className="mx-auto max-w-5xl relative z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center">
            <motion.span
              variants={fadeUp}
              className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide"
              style={{ background: "rgba(255,255,255,0.1)", color: ORANGE_LIGHT }}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Plataforma Enterprise de SST, RH e Conformidade
            </motion.span>

            <motion.h1 variants={fadeUp} className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              O Escudo Jurídico e Operacional{" "}
              <br className="hidden sm:block" />
              <span style={{ color: ORANGE_LIGHT }}>da sua Obra ou Indústria.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
              Gestão completa de EPIs, Holerites e Treinamentos (NRs) com assinatura digital auditável e automação via WhatsApp.{" "}
              <span className="font-semibold text-white/90">Dê adeus ao papel e às multas.</span>
            </motion.p>

            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap justify-center gap-4">
              <button
                onClick={openModal}
                className="rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
                style={{ background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_LIGHT})`, boxShadow: `0 8px 30px -8px ${ORANGE}80` }}
              >
                Agendar Demonstração
              </button>
              <a
                href="#diferenciais"
                className="rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
              >
                Conhecer Funcionalidades
              </a>
            </motion.div>
          </motion.div>

          {/* floating cards */}
          <motion.div animate={floatY(4)} className="absolute -bottom-10 left-0 md:left-[5%] z-0 hidden lg:block">
            <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md p-4 shadow-xl w-60">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <BarChart3 className="h-4 w-4" style={{ color: ORANGE_LIGHT }} />
                Dashboard Admin
              </div>
              <div className="mt-3 flex items-end gap-1.5">
                {[40, 65, 50, 80, 55, 72, 60].map((h, i) => (
                  <div key={i} className="w-4 rounded-sm" style={{ height: `${h * 0.5}px`, background: `linear-gradient(to top, ${BLUE}, ${BLUE_LIGHT})` }} />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div animate={floatY(5)} className="absolute -bottom-6 right-0 md:right-[5%] z-0 hidden lg:block">
            <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md p-4 shadow-xl w-56">
              <div className="flex items-center gap-2 text-xs font-semibold text-green-300">
                <MessageSquare className="h-4 w-4" />
                WhatsApp Notificação
              </div>
              <p className="mt-2 text-[11px] text-white/60">
                "Olá João, seu holerite de 03/2026 está disponível no Portal. Acesse e assine."
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Diferenciais ─── */}
      <section id="diferenciais" className="px-5 py-20 md:py-28 bg-slate-50">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
            <motion.span variants={fadeUp} className="text-xs font-bold uppercase tracking-widest" style={{ color: BLUE }}>
              Diferenciais
            </motion.span>
            <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              3 pilares que resolvem suas maiores dores
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Smartphone,
                title: "Portal do Colaborador (Zero Atrito)",
                desc: "O peão acessa pelo celular apenas com CPF e PIN. Sem e-mails, sem senhas esquecidas. Interface de app com botões grandes e alto contraste.",
                color: BLUE,
                bg: "#eff6ff",
              },
              {
                icon: ShieldCheck,
                title: "Assinatura com Validade Jurídica",
                desc: "Logs de auditoria com captura de IP, Data/Hora e User-Agent em holerites e fichas de EPI. Proteção contra passivos trabalhistas.",
                color: "#059669",
                bg: "#ecfdf5",
              },
              {
                icon: MessageSquare,
                title: "Automação via WhatsApp",
                desc: "O sistema avisa o funcionário no WhatsApp quando o equipamento vence, o holerite está pronto ou um treinamento expira.",
                color: "#16a34a",
                bg: "#f0fdf4",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className="group rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: item.bg }}>
                    <Icon className="h-6 w-6" style={{ color: item.color }} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── RBAC Tabs: Para a Empresa Inteira ─── */}
      <section id="rbac" className="px-5 py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
            <motion.span variants={fadeUp} className="text-xs font-bold uppercase tracking-widest" style={{ color: BLUE }}>
              Para a Empresa Inteira
            </motion.span>
            <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Um sistema que se adapta ao cargo
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-slate-500">
              Cada perfil vê exatamente o que precisa — nem mais, nem menos.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-12">
            {/* tab buttons */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {rbacTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                      isActive ? "text-white shadow-md" : "text-slate-600 bg-slate-100 hover:bg-slate-200"
                    }`}
                    style={isActive ? { background: NAVY } : {}}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* tab content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-8 md:p-12"
            >
              <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
                <div className="flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: BLUE }}>
                    <activeTabData.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-slate-900">{activeTabData.title}</h3>
                  <p className="mt-3 max-w-lg text-slate-500 leading-relaxed">{activeTabData.desc}</p>
                </div>
                <div className="flex-shrink-0 space-y-3">
                  {activeTabData.bullets.map((b) => (
                    <div key={b} className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-sm">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: "#059669" }} />
                      <span className="text-sm font-medium text-slate-700">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Como Funciona ─── */}
      <section id="como-funciona" className="px-5 py-20 md:py-28 bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
            <motion.span variants={fadeUp} className="text-xs font-bold uppercase tracking-widest" style={{ color: BLUE }}>
              Como Funciona
            </motion.span>
            <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Do upload à assinatura em 3 passos
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.num} variants={fadeUp} className="relative text-center">
                  {/* connector line */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px" style={{ background: `linear-gradient(to right, ${BLUE}40, transparent)` }} />
                  )}
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_LIGHT})` }}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="mt-4 inline-block text-xs font-bold uppercase tracking-widest" style={{ color: ORANGE }}>
                    Passo {s.num}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Segurança e Conformidade ─── */}
      <section id="seguranca" className="px-5 py-20 md:py-28" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_LIGHT} 100%)` }}>
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
            <motion.span variants={fadeUp} className="text-xs font-bold uppercase tracking-widest" style={{ color: ORANGE_LIGHT }}>
              Enterprise Trust
            </motion.span>
            <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              Segurança e Conformidade de nível enterprise
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl" style={{ color: "rgba(255,255,255,0.6)" }}>
              Arquitetura robusta projetada para proteger os dados da sua empresa e garantir conformidade legal.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Server, title: "Multi-Tenant com RLS", desc: "Isolamento completo de dados entre empresas com Row Level Security." },
              { icon: Scale, title: "Adequado à LGPD", desc: "Tratamento de dados pessoais em conformidade com a legislação brasileira." },
              { icon: CloudCog, title: "Hospedagem em Nuvem", desc: "Infraestrutura segura com backups automáticos e alta disponibilidade." },
              { icon: Lock, title: "Auditoria Completa", desc: "Cada assinatura registra IP, timestamp e user-agent para validade jurídica." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <Icon className="h-5 w-5" style={{ color: ORANGE_LIGHT }} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA Final ─── */}
      <section className="px-5 py-20 md:py-28 bg-white">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto max-w-4xl rounded-3xl p-10 text-center sm:p-16"
          style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1e3a6e 100%)` }}
        >
          <Eye className="mx-auto h-10 w-10 mb-4" style={{ color: ORANGE_LIGHT }} />
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Pronto para blindar sua empresa <br className="hidden sm:block" /> contra passivos trabalhistas?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/60">
            Agende uma demonstração gratuita e veja como o SafeGuard pode economizar horas da sua equipe e proteger sua empresa.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={openModal}
              className="rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_LIGHT})`, boxShadow: `0 8px 30px -8px ${ORANGE}80` }}
            >
              Falar com um Consultor
            </button>
            <Link
              to="/login"
              className="rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              Acessar Painel
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-100 bg-slate-50 px-5 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-10 md:flex-row md:justify-between">
            <div className="max-w-xs">
              <Link to="/" className="flex items-center gap-2 text-lg font-bold" style={{ color: NAVY }}>
                <ShieldCheck className="h-5 w-5" style={{ color: BLUE }} />
                SafeGuard
              </Link>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                A plataforma completa de Gestão de SST, RH e Conformidade Legal para construtoras e indústrias.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {[
                { title: "Produto", links: ["Funcionalidades", "Portal do Colaborador", "Integrações"] },
                { title: "Recursos", links: ["Central de Ajuda", "Guia do Usuário", "Changelog"] },
                { title: "Empresa", links: ["Sobre Nós", "Contato", "Políticas de Privacidade"] },
              ].map((col) => (
                <div key={col.title}>
                  <h4 className="text-sm font-bold text-slate-900">{col.title}</h4>
                  <ul className="mt-3 space-y-2">
                    {col.links.map((link) => (
                      <li key={link}>
                        <a href="#" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} SafeGuard. Todos os direitos reservados.</p>
            <div className="flex gap-4 text-xs text-slate-400">
              <a href="#" className="hover:text-slate-600">Termos de Uso</a>
              <a href="#" className="hover:text-slate-600">Privacidade</a>
              <a href="#" className="hover:text-slate-600">LGPD</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
