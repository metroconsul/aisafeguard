-- Create storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public) VALUES ('fichas-pdf', 'fichas-pdf', true);

-- Allow public read access
CREATE POLICY "Public read access on fichas-pdf" ON storage.objects FOR SELECT TO public USING (bucket_id = 'fichas-pdf');

-- Allow anonymous uploads
CREATE POLICY "Allow uploads to fichas-pdf" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'fichas-pdf');