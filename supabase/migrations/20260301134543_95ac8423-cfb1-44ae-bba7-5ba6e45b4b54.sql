-- Add is_expert flag to technicians table
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS is_expert boolean NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.technicians.is_expert IS 'When true, this technician can access the Expert Answering Dashboard';

-- RLS policy: technicians with is_expert can view their assigned tickets
-- Drop existing technician select policy if any, then recreate
DO $$ BEGIN
  -- Drop old policies if they exist (safe to ignore errors)
  BEGIN DROP POLICY IF EXISTS "Technician can see assigned tickets" ON public.expert_tickets; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Farmer can see own tickets" ON public.expert_tickets; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Admin can see all expert tickets" ON public.expert_tickets; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Technician can update assigned tickets" ON public.expert_tickets; EXCEPTION WHEN OTHERS THEN NULL; END;
  
  -- expert_ticket_messages policies
  BEGIN DROP POLICY IF EXISTS "Farmer can see own ticket messages" ON public.expert_ticket_messages; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Technician can see assigned ticket messages" ON public.expert_ticket_messages; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Admin can see all ticket messages" ON public.expert_ticket_messages; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Farmer can insert own ticket messages" ON public.expert_ticket_messages; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Technician can insert assigned ticket messages" ON public.expert_ticket_messages; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- Enable RLS
ALTER TABLE public.expert_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_ticket_messages ENABLE ROW LEVEL SECURITY;

-- expert_tickets policies
CREATE POLICY "Farmer can see own tickets"
  ON public.expert_tickets FOR SELECT TO authenticated
  USING (farmer_id = auth.uid());

CREATE POLICY "Technician can see assigned tickets"
  ON public.expert_tickets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.technicians t
      WHERE t.id = expert_tickets.technician_id
        AND t.user_id = auth.uid()
        AND t.is_expert = true
    )
  );

CREATE POLICY "Admin can see all expert tickets"
  ON public.expert_tickets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Technician can update assigned tickets"
  ON public.expert_tickets FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.technicians t
      WHERE t.id = expert_tickets.technician_id
        AND t.user_id = auth.uid()
        AND t.is_expert = true
    )
  );

-- Allow farmers to insert tickets
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "Farmer can insert tickets" ON public.expert_tickets; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "Farmer can insert tickets"
  ON public.expert_tickets FOR INSERT TO authenticated
  WITH CHECK (farmer_id = auth.uid());

-- Allow farmers to update their own tickets (e.g. has_unread_farmer)
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "Farmer can update own tickets" ON public.expert_tickets; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "Farmer can update own tickets"
  ON public.expert_tickets FOR UPDATE TO authenticated
  USING (farmer_id = auth.uid());

-- Admin can update all tickets (for assignment)
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "Admin can update all expert tickets" ON public.expert_tickets; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "Admin can update all expert tickets"
  ON public.expert_tickets FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- expert_ticket_messages policies
CREATE POLICY "Farmer can see own ticket messages"
  ON public.expert_ticket_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.expert_tickets et
      WHERE et.id = expert_ticket_messages.ticket_id
        AND et.farmer_id = auth.uid()
    )
  );

CREATE POLICY "Technician can see assigned ticket messages"
  ON public.expert_ticket_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.expert_tickets et
      JOIN public.technicians t ON t.id = et.technician_id
      WHERE et.id = expert_ticket_messages.ticket_id
        AND t.user_id = auth.uid()
        AND t.is_expert = true
    )
  );

CREATE POLICY "Admin can see all ticket messages"
  ON public.expert_ticket_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Farmer can insert own ticket messages"
  ON public.expert_ticket_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expert_tickets et
      WHERE et.id = expert_ticket_messages.ticket_id
        AND et.farmer_id = auth.uid()
    )
  );

CREATE POLICY "Technician can insert assigned ticket messages"
  ON public.expert_ticket_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expert_tickets et
      JOIN public.technicians t ON t.id = et.technician_id
      WHERE et.id = expert_ticket_messages.ticket_id
        AND t.user_id = auth.uid()
        AND t.is_expert = true
    )
  );
