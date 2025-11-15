-- Create receipts storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for receipts
CREATE POLICY "Users can upload receipts" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Users can view receipts" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'receipts');

CREATE POLICY "Users can delete their receipts" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'receipts');






