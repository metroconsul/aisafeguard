import { motion, type Easing } from "framer-motion";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FileText,
  Clock,
  Smartphone,
  ShieldCheck,
  Check,
  ArrowRight,
  BarChart3,
  Bell,
  PenTool,
  Mail,
  Cloud,
  Database,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

/* ───────── animation helpers ───────── */
const easeOut: Easing = "easeOut";
const easeInOut: Easing = "easeInOut";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const floatY = (d: number) => ({
  y: [0, -10, 0],
  transition: { duration: d, repeat: Infinity, ease: easeInOut },
});

/* ───────── data ───────── */
const features = [
  { icon: LayoutDashboard, title: "Dashboard Inteligente", desc: "Visualize indicadores em tempo real com gráficos claros e objetivos.", highlight: false },
  { icon: Package, title: "Gestão de Estoque", desc: "Controle entradas, saídas e quantidades mínimas dos seus EPIs.", highlight: false },
  { icon: FileText, title: "Nova Entrega & Ficha de EPI", desc: "Gere fichas automaticamente com assinatura digital integrada.", highlight: true },
  { icon: Clock, title: "Controle de Validades", desc: "Receba alertas automáticos antes do vencimento de cada equipamento.", highlight: false },
  { icon: Smartphone, title: "Integração WhatsApp", desc: "Envie comprovantes e notificações direto no WhatsApp do colaborador.", highlight: false },
  { icon: ShieldCheck, title: "Conformidade Legal", desc: "Mantenha sua empresa em dia com as normas regulamentadoras.", highlight: false },
];

const plans = [
  {
    name: "Básico",
    price: "149",
    desc: "Até 50 funcionários",
    items: ["Gestão de Estoque", "Fichas em PDF", "Alertas de Validade"],
    cta: "Começar Teste",
    popular: false,
  },
  {
    name: "Pro",
    price: "299",
    desc: "Até 150 funcionários",
    items: ["Tudo do Básico", "Assinatura Digital", "WhatsApp Automático", "Logo Personalizada"],
    cta: "Começar Agora",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    desc: "Acima de 150 funcionários",
    items: ["Funcionários Ilimitados", "Múltiplos Usuários", "Suporte Prioritário"],
    cta: "Falar com Vendas",
    popular: false,
  },
];

const footerCols = [
  { title: "Produto", links: ["Funcionalidades", "Planos", "Integrações", "Changelog"] },
  { title: "Recursos", links: ["Blog", "Central de Ajuda", "Guia do Usuário", "API Docs"] },
  { title: "Empresa", links: ["Sobre Nós", "Carreiras", "Contato", "Políticas"] },
];

/* ───────── component ───────── */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: "#F5F7FA" }}>
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#F5F7FA]/80 border-b border-gray-200/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <ShieldCheck className="h-6 w-6" />
            SafeGuard
          </Link>

          {/* desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Planos</a>
            <a href="#about" className="hover:text-gray-900 transition-colors">Sobre</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Login
            </Link>
            <Link
              to="/cadastro"
              className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
            >
              Começar Grátis
            </Link>
          </div>

          {/* mobile toggle */}
          <button className="md:hidden text-gray-700" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* mobile menu */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="md:hidden border-t border-gray-200/50 bg-[#F5F7FA] px-5 pb-4"
          >
            <div className="flex flex-col gap-3 pt-3">
              <a href="#features" className="text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>Funcionalidades</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>Planos</a>
              <a href="#about" className="text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>Sobre</a>
              <Link to="/login" className="text-sm font-medium text-gray-600">Login</Link>
              <Link to="/cadastro" className="rounded-full bg-gray-900 px-5 py-2.5 text-center text-sm font-semibold text-white">
                Começar Grátis
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-5 pt-20 pb-28 md:pt-32 md:pb-36">
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.span
              variants={fadeUp}
              className="mb-4 inline-block rounded-full bg-gray-900/5 px-4 py-1.5 text-xs font-semibold text-gray-700 tracking-wide"
            >
              ✨ +200 empresas já confiam no SafeGuard
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
            >
              Gerencie seus EPIs e{" "}
              <span className="bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">
                Segurança do Trabalho
              </span>{" "}
              em um só lugar
            </motion.h1>

            <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 leading-relaxed">
              Diga adeus às planilhas e fichas de papel. Automatize entregas, controle validades e evite passivos trabalhistas.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/cadastro"
                className="rounded-full bg-gray-900 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 hover:bg-gray-800 transition-all"
              >
                Teste Grátis
              </Link>
              <a
                href="#features"
                className="rounded-full border border-gray-300 bg-white px-7 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Saiba Mais
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* floating cards */}
        <motion.div
          animate={floatY(4)}
          className="absolute top-24 left-4 md:left-[8%] z-0 hidden sm:block"
        >
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-md w-56">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <Package className="h-4 w-4 text-blue-500" /> Estoque Atualizado
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-gray-500">
              <p>Luva Nitrílica · CA: 12345</p>
              <p>Validade: 180 dias · Estoque: 50 un</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={floatY(5)}
          className="absolute top-16 right-4 md:right-[8%] z-0 hidden sm:block"
        >
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-md w-48">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <BarChart3 className="h-4 w-4 text-blue-500" /> Entregas do Mês
            </div>
            <div className="mt-3 flex items-end gap-1.5">
              {[40, 65, 50, 80, 55, 72].map((h, i) => (
                <div
                  key={i}
                  className="w-4 rounded-sm bg-gradient-to-t from-blue-400 to-blue-200"
                  style={{ height: `${h * 0.5}px` }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={floatY(3.5)}
          className="absolute bottom-20 right-8 md:right-[15%] z-0 hidden sm:block"
        >
          <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-md w-52">
            <div className="flex items-center gap-2 text-xs font-semibold text-green-600">
              <PenTool className="h-4 w-4" /> Assinatura Digital Coletada
            </div>
            <p className="mt-1 text-[11px] text-gray-400">João Silva · há 2 minutos</p>
          </div>
        </motion.div>

      </section>

      {/* ─── Social Proof ─── */}
      <section className="px-5 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Confiado por empresas inovadoras
          </p>
          <p className="mt-4 text-sm text-gray-400">
            Em breve, as empresas que confiam no SafeGuard aparecerão aqui.
          </p>
        </motion.div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="features" className="px-5 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
            <motion.span variants={fadeUp} className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Funcionalidades
            </motion.span>
            <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Tudo o que sua equipe precisa em um só lugar
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-gray-500">
              Uma plataforma completa para gestão de EPIs, conformidade e segurança do trabalho.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  className={`group rounded-3xl border p-7 transition-shadow hover:shadow-lg ${
                    f.highlight
                      ? "border-blue-200/60 bg-gradient-to-br from-blue-50 to-sky-50"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      f.highlight ? "bg-white shadow-sm" : "bg-gray-100"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${f.highlight ? "text-blue-500" : "text-gray-600"}`} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Feature Highlight A ─── */}
      <section className="px-5 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="flex flex-col items-center gap-12 lg:flex-row"
          >
            <motion.div variants={fadeUp} className="flex-1 space-y-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Rastreabilidade
              </span>
              <h2 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
                Rastreabilidade que acompanha o seu ritmo
              </h2>
              <p className="max-w-md text-gray-500 leading-relaxed">
                Assine digitalmente e proteja sua empresa contra processos trabalhistas. Cada entrega é registrada,
                assinada e armazenada com segurança na nuvem.
              </p>
              <Link
                to="/cadastro"
                className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Saiba Mais <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="flex-1">
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
                <div className="space-y-4">
                  {["Selecionar Funcionário", "Escolher EPI", "Assinatura Digital", "Entrega Concluída ✓"].map(
                    (step, i) => (
                      <div
                        key={step}
                        className={`flex items-center gap-3 rounded-xl p-3 text-sm font-medium ${
                          i === 3 ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                            i === 3 ? "bg-green-500" : "bg-gray-400"
                          }`}
                        >
                          {i + 1}
                        </div>
                        {step}
                      </div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Feature Highlight B ─── */}
      <section className="px-5 py-20 md:py-28" style={{ background: "#EFF4FA" }}>
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="flex flex-col-reverse items-center gap-12 lg:flex-row"
          >
            <motion.div variants={fadeUp} className="flex-1">
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
                <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-sky-100 text-lg font-bold text-blue-600">
                    JS
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">João Silva</p>
                    <p className="text-xs text-gray-400">Operador · Setor: Produção</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5 text-sm text-gray-600">
                  <div className="flex justify-between rounded-lg bg-gray-50 p-2.5">
                    <span>Capacete MSA</span>
                    <span className="text-xs font-semibold text-green-600">Válido</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-gray-50 p-2.5">
                    <span>Luva Nitrílica</span>
                    <span className="text-xs font-semibold text-amber-500">Vence em 15 dias</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-gray-50 p-2.5">
                    <span>Óculos de Proteção</span>
                    <span className="text-xs font-semibold text-green-600">Válido</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="flex-1 space-y-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Tempo real
              </span>
              <h2 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
                Acompanhe cada entrega em tempo real
              </h2>
              <p className="max-w-md text-gray-500 leading-relaxed">
                Saiba exatamente quem recebeu o quê, e quando. Visualize o histórico completo de EPIs de cada
                colaborador com apenas alguns cliques.
              </p>
              <Link
                to="/cadastro"
                className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Saiba Mais <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Integrations ─── */}
      <section id="about" className="px-5 py-20 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Conecte o SafeGuard com suas ferramentas diárias
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-gray-500">
              Integração nativa com as principais plataformas do mercado.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mx-auto mt-12 max-w-2xl rounded-3xl border border-gray-100 bg-white p-10 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-center gap-8">
              {[
                { icon: MessageSquare, label: "WhatsApp", color: "text-green-500" },
                { icon: Mail, label: "Email", color: "text-blue-500" },
                { icon: Cloud, label: "Cloud", color: "text-sky-500" },
                { icon: Database, label: "ERP", color: "text-purple-500" },
                { icon: BarChart3, label: "Analytics", color: "text-orange-500" },
              ].map((tool) => (
                <div key={tool.label} className="flex flex-col items-center gap-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 transition-transform hover:scale-110">
                    <tool.icon className={`h-7 w-7 ${tool.color}`} />
                  </div>
                  <span className="text-xs font-medium text-gray-500">{tool.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="px-5 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
            <motion.h2 variants={fadeUp} className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Preços Simples e Transparentes
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-gray-500">
              Escolha o plano ideal para o tamanho da sua operação.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                className={`relative rounded-3xl border p-8 transition-shadow hover:shadow-xl ${
                  plan.popular
                    ? "border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 shadow-lg"
                    : "border-gray-100 bg-white"
                }`}
                    : "border-gray-100 bg-white"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-1 text-[11px] font-bold text-white tracking-wide">
                    Mais Escolhido ✦
                  </span>
                )}

                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  {plan.price === "Sob consulta" ? (
                    <span className="text-2xl font-extrabold text-gray-900">Personalizado</span>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-gray-500">R$</span>
                      <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                      <span className="text-sm font-semibold text-gray-500">/mês</span>
                    </>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">{plan.desc}</p>

                <ul className="mt-7 space-y-3">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <Check className="h-4 w-4 shrink-0 text-green-500" /> {item}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/cadastro"
                  className={`mt-8 block w-full rounded-full py-3 text-center text-sm font-semibold transition-colors ${
                    plan.popular
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA Final ─── */}
      <section className="px-5 py-16 md:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto max-w-5xl rounded-[2rem] bg-gradient-to-br from-blue-100 via-sky-50 to-blue-50 p-10 text-center shadow-sm sm:p-16"
        >
          {/* avatars */}
          <div className="mb-6 flex items-center justify-center -space-x-2">
            {["bg-blue-400", "bg-blue-500", "bg-gray-700", "bg-blue-300"].map((bg, i) => (
              <div
                key={i}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white ${bg}`}
              >
                {["AS", "MR", "PL", "KJ"][i]}
              </div>
            ))}
            <div className="flex h-9 items-center justify-center rounded-full border-2 border-white bg-gray-900 px-3 text-[11px] font-bold text-white">
              +200
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Comece seu teste gratuito hoje
          </h2>
          <p className="mx-auto mt-3 max-w-md text-gray-500">
            Junte-se a centenas de empresas que já simplificaram sua gestão de EPIs.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/cadastro"
              className="rounded-full bg-gray-900 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 hover:bg-gray-800 transition-all"
            >
              Começar Grátis
            </Link>
            <a
              href="#pricing"
              className="rounded-full border border-gray-300 bg-white px-7 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
            >
              Falar com Vendas
            </a>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-200/60 px-5 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-10 md:flex-row md:justify-between">
            <div className="max-w-xs">
              <Link to="/" className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <ShieldCheck className="h-5 w-5" />
                SafeGuard
              </Link>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                A plataforma completa para gestão de EPIs e segurança do trabalho.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {footerCols.map((col) => (
                <div key={col.title}>
                  <h4 className="text-sm font-bold text-gray-900">{col.title}</h4>
                  <ul className="mt-3 space-y-2">
                    {col.links.map((link) => (
                      <li key={link}>
                        <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200/60 pt-8 sm:flex-row">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} SafeGuard. Todos os direitos reservados.</p>
            <div className="flex gap-4 text-xs text-gray-400">
              <a href="#" className="hover:text-gray-600">Termos de Uso</a>
              <a href="#" className="hover:text-gray-600">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
