import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProdutos } from "@/hooks/useProdutos";
import { Button } from "@/components/ui/button";
import {
  clearNavTrace,
  subscribeNavTrace,
  type NavEvent,
} from "@/lib/nav-telemetry";

const TYPE_COLOR: Record<string, string> = {
  route: "bg-slate-100 text-slate-700",
  auth: "bg-blue-100 text-blue-700",
  entitlement: "bg-emerald-100 text-emerald-700",
  guard: "bg-amber-100 text-amber-700",
  redirect: "bg-indigo-100 text-indigo-700",
  loop: "bg-red-100 text-red-700",
};

/** Página de diagnóstico: /debug/nav — mostra rotas, guards e entitlements. */
export default function DebugNav() {
  const [events, setEvents] = useState<NavEvent[]>([]);
  const { user, perfil, loading } = useAuth();
  const { productKey, loading: produtosLoading, produtos } = useProdutos();

  useEffect(() => subscribeNavTrace(setEvents), []);

  const loops = events.filter((e) => e.type === "loop");

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Diagnóstico de navegação</h1>
            <p className="text-sm text-slate-500">
              Rotas, guards, entitlements e redirecionamentos desta sessão.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => clearNavTrace()}>
              Limpar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(JSON.stringify(events, null, 2));
              }}
            >
              Copiar JSON
            </Button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Auth loading", String(loading)],
            ["User", user ? user.id.slice(0, 8) : "—"],
            ["Perfil / role", perfil ? `${perfil.role}` : "—"],
            ["Empresa", perfil?.empresa_id ? perfil.empresa_id.slice(0, 8) : "—"],
            ["Entitlement loading", String(produtosLoading)],
            ["Produto ativo", productKey ?? "nenhum"],
            ["Linhas empresa_produtos", String(produtos.length)],
            ["Loops detectados", String(loops.length)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 truncate text-sm font-medium text-slate-900">{value}</p>
            </div>
          ))}
        </section>

        {loops.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">Loop de redirecionamento detectado</p>
            {loops.map((l) => (
              <p key={l.t} className="mt-1 text-xs text-red-600">
                {l.message} — origem: {JSON.stringify(l.data?.sources)}
              </p>
            ))}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Hora</th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Origem</th>
                <th className="px-3 py-2 font-medium">Mensagem</th>
                <th className="px-3 py-2 font-medium">Dados</th>
              </tr>
            </thead>
            <tbody>
              {[...events].reverse().map((e, i) => (
                <tr key={`${e.t}-${i}`} className="border-t border-slate-100 align-top">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-slate-500">
                    {e.iso.slice(11, 23)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-md px-1.5 py-0.5 font-medium ${
                        TYPE_COLOR[e.type] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {e.type}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">{e.source}</td>
                  <td className="px-3 py-2 text-slate-700">{e.message}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                    {e.data ? JSON.stringify(e.data) : ""}
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                    Nenhum evento ainda. Navegue para /app ou /restaurant/dashboard.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
