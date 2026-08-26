import { Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck2, Paperclip, Send } from "lucide-react";

interface CardProps {
  employee: {
    id: string;
    nome: string;
    cargo: string;
    setor: string;
    telefone_whatsapp: string | null;
    doc_count: number;
  };
  index: number;
  onClick: () => void;
  onResendLink: (id: string, name: string, phone: string | null) => void;
}

export default function AdmissaoKanbanCard({ employee, index, onClick, onResendLink }: CardProps) {
  return (
    <Draggable draggableId={employee.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`group cursor-pointer rounded-lg border border-border/80 bg-card p-4 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover ${
            snapshot.isDragging ? "ring-2 ring-secondary/30 shadow-elevated" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-foreground">{employee.nome}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{employee.cargo}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground" title="Documentos anexados">
              <Paperclip className="h-3 w-3" strokeWidth={1.8} />
              {employee.doc_count}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <Badge variant="secondary" className="max-w-[150px] truncate rounded-md px-2 py-1 text-[10px] font-semibold">
              {employee.setor}
            </Badge>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <FileCheck2 className="h-3 w-3 text-secondary-400" strokeWidth={1.8} />
              {employee.doc_count ? "Em análise" : "Sem documentos"}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="mt-3 h-8 w-full justify-start rounded-md border-t border-border/70 px-0 pt-2 text-xs font-semibold text-primary hover:bg-transparent hover:text-secondary-500"
            onClick={(e) => {
              e.stopPropagation();
              onResendLink(employee.id, employee.nome, employee.telefone_whatsapp);
            }}
          >
            <Send className="mr-1.5 h-3 w-3" strokeWidth={1.8} />
            Reenviar link
          </Button>
        </div>
      )}
    </Draggable>
  );
}
