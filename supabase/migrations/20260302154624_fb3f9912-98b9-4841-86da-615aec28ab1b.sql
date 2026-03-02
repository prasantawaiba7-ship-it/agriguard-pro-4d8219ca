
-- Helper function to check technician ownership (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_technician_user(p_technician_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.technicians
    WHERE id = p_technician_id AND user_id = p_user_id AND is_active = true
  )
$$;

-- Call requests table
CREATE TABLE public.call_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.expert_tickets(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL,
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  farmer_note text,
  technician_note text,
  preferred_time text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Partial unique index: only one active request per ticket
CREATE UNIQUE INDEX idx_call_requests_active_per_ticket
  ON public.call_requests (ticket_id)
  WHERE status IN ('pending', 'accepted');

-- Updated_at trigger
CREATE TRIGGER call_requests_updated_at
  BEFORE UPDATE ON public.call_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.call_requests ENABLE ROW LEVEL SECURITY;

-- Farmer can see own requests
CREATE POLICY "Farmers can view own call requests"
  ON public.call_requests FOR SELECT
  TO authenticated
  USING (farmer_id = auth.uid());

-- Technician can see requests assigned to them
CREATE POLICY "Technicians can view assigned call requests"
  ON public.call_requests FOR SELECT
  TO authenticated
  USING (public.is_technician_user(technician_id, auth.uid()));

-- Farmer can insert requests for their own tickets
CREATE POLICY "Farmers can create call requests"
  ON public.call_requests FOR INSERT
  TO authenticated
  WITH CHECK (farmer_id = auth.uid());

-- Technician can update status/notes on assigned requests
CREATE POLICY "Technicians can update assigned call requests"
  ON public.call_requests FOR UPDATE
  TO authenticated
  USING (public.is_technician_user(technician_id, auth.uid()));

-- Admin full access
CREATE POLICY "Admins full access call requests"
  ON public.call_requests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for call_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_requests;
