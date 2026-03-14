import { ultimasEntregas } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

export function UltimasEntregasTable() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Últimas Entregas</h3>
        <button className="text-xs font-medium text-primary hover:underline">Ver Todas</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 font-medium text-muted-foreground">Funcionário</th>
              <th className="pb-3 font-medium text-muted-foreground">EPI</th>
              <th className="pb-3 font-medium text-muted-foreground">CA</th>
              <th className="pb-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ultimasEntregas.map((e, i) => (
              <tr key={i}>
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {e.funcionario.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{e.funcionario}</p>
                      <p className="text-xs text-muted-foreground">{e.setor}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-foreground">{e.epi}</td>
                <td className="py-3 tabular-nums text-muted-foreground">{e.ca}</td>
                <td className="py-3">
                  <Badge
                    variant={e.status === "Assinado" ? "default" : "outline"}
                    className={
                      e.status === "Assinado"
                        ? "bg-success/10 text-success border-success/20 hover:bg-success/20"
                        : "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20"
                    }
                  >
                    {e.status === "Assinado" ? "Assinado" : "Aguardando"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
