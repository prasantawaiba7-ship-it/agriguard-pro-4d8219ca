
-- Create experts table
CREATE TABLE public.experts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  districts text[] DEFAULT '{}',
  crops text[] DEFAULT '{}',
  problem_types text[] DEFAULT '{}',
  max_open_cases int DEFAULT 50,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cases table
CREATE TABLE public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid,
  farmer_phone text,
  crop text,
  problem_type text,
  district text,
  channel text DEFAULT 'app',
  priority text DEFAULT 'low',
  status text DEFAULT 'new',
  ai_summary jsonb,
  assigned_expert_id uuid REFERENCES public.experts(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ticket_messages table (named to avoid conflict with existing case_messages)
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  sender_type text,
  message text,
  attachments jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Experts: admins manage, anyone can view active
CREATE POLICY "Admins can manage experts" ON public.experts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active experts" ON public.experts FOR SELECT USING (status = 'active');

-- Cases: admins manage all, farmers see own
CREATE POLICY "Admins can manage all cases" ON public.cases FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their own cases" ON public.cases FOR SELECT USING (auth.uid() = farmer_id);
CREATE POLICY "Users can create cases" ON public.cases FOR INSERT WITH CHECK ((auth.uid() = farmer_id) OR (farmer_id IS NULL));

-- Ticket messages: admins manage, farmers see non-internal for their cases
CREATE POLICY "Admins can manage all ticket messages" ON public.ticket_messages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Farmers can view their ticket messages" ON public.ticket_messages FOR SELECT USING (
  case_id IN (SELECT id FROM public.cases WHERE farmer_id = auth.uid())
);
CREATE POLICY "Farmers can send ticket messages" ON public.ticket_messages FOR INSERT WITH CHECK (
  case_id IN (SELECT id FROM public.cases WHERE farmer_id = auth.uid())
);
CREATE POLICY "System can insert ticket messages" ON public.ticket_messages FOR INSERT WITH CHECK (true);

-- Enable realtime for ticket_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;

-- Updated_at triggers
CREATE TRIGGER update_experts_updated_at BEFORE UPDATE ON public.experts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
