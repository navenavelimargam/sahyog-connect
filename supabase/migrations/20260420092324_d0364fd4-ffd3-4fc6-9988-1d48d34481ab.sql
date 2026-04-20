
-- Replace broad SELECT with authenticated-only to avoid public listing
DROP POLICY IF EXISTS "Sahyog uploads readable by all" ON storage.objects;

CREATE POLICY "Sahyog uploads readable by authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'sahyog-uploads');
