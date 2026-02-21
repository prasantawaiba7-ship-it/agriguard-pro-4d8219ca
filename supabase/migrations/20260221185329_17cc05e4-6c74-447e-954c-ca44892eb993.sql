
-- ============================================
-- CASE MESSAGES TABLE (Threaded conversation)
-- ============================================
CREATE TABLE public.case_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL REFERENCES public.diagnosis_cases(id) ON DELETE CASCADE,
  sender_type text NOT NULL DEFAULT 'farmer',  -- farmer, expert, system, ai
  sender_id uuid NULL,  -- user_id or expert_id
  message_text text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,  -- [{type:'image', url:'...'}, {type:'audio', url:'...'}]
  is_internal_note boolean NOT NULL DEFAULT false,  -- hidden from farmer
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_case_messages_case_id ON public.case_messages(case_id);
CREATE INDEX idx_case_messages_created ON public.case_messages(case_id, created_at);

-- Enable RLS
ALTER TABLE public.case_messages ENABLE ROW LEVEL SECURITY;

-- Farmers can view non-internal messages for their own cases
CREATE POLICY "Farmers can view their case messages"
  ON public.case_messages FOR SELECT
  USING (
    is_internal_note = false
    AND case_id IN (
      SELECT id FROM public.diagnosis_cases WHERE user_id = auth.uid()
    )
  );

-- Farmers can insert messages to their own cases
CREATE POLICY "Farmers can send messages to their cases"
  ON public.case_messages FOR INSERT
  WITH CHECK (
    sender_type = 'farmer'
    AND case_id IN (
      SELECT id FROM public.diagnosis_cases WHERE user_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage all case messages"
  ON public.case_messages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert messages
CREATE POLICY "System can insert case messages"
  ON public.case_messages FOR INSERT
  WITH CHECK (true);

-- Enable realtime for case_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_messages;

-- ============================================
-- ADD closed_at and first_response_at to diagnosis_cases
-- ============================================
ALTER TABLE public.diagnosis_cases
  ADD COLUMN IF NOT EXISTS closed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS first_response_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS title text NULL;

-- ============================================
-- AUTO-ROUTING FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_route_case(p_case_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_case RECORD;
  v_expert_id uuid;
BEGIN
  -- Get case details
  SELECT dc.*, d.name_en as district_name, c.name_en as crop_name
  INTO v_case
  FROM diagnosis_cases dc
  LEFT JOIN districts d ON dc.location_district_id = d.id
  LEFT JOIN crops c ON dc.crop_id = c.id
  WHERE dc.id = p_case_id;

  IF v_case IS NULL THEN RETURN; END IF;

  -- Priority auto-determination
  IF v_case.priority = 'urgent' THEN
    UPDATE diagnosis_cases SET priority = 'urgent' WHERE id = p_case_id;
  END IF;

  -- Skill-based expert assignment
  SELECT ao.id INTO v_expert_id
  FROM agricultural_officers ao
  WHERE ao.is_active = true
    AND ao.is_available = true
    AND (ao.open_cases_count IS NULL OR ao.open_cases_count < COALESCE(ao.max_open_cases, 50))
    AND (v_case.district_name IS NULL OR ao.district ILIKE '%' || v_case.district_name || '%')
  ORDER BY COALESCE(ao.open_cases_count, 0) ASC
  LIMIT 1;

  IF v_expert_id IS NOT NULL THEN
    UPDATE diagnosis_cases 
    SET assigned_expert_id = v_expert_id,
        case_status = 'expert_pending'
    WHERE id = p_case_id AND assigned_expert_id IS NULL;

    UPDATE agricultural_officers
    SET open_cases_count = COALESCE(open_cases_count, 0) + 1
    WHERE id = v_expert_id;
  END IF;
END;
$$;
