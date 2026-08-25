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

  return (
    <div
      onClick={goDetail}
      className="relative cursor-grab rounded-xl border border-border border-t-4 border-t-secondary-400 bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover"
    >
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">#{matricula || "----"}</span>
        <span className="inline-flex items-center gap-1 bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Ativo
        </span>
      </div>

      <p className="mt-2 text-base font-semibold leading-tight text-foreground">{nome}</p>
      <p className="mt-1 inline-flex rounded-full border border-primary-100 bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-500">{cargo || "—"}</p>

      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 hover:bg-success/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Mensagem
          </a>
        ) : (
          <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">Sem WhatsApp</span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goDetail();
          }}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary-50 hover:text-primary-500 transition-colors"
          aria-label="Ver perfil"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
