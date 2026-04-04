
CREATE POLICY "Authenticated users can update employee_vault"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'employee_vault')
WITH CHECK (bucket_id = 'employee_vault');
