import { Eye, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  id: string;
  nome: string;
  matricula: string;
  cargo: string;
  telefone_whatsapp: string | null;
}

export default function FuncionarioKanbanCard({ id, nome, matricula, cargo, telefone_whatsapp }: Props) {
  const navigate = useNavigate();
  const goDetail = () => navigate(`/app/funcionarios/${id}`);
  const onlyDigits = (telefone_whatsapp || "").replace(/\D/g, "");
  const waHref = onlyDigits ? `https://wa.me/${onlyDigits}` : null;
  const initials = nome
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      onClick={goDetail}
      className="group relative cursor-pointer rounded-lg border border-border/80 border-t-2 border-t-secondary-400 bg-card p-4 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-[11px] font-bold text-primary-600 ring-1 ring-primary-100">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">{nome}</p>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">#{matricula || "----"}</p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-success/10 px-1.5 py-1 text-[10px] font-bold uppercase text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Ativo
        </span>
      </div>

      <p className="mt-4 truncate text-xs font-medium text-muted-foreground">{cargo || "Cargo não informado"}</p>

      <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-success/15"
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
            Mensagem
          </a>
        ) : (
          <span className="rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground">Sem WhatsApp</span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goDetail();
          }}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary-50 hover:text-primary-500"
          aria-label="Ver perfil"
        >
          <Eye className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
