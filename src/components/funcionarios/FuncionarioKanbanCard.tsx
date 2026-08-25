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
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-grab hover:shadow-md hover:border-primary-200 hover:-translate-y-0.5 transition-all duration-200 relative"
    >
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold text-slate-400">#{matricula || "----"}</span>
        <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Ativo
        </span>
      </div>

      <p className="text-base font-bold text-gray-900 mt-2 leading-tight">{nome}</p>
      <p className="text-sm font-medium text-primary-500 mt-0.5">{cargo || "—"}</p>

      <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Mensagem
          </a>
        ) : (
          <span className="text-xs font-medium text-slate-300 bg-slate-50 px-3 py-1.5 rounded-lg">Sem WhatsApp</span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goDetail();
          }}
          className="text-gray-400 hover:text-primary-500 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          aria-label="Ver perfil"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
