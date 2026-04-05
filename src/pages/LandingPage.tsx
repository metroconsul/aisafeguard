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
  ChevronDown,
  Link2,
  Upload,
  UserCheck,
  Check,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ───────── animation helpers ───────── */
const easeOut: Easing = "easeOut";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ───────── palette ───────── */
const LIME = "#def320";
const NAVY = "#000c24";
const NAVY_MID = "#0a193a";
const BLUE = "#0047ff";
const LIGHT_BG = "#f4f6fa";

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
        body: { nome_pessoa: nome.trim(), nome_empresa: empresa.trim(), email: email.trim(), whatsapp: whatsapp.trim() || "Não informado" },
      });
      if (error) throw error;
      toast.success("Solicitação enviada! Nossa equipe entrará em contato em breve.");
    } catch {
      toast.success("Solicitação recebida! Entraremos em contato.");
    }
    setLoading(false);
    onClose();
    setNome(""); setEmpresa(""); setEmail(""); setWhatsapp("");
  };

  const inputClass = "mt-1 w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: NAVY }}><ShieldCheck className="h-5 w-5" style={{ color: LIME }} /></div>
        <h3 className="mt-3 text-xl font-bold text-slate-900">Agendar Demonstração</h3>
        <p className="mt-1 text-sm text-slate-500">Preencha seus dados e um consultor entrará em contato.</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div><label className="text-xs font-semibold text-slate-600">Nome *</label><input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" className={inputClass} required /></div>
          <div><label className="text-xs font-semibold text-slate-600">Empresa *</label><input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nome da empresa" className={inputClass} required /></div>
          <div><label className="text-xs font-semibold text-slate-600">E-mail Corporativo *</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com.br" className={inputClass} required /></div>
          <div><label className="text-xs font-semibold text-slate-600">WhatsApp</label><input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" className={inputClass} /></div>
          <button type="submit" disabled={loading} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60" style={{ background: LIME, color: NAVY }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Enviando..." : "Solicitar Demonstração"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ───────── pricing data ───────── */
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
    features: ["Até 300 funcionários", "Tudo do Padrão", "Automação WhatsApp", "Admissão Digital", "Treinamentos & NRs", "Suporte prioritário"],
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

/* ───────── FAQ data ───────── */
const faqs = [
  { q: "Como o sistema beneficia minha construtora?", a: "O SafeGuard elimina processos em papel, automatiza notificações por WhatsApp e gera um cofre digital com assinaturas auditáveis. Isso reduz o risco de multas trabalhistas e economiza horas da sua equipe de RH e SST." },
  { q: "Os dados dos meus funcionários estão seguros?", a: "Sim. Utilizamos isolamento completo de dados por empresa (Row Level Security), hospedagem em nuvem com backups automáticos e estamos em conformidade com a LGPD." },
  { q: "O sistema é adequado para pequenas empresas?", a: "Absolutamente. O plano Padrão foi pensado para obras menores, com interface simplificada e preço acessível. Você escala conforme cresce." },
];

/* ───────── main component ───────── */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const openModal = () => setModalOpen(true);

  return (
    <div className="min-h-screen antialiased" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
      <LeadModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: "rgba(0,12,36,0.85)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-bold text-white">
            <ShieldCheck className="h-6 w-6" style={{ color: LIME }} />
            SafeGuard
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#automacoes" className="hover:text-white transition-colors">Automações</a>
            <a href="#precos" className="hover:text-white transition-colors">Preços</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/portal/login" className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white/80 transition-all hover:bg-white/10 hover:-translate-y-0.5">
              Portal do Colaborador
            </Link>
            <a href="#precos" className="rounded-full px-5 py-2 text-sm font-bold transition-all hover:-translate-y-0.5" style={{ background: LIME, color: NAVY }}>
              Começar Agora
            </a>
          </div>

          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="md:hidden border-t border-white/10 px-5 pb-4" style={{ background: NAVY }}>
            <div className="flex flex-col gap-3 pt-3">
              <a href="#funcionalidades" className="text-sm font-medium text-white/70" onClick={() => setMenuOpen(false)}>Funcionalidades</a>
              <a href="#automacoes" className="text-sm font-medium text-white/70" onClick={() => setMenuOpen(false)}>Automações</a>
              <a href="#precos" className="text-sm font-medium text-white/70" onClick={() => setMenuOpen(false)}>Preços</a>
              <Link to="/portal/login" className="text-sm font-medium text-white/70" onClick={() => setMenuOpen(false)}>Portal do Colaborador</Link>
              <a href="#precos" className="rounded-full px-5 py-2.5 text-center text-sm font-bold" style={{ background: LIME, color: NAVY }} onClick={() => setMenuOpen(false)}>Começar Agora</a>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-5 pt-32 pb-20 md:pt-44 md:pb-32" style={{ background: `linear-gradient(170deg, ${NAVY} 0%, ${NAVY_MID} 100%)` }}>
        {/* radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${BLUE}30, transparent)` }} />

        <div className="mx-auto max-w-5xl relative z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center">
            <motion.h1 variants={fadeUp} className="text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl text-white" style={{ letterSpacing: "-0.02em" }}>
              Adeus Papel. A Gestão Definitiva de{" "}
              <span style={{ background: `linear-gradient(90deg, ${BLUE}, ${LIME})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                SST e RH
              </span>{" "}
              para a Construção Civil.
            </motion.h1>

            <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              Elimine burocracia, automatize o RH via WhatsApp e crie um cofre digital validado que blinda sua empresa contra processos trabalhistas.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-4">
              <button onClick={openModal} className="rounded-full px-8 py-3.5 text-sm font-bold transition-all hover:-translate-y-0.5 shadow-lg" style={{ background: LIME, color: NAVY, boxShadow: `0 8px 30px -8px ${LIME}60` }}>
                Começar Agora
              </button>
              <button onClick={openModal} className="rounded-full border border-white/20 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:-translate-y-0.5">
                Agendar Demo
              </button>
            </motion.div>
          </motion.div>

          {/* Dashboard + Phone mockup */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mt-16 relative">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 md:p-6 shadow-2xl">
              {/* Fake dashboard UI */}
              <div className="rounded-xl bg-white p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: NAVY }}><ShieldCheck className="h-4 w-4" style={{ color: LIME }} /></div>
                  <span className="text-sm font-bold" style={{ color: NAVY }}>SafeGuard Dashboard</span>
                  <div className="ml-auto flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Funcionários", val: "312", color: BLUE },
                    { label: "EPIs Entregues", val: "1.847", color: "#10b981" },
                    { label: "Holerites Assinados", val: "98%", color: LIME },
                    { label: "Treinamentos", val: "45", color: "#f59e0b" },
                  ].map((k) => (
                    <div key={k.label} className="rounded-lg p-3" style={{ background: LIGHT_BG }}>
                      <p className="text-[10px] font-medium text-slate-500 truncate">{k.label}</p>
                      <p className="text-lg font-bold mt-1" style={{ color: NAVY }}>{k.val}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <div className="flex-1 rounded-lg p-3" style={{ background: LIGHT_BG }}>
                    <div className="flex items-end gap-1 h-16">
                      {[40, 60, 45, 80, 65, 75, 55, 70, 85, 50, 68, 90].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i >= 10 ? LIME : BLUE, opacity: i >= 10 ? 1 : 0.6 + i * 0.03 }} />
                      ))}
                    </div>
                  </div>
                  <div className="w-28 rounded-lg p-3 flex flex-col items-center justify-center" style={{ background: LIGHT_BG }}>
                    <div className="h-12 w-12 rounded-full border-4 flex items-center justify-center text-xs font-bold" style={{ borderColor: LIME, color: NAVY }}>98%</div>
                    <p className="text-[9px] mt-1 text-slate-500">Conformidade</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating phone mockup */}
            <div className="absolute -right-4 -bottom-8 md:right-8 md:-bottom-12 w-44 md:w-52">
              <div className="rounded-3xl border-2 border-white/20 p-2 shadow-2xl" style={{ background: NAVY }}>
                <div className="rounded-2xl bg-white p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center"><MessageSquare className="h-3 w-3 text-white" /></div>
                    <span className="text-[9px] font-bold text-slate-700">WhatsApp</span>
                  </div>
                  <div className="rounded-lg bg-green-50 p-2">
                    <p className="text-[8px] text-slate-600 leading-relaxed">Olá João! Seu holerite de Abril/2026 já está disponível para assinatura digital. Acesse o Portal SafeGuard. 📄✅</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Social Proof ─── */}
      <section className="px-5 py-10 border-b" style={{ background: LIGHT_BG, borderColor: "#e5e7eb" }}>
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Projetado para a realidade do canteiro de obras</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-40">
            {["Construtora Alpha", "Engeset", "Obra Segura", "IndústriaBR", "TechBuild"].map((logo) => (
              <span key={logo} className="text-sm font-bold text-slate-500 tracking-wide">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Grid (RBAC) ─── */}
      <section id="funcionalidades" className="px-5 py-20 md:py-28" style={{ background: LIGHT_BG }}>
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
            <motion.h2 variants={fadeUp} className="text-3xl font-extrabold sm:text-4xl" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
              Uma plataforma. Diferentes visões (RBAC).
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-slate-500">
              Cada perfil vê exatamente o que precisa — nem mais, nem menos.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BarChart3, title: "Administrador", desc: "Visão gerencial de custos com EPI, riscos jurídicos e painel financeiro.", color: BLUE },
              { icon: HardHat, title: "Técnico (SST)", desc: "Dashboard de conformidade, NRs vencendo e gestão de treinamentos.", color: "#f59e0b" },
              { icon: FileText, title: "Recursos Humanos", desc: "Gestão de holerites em lote, ASOs e funil de admissão inteligente.", color: "#8b5cf6" },
              { icon: Boxes, title: "Almoxarifado", desc: "Visão operacional para baixa e entrega de EPIs no canteiro.", color: "#10b981" },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.title} variants={fadeUp} className="group rounded-2xl bg-white p-7 transition-all hover:shadow-xl hover:-translate-y-1" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.05)" }}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${card.color}15` }}>
                    <Icon className="h-6 w-6" style={{ color: card.color }} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold" style={{ color: NAVY }}>{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{card.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Mobile-First & Automation Engine ─── */}
      <section id="automacoes" className="px-5 py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="flex flex-col gap-12 lg:flex-row lg:items-center">
            {/* Left text */}
            <motion.div variants={fadeUp} className="flex-1">
              <h2 className="text-3xl font-extrabold sm:text-4xl" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
                Portal Mobile-First de Zero Atrito
              </h2>
              <div className="mt-8 space-y-6">
                {[
                  { title: "Login sem E-mail", desc: "Acesso exclusivo por CPF e PIN de 4 dígitos para o peão da obra." },
                  { title: "Assinatura com Validade Jurídica", desc: "IP, Data e User-Agent em cada holerite e ficha de EPI." },
                  { title: "Motor n8n via WhatsApp", desc: "O sistema avisa o colaborador automaticamente ao entregar um EPI, rodar a folha ou iniciar uma admissão." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold" style={{ color: NAVY }}>{item.title}</h4>
                      <p className="mt-1 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right phone mockup in dark card */}
            <motion.div variants={fadeUp} className="flex-shrink-0 flex justify-center">
              <div className="rounded-3xl p-6 md:p-8 w-72 md:w-80" style={{ background: `linear-gradient(160deg, ${NAVY}, ${NAVY_MID})`, border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="rounded-2xl bg-white overflow-hidden shadow-lg">
                  <div className="p-4" style={{ background: NAVY }}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5" style={{ color: LIME }} />
                      <span className="text-xs font-bold text-white">Portal SafeGuard</span>
                    </div>
                    <p className="mt-2 text-lg font-bold text-white">Olá, João 👷</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { icon: FileText, label: "Meus Holerites", badge: "1 novo" },
                      { icon: ShieldCheck, label: "Meus EPIs", badge: "" },
                      { icon: Lock, label: "Documentos", badge: "" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex items-center gap-3 rounded-xl p-3" style={{ background: LIGHT_BG }}>
                          <Icon className="h-4 w-4" style={{ color: BLUE }} />
                          <span className="text-xs font-semibold" style={{ color: NAVY }}>{item.label}</span>
                          {item.badge && <span className="ml-auto text-[9px] font-bold rounded-full px-2 py-0.5" style={{ background: LIME, color: NAVY }}>{item.badge}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Dark Step Cards (Admissões Inteligentes) ─── */}
      <section className="px-5 py-20 md:py-28" style={{ background: LIGHT_BG }}>
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
            <motion.h2 variants={fadeUp} className="text-3xl font-extrabold sm:text-4xl" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
              Admissões Inteligentes em 3 Passos
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-slate-500">
              Do cadastro à conversão, sem papel e sem dor de cabeça.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { icon: Link2, num: "01", title: "Link Público", desc: "RH cadastra apenas nome e WhatsApp. O sistema cria um link único." },
              { icon: Upload, num: "02", title: "Upload Responsivo", desc: "O candidato tira foto do RG e comprovante pelo próprio celular." },
              { icon: UserCheck, num: "03", title: "Conversão 1-Clique", desc: "Documentos validados caem direto no cofre digital do funcionário." },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.num} variants={fadeUp} className="relative rounded-2xl p-7 transition-all hover:-translate-y-1" style={{ background: `linear-gradient(160deg, ${NAVY}, ${NAVY_MID})`, border: "1px solid rgba(255,255,255,0.1)", boxShadow: `0 20px 60px -15px ${BLUE}25` }}>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: BLUE }}>Passo {step.num}</span>
                  <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <Icon className="h-6 w-6" style={{ color: LIME }} />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{step.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="precos" className="px-5 py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
            <motion.h2 variants={fadeUp} className="text-3xl font-extrabold sm:text-4xl" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
              Planos Flexíveis para Cada Equipe
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-slate-500">
              Comece pequeno e escale conforme sua operação cresce.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mt-14 grid gap-6 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                className="relative rounded-2xl p-7 transition-all hover:-translate-y-1"
                style={plan.highlighted
                  ? { background: `linear-gradient(160deg, ${NAVY}, ${NAVY_MID})`, border: "1px solid rgba(255,255,255,0.1)", boxShadow: `0 20px 60px -15px ${BLUE}40` }
                  : { background: "white", boxShadow: "0 10px 40px rgba(0,0,0,0.05)" }
                }
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold" style={{ background: LIME, color: NAVY }}>
                    Mais Popular
                  </span>
                )}
                <h3 className={`text-lg font-bold ${plan.highlighted ? "text-white" : ""}`} style={!plan.highlighted ? { color: NAVY } : {}}>
                  {plan.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold ${plan.highlighted ? "text-white" : ""}`} style={!plan.highlighted ? { color: NAVY } : {}}>
                    {plan.price}
                  </span>
                  {plan.period && <span className={`text-sm ${plan.highlighted ? "text-white/60" : "text-slate-400"}`}>{plan.period}</span>}
                </div>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-white/60" : "text-slate-500"}`}>{plan.desc}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <Check className="h-4 w-4 flex-shrink-0" style={{ color: plan.highlighted ? LIME : "#10b981" }} />
                      <span className={`text-sm ${plan.highlighted ? "text-white/80" : "text-slate-600"}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={openModal}
                  className="mt-8 w-full rounded-full py-3 text-sm font-bold transition-all hover:-translate-y-0.5"
                  style={plan.highlighted
                    ? { background: LIME, color: NAVY }
                    : { background: LIGHT_BG, color: NAVY }
                  }
                >
                  {plan.highlighted ? "Começar Agora" : "Escolher"}
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="px-5 py-20 md:py-28" style={{ background: LIGHT_BG }}>
        <div className="mx-auto max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
            <motion.h2 variants={fadeUp} className="text-3xl font-extrabold sm:text-4xl" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
              Perguntas Frequentes
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mt-12 space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={fadeUp} className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between p-6 text-left">
                  <span className="text-base font-semibold pr-4" style={{ color: NAVY }}>{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} style={{ color: BLUE }} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 -mt-1">
                    <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Footer CTA ─── */}
      <section className="px-5 py-16 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto max-w-5xl rounded-3xl px-8 py-14 md:px-16 md:py-20 text-center"
          style={{ background: `linear-gradient(160deg, ${NAVY}, ${NAVY_MID})` }}
        >
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl" style={{ letterSpacing: "-0.02em" }}>
            Blinde sua operação hoje mesmo.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm md:text-base" style={{ color: "rgba(255,255,255,0.55)" }}>
            Do canteiro de obras ao RH, a burocracia é com a gente.
          </p>
          <button onClick={openModal} className="mt-8 rounded-full px-10 py-4 text-sm font-bold transition-all hover:-translate-y-0.5 shadow-lg" style={{ background: LIME, color: NAVY, boxShadow: `0 8px 30px -8px ${LIME}60` }}>
            Começar Agora
          </button>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t px-5 py-14" style={{ borderColor: "#e5e7eb", background: LIGHT_BG }}>
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
                { title: "Empresa", links: ["Sobre Nós", "Contato", "Política de Privacidade"] },
              ].map((col) => (
                <div key={col.title}>
                  <h4 className="text-sm font-bold" style={{ color: NAVY }}>{col.title}</h4>
                  <ul className="mt-3 space-y-2">
                    {col.links.map((link) => (
                      <li key={link}><a href="#" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">{link}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row" style={{ borderColor: "#e5e7eb" }}>
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
