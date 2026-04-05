import { motion, type Easing } from "framer-motion";
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
  Check,
} from "lucide-react";

const easeOut: Easing = "easeOut";
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const LIME = "#def320";
const NAVY = "#000c24";
const NAVY_MID = "#0a193a";
const BLUE = "#0047ff";
const LIGHT_BG = "#f4f6fa";

export default function SobrePortal() {
  return (
    <div className="min-h-screen antialiased" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>

      {/* ─── Navbar (simple) ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: "rgba(0,12,36,0.9)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-bold text-white">
            <ShieldCheck className="h-6 w-6" style={{ color: LIME }} />
            SafeGuard
          </Link>
          <Link
            to="/portal/login"
            className="rounded-full px-6 py-2 text-sm font-bold transition-all hover:-translate-y-0.5"
            style={{ background: LIME, color: NAVY }}
          >
            Acessar Meu Portal
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-5 pt-32 pb-20 md:pt-44 md:pb-32" style={{ background: `linear-gradient(170deg, ${NAVY} 0%, ${NAVY_MID} 100%)` }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${BLUE}25, transparent)` }} />

        <div className="mx-auto max-w-6xl relative z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col gap-12 lg:flex-row lg:items-center">
            {/* Left text */}
            <motion.div variants={fadeUp} className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl text-white" style={{ letterSpacing: "-0.02em" }}>
                A sua obra na{" "}
                <span style={{ background: `linear-gradient(90deg, ${BLUE}, ${LIME})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  palma da mão.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                Acesse seus holerites, solicite EPIs e veja seus treinamentos direto do seu celular. Sem precisar de e-mail corporativo ou senhas complicadas.
              </p>

              <Link
                to="/portal/login"
                className="mt-10 inline-flex rounded-full px-10 py-4 text-sm font-bold transition-all hover:-translate-y-0.5 shadow-lg"
                style={{ background: LIME, color: NAVY, boxShadow: `0 8px 30px -8px ${LIME}60` }}
              >
                Acessar Meu Portal
              </Link>
            </motion.div>

            {/* Right phone mockup */}
            <motion.div variants={fadeUp} className="flex-shrink-0 flex justify-center">
              <div className="rounded-[2.5rem] border-[3px] border-white/15 p-3 shadow-2xl w-64 md:w-72" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }}>
                <div className="rounded-[2rem] bg-white overflow-hidden shadow-lg">
                  {/* Phone header */}
                  <div className="p-5" style={{ background: NAVY }}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5" style={{ color: LIME }} />
                      <span className="text-xs font-bold text-white">Portal SafeGuard</span>
                    </div>
                    <p className="mt-3 text-xl font-bold text-white">Olá, João 👷</p>
                    <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Operador — Construtora Alpha</p>
                  </div>
                  {/* Phone content */}
                  <div className="p-4 space-y-3">
                    {[
                      { icon: FileText, label: "Meus Holerites", badge: "1 novo", badgeColor: LIME },
                      { icon: HardHat, label: "Meus EPIs", badge: "3 ativos", badgeColor: "#10b981" },
                      { icon: Award, label: "Treinamentos", badge: "NR-35 ✓", badgeColor: BLUE },
                      { icon: Lock, label: "Documentos", badge: "", badgeColor: "" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex items-center gap-3 rounded-xl p-3" style={{ background: LIGHT_BG }}>
                          <Icon className="h-4 w-4" style={{ color: BLUE }} />
                          <span className="text-xs font-semibold" style={{ color: NAVY }}>{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto text-[9px] font-bold rounded-full px-2 py-0.5" style={{ background: `${item.badgeColor}20`, color: item.badgeColor }}>
                              {item.badge}
                            </span>
                          )}
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

      {/* ─── Benefits Grid ─── */}
      <section className="px-5 py-20 md:py-28" style={{ background: LIGHT_BG }}>
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
            <motion.h2 variants={fadeUp} className="text-3xl font-extrabold sm:text-4xl" style={{ color: NAVY, letterSpacing: "-0.02em" }}>
              Tudo que você precisa no seu bolso
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mt-14 grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: Lock,
                title: "Acesso Zero Atrito",
                desc: "Login simplificado usando apenas seu CPF e o PIN gerado pelo RH. Sem e-mail corporativo, sem senhas complicadas.",
                color: BLUE,
              },
              {
                icon: FileText,
                title: "Seu Cofre Financeiro",
                desc: "Assine e baixe seus holerites mensais na hora, sem filas no RH. Tudo salvo com assinatura digital auditável.",
                color: "#10b981",
              },
              {
                icon: HardHat,
                title: "Gestão de EPIs",
                desc: "Sua bota rasgou? Abra um chamado de troca pelo celular e o almoxarifado já deixa separado pra você.",
                color: "#f59e0b",
              },
              {
                icon: Award,
                title: "Treinamentos na Mão",
                desc: "Mostre seus certificados de NRs válidos direto na portaria da obra. Tudo digital e sempre atualizado.",
                color: "#8b5cf6",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.title} variants={fadeUp} className="group rounded-2xl bg-white p-8 transition-all hover:shadow-xl hover:-translate-y-1" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.05)" }}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: `${card.color}12` }}>
                    <Icon className="h-7 w-7" style={{ color: card.color }} />
                  </div>
                  <h3 className="mt-5 text-xl font-bold" style={{ color: NAVY }}>{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">{card.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── WhatsApp Integration Strip ─── */}
      <section className="px-5 py-16 md:py-20" style={{ background: `linear-gradient(160deg, ${NAVY}, ${NAVY_MID})` }}>
        <div className="mx-auto max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="flex flex-col items-center gap-8 md:flex-row">
            <motion.div variants={fadeUp} className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl" style={{ background: "rgba(255,255,255,0.08)" }}>
              <MessageSquare className="h-8 w-8" style={{ color: "#25d366" }} />
            </motion.div>
            <motion.div variants={fadeUp} className="text-center md:text-left">
              <h3 className="text-xl font-bold text-white md:text-2xl" style={{ letterSpacing: "-0.02em" }}>
                Integração Automática com WhatsApp
              </h3>
              <p className="mt-3 text-sm md:text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                O sistema SafeGuard avisa você no seu WhatsApp quando um novo EPI for entregue ou quando seu pagamento estiver disponível. É só clicar no link e assinar.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-5 py-14" style={{ background: LIGHT_BG }}>
        <div className="mx-auto max-w-4xl flex flex-col items-center gap-8 text-center">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-bold" style={{ color: NAVY }}>
            <ShieldCheck className="h-6 w-6" style={{ color: BLUE }} />
            SafeGuard
          </Link>

          <Link
            to="/portal/login"
            className="rounded-full px-10 py-4 text-sm font-bold transition-all hover:-translate-y-0.5 shadow-lg"
            style={{ background: LIME, color: NAVY, boxShadow: `0 8px 30px -8px ${LIME}60` }}
          >
            Acessar Meu Portal
          </Link>

          <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o site da Empresa (Gestão)
          </Link>

          <p className="text-xs text-slate-400">© {new Date().getFullYear()} SafeGuard. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
