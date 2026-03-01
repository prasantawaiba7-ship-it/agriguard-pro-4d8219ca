
-- 1. ag_offices table
CREATE TABLE public.ag_offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  district text NOT NULL,
  contact_phone text,
  contact_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ag_offices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ag_offices" ON public.ag_offices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage ag_offices" ON public.ag_offices
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. technicians table
CREATE TABLE public.technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES public.ag_offices(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  role_title text NOT NULL DEFAULT 'Krishi Prabidhik',
  phone text,
  email text,
  specialization text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_technicians_office ON public.technicians(office_id);
CREATE INDEX idx_technicians_user ON public.technicians(user_id);

ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active technicians" ON public.technicians
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage technicians" ON public.technicians
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. expert_tickets table
CREATE TABLE public.expert_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES public.ag_offices(id),
  technician_id uuid NOT NULL REFERENCES public.technicians(id),
  crop_name text NOT NULL,
  problem_title text NOT NULL,
  problem_description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','answered','closed')),
  has_unread_farmer boolean NOT NULL DEFAULT false,
  has_unread_technician boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_expert_tickets_farmer ON public.expert_tickets(farmer_id);
CREATE INDEX idx_expert_tickets_technician ON public.expert_tickets(technician_id);
CREATE INDEX idx_expert_tickets_status ON public.expert_tickets(status);

ALTER TABLE public.expert_tickets ENABLE ROW LEVEL SECURITY;

-- Farmers see their own tickets
CREATE POLICY "Farmers see own tickets" ON public.expert_tickets
  FOR SELECT TO authenticated USING (farmer_id = auth.uid());

CREATE POLICY "Farmers create tickets" ON public.expert_tickets
  FOR INSERT TO authenticated WITH CHECK (farmer_id = auth.uid());

CREATE POLICY "Farmers update own tickets" ON public.expert_tickets
  FOR UPDATE TO authenticated USING (farmer_id = auth.uid());

-- Technicians see tickets assigned to them
CREATE POLICY "Technicians see assigned tickets" ON public.expert_tickets
  FOR SELECT TO authenticated USING (
    technician_id IN (SELECT t.id FROM public.technicians t WHERE t.user_id = auth.uid())
  );

CREATE POLICY "Technicians update assigned tickets" ON public.expert_tickets
  FOR UPDATE TO authenticated USING (
    technician_id IN (SELECT t.id FROM public.technicians t WHERE t.user_id = auth.uid())
  );

-- Admins full access
CREATE POLICY "Admins manage all tickets" ON public.expert_tickets
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. expert_ticket_messages table
CREATE TABLE public.expert_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.expert_tickets(id) ON DELETE CASCADE,
  sender_type text NOT NULL DEFAULT 'farmer' CHECK (sender_type IN ('farmer','technician','admin','ai')),
  sender_id uuid REFERENCES auth.users(id),
  message_text text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_expert_ticket_messages_ticket ON public.expert_ticket_messages(ticket_id);

ALTER TABLE public.expert_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Messages visible to ticket participants
CREATE POLICY "Ticket participants see messages" ON public.expert_ticket_messages
  FOR SELECT TO authenticated USING (
    ticket_id IN (
      SELECT et.id FROM public.expert_tickets et
      WHERE et.farmer_id = auth.uid()
         OR et.technician_id IN (SELECT t.id FROM public.technicians t WHERE t.user_id = auth.uid())
    )
  );

CREATE POLICY "Ticket participants send messages" ON public.expert_ticket_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND
    ticket_id IN (
      SELECT et.id FROM public.expert_tickets et
      WHERE et.farmer_id = auth.uid()
         OR et.technician_id IN (SELECT t.id FROM public.technicians t WHERE t.user_id = auth.uid())
    )
  );

CREATE POLICY "Admins manage all messages" ON public.expert_ticket_messages
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. updated_at trigger for expert_tickets
CREATE TRIGGER set_expert_tickets_updated_at
  BEFORE UPDATE ON public.expert_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.expert_ticket_messages;

-- 7. Storage bucket for expert images
INSERT INTO storage.buckets (id, name, public) VALUES ('expert-images', 'expert-images', true);

CREATE POLICY "Authenticated users upload expert images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'expert-images');

CREATE POLICY "Anyone can view expert images" ON storage.objects
  FOR SELECT USING (bucket_id = 'expert-images');
