import { Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Paperclip, Send } from "lucide-react";

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
          className={`rounded-lg border bg-card p-4 shadow-sm cursor-pointer transition-shadow hover:shadow-md ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30" : ""
          }`}
        >
          <p className="font-semibold text-sm text-foreground leading-tight">{employee.nome}</p>
          <p className="text-xs text-muted-foreground mt-1">{employee.cargo}</p>
          <div className="flex items-center justify-between mt-3">
            <Badge variant="secondary" className="text-[11px] px-2 py-0.5">{employee.setor}</Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              {employee.doc_count}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-xs h-7 text-primary hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onResendLink(employee.id, employee.nome, employee.telefone_whatsapp);
            }}
          >
            <Send className="h-3 w-3 mr-1" />
            Reenviar link
          </Button>
        </div>
      )}
    </Draggable>
  );
}
