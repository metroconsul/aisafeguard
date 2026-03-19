
-- Add reference_period column for holerites
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS reference_period text;

-- Make employee_vault bucket public
UPDATE storage.buckets SET public = true WHERE id = 'employee_vault';
