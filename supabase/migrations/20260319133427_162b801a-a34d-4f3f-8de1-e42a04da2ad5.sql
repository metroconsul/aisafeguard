
-- Trigger function: when a new entrega is inserted, auto-create a document in the EPI category
CREATE OR REPLACE FUNCTION public.sync_entrega_to_document()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_func_nome text;
  v_epi_nome text;
  v_empresa_id uuid;
BEGIN
  SELECT nome INTO v_func_nome FROM public.funcionarios WHERE id = NEW.funcionario_id;
  SELECT nome_equipamento INTO v_epi_nome FROM public.epis WHERE id = NEW.epi_id;
  
  -- Get empresa_id from the entrega itself or from the funcionario
  v_empresa_id := COALESCE(NEW.empresa_id, (SELECT empresa_id FROM public.funcionarios WHERE id = NEW.funcionario_id));

  INSERT INTO public.documents (funcionario_id, empresa_id, title, doc_category, signature_status, created_at)
  VALUES (
    NEW.funcionario_id,
    v_empresa_id,
    'Ficha EPI — ' || COALESCE(v_epi_nome, 'Equipamento'),
    'epi',
    CASE WHEN NEW.status_assinatura = 'Assinado' THEN 'assinado' ELSE 'pendente' END,
    COALESCE(NEW.created_at, now())
  );

  RETURN NEW;
END;
$$;

-- Create the trigger on entregas table
CREATE TRIGGER trg_sync_entrega_to_document
AFTER INSERT ON public.entregas
FOR EACH ROW
EXECUTE FUNCTION public.sync_entrega_to_document();

-- Backfill: create document records for all existing entregas that don't have one yet
INSERT INTO public.documents (funcionario_id, empresa_id, title, doc_category, signature_status, created_at)
SELECT 
  e.funcionario_id,
  COALESCE(e.empresa_id, f.empresa_id),
  'Ficha EPI — ' || COALESCE(ep.nome_equipamento, 'Equipamento'),
  'epi',
  CASE WHEN e.status_assinatura = 'Assinado' THEN 'assinado' ELSE 'pendente' END,
  COALESCE(e.created_at, now())
FROM public.entregas e
LEFT JOIN public.funcionarios f ON f.id = e.funcionario_id
LEFT JOIN public.epis ep ON ep.id = e.epi_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.documents d 
  WHERE d.funcionario_id = e.funcionario_id 
    AND d.doc_category = 'epi'
    AND d.title LIKE 'Ficha EPI%'
    AND d.created_at = e.created_at
);
