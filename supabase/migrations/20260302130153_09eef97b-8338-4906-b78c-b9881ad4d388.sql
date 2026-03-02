
-- 1. Create expert_ticket_images table
CREATE TABLE public.expert_ticket_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.expert_tickets(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('farmer', 'technician')),
  image_url text NOT NULL,
  note text,
  annotation_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX idx_expert_ticket_images_ticket ON public.expert_ticket_images(ticket_id, created_at);
CREATE INDEX idx_expert_ticket_images_uploaded_by ON public.expert_ticket_images(uploaded_by);

-- 3. Enable RLS
ALTER TABLE public.expert_ticket_images ENABLE ROW LEVEL SECURITY;

-- 4. RLS: Farmers can SELECT images on their own tickets
CREATE POLICY "Farmers can view ticket images"
  ON public.expert_ticket_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expert_tickets et
      WHERE et.id = expert_ticket_images.ticket_id
        AND et.farmer_id = auth.uid()
    )
  );

-- 5. RLS: Farmers can INSERT images on their own tickets
CREATE POLICY "Farmers can insert ticket images"
  ON public.expert_ticket_images FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND role = 'farmer'
    AND EXISTS (
      SELECT 1 FROM public.expert_tickets et
      WHERE et.id = expert_ticket_images.ticket_id
        AND et.farmer_id = auth.uid()
    )
  );

-- 6. RLS: Technicians can SELECT images on assigned tickets
CREATE POLICY "Technicians can view ticket images"
  ON public.expert_ticket_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expert_tickets et
      JOIN public.technicians t ON t.id = et.technician_id
      WHERE et.id = expert_ticket_images.ticket_id
        AND t.user_id = auth.uid()
    )
  );

-- 7. RLS: Technicians can INSERT images on assigned tickets
CREATE POLICY "Technicians can insert ticket images"
  ON public.expert_ticket_images FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND role = 'technician'
    AND EXISTS (
      SELECT 1 FROM public.expert_tickets et
      JOIN public.technicians t ON t.id = et.technician_id
      WHERE et.id = expert_ticket_images.ticket_id
        AND t.user_id = auth.uid()
    )
  );

-- 8. RLS: Technicians can UPDATE note/annotation on assigned tickets
CREATE POLICY "Technicians can update image notes"
  ON public.expert_ticket_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.expert_tickets et
      JOIN public.technicians t ON t.id = et.technician_id
      WHERE et.id = expert_ticket_images.ticket_id
        AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expert_tickets et
      JOIN public.technicians t ON t.id = et.technician_id
      WHERE et.id = expert_ticket_images.ticket_id
        AND t.user_id = auth.uid()
    )
  );

-- 9. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.expert_ticket_images;

-- 10. Create ticket-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-images', 'ticket-images', true)
ON CONFLICT (id) DO NOTHING;

-- 11. Storage policies for ticket-images bucket
CREATE POLICY "Authenticated users can upload ticket images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ticket-images');

CREATE POLICY "Anyone can view ticket images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ticket-images');
