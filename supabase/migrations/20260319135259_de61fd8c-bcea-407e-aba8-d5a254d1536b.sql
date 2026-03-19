
-- Add new columns to documents table for expanded GED
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS worksite text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS issue_date date;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS workload_hours numeric;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS provider_or_lead text;

-- Create company_vault bucket if not exists (already exists but ensure)
INSERT INTO storage.buckets (id, name, public) VALUES ('company_vault', 'company_vault', true) ON CONFLICT (id) DO NOTHING;

-- RLS policy for company_vault storage
CREATE POLICY "Authenticated users can upload to company_vault" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'company_vault');
CREATE POLICY "Public can read company_vault" ON storage.objects FOR SELECT USING (bucket_id = 'company_vault');
CREATE POLICY "Authenticated users can delete from company_vault" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'company_vault');
