
-- Add user_id to experts table so experts can log in and see their cases
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_experts_user_id ON public.experts(user_id) WHERE user_id IS NOT NULL;

-- Experts can view cases assigned to them
CREATE POLICY "Experts can view their assigned cases"
ON public.cases
FOR SELECT
USING (
  assigned_expert_id IN (
    SELECT id FROM public.experts WHERE user_id = auth.uid()
  )
);

-- Experts can update their assigned cases (status changes)
CREATE POLICY "Experts can update their assigned cases"
ON public.cases
FOR UPDATE
USING (
  assigned_expert_id IN (
    SELECT id FROM public.experts WHERE user_id = auth.uid()
  )
);

-- Experts can view ticket messages for their assigned cases
CREATE POLICY "Experts can view ticket messages for their cases"
ON public.ticket_messages
FOR SELECT
USING (
  case_id IN (
    SELECT c.id FROM public.cases c
    JOIN public.experts e ON c.assigned_expert_id = e.id
    WHERE e.user_id = auth.uid()
  )
);

-- Experts can send ticket messages to their assigned cases
CREATE POLICY "Experts can send ticket messages"
ON public.ticket_messages
FOR INSERT
WITH CHECK (
  case_id IN (
    SELECT c.id FROM public.cases c
    JOIN public.experts e ON c.assigned_expert_id = e.id
    WHERE e.user_id = auth.uid()
  )
);
