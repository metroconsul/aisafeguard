-- Add signature tracking columns to documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS signed_at timestamp with time zone;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS signature_ip text;

-- Create signature audit log table
CREATE TABLE public.signature_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  funcionario_id uuid NOT NULL,
  action_type text DEFAULT 'assinatura_holerite',
  signed_at timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.signature_logs ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users see logs from their empresa
CREATE POLICY "Tenant isolation signature_logs select"
  ON public.signature_logs FOR SELECT
  TO authenticated
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Tenant isolation signature_logs insert"
  ON public.signature_logs FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id());

-- Anon can insert signature logs (portal signing)
CREATE POLICY "Anon can insert signature_logs"
  ON public.signature_logs FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anon can update documents for signing (already exists for entregas)
-- Allow anon to update documents signature fields
CREATE POLICY "Anon can update documents for signing"
  ON public.documents FOR UPDATE
  TO anon
  USING (true);