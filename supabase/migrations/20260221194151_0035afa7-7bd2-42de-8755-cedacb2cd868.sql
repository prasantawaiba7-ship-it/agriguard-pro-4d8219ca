
-- Auto-triage & routing function for the new `cases` table
CREATE OR REPLACE FUNCTION public.auto_route_ticket(p_case_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_case RECORD;
  v_expert_id uuid;
BEGIN
  SELECT * INTO v_case FROM cases WHERE id = p_case_id;
  IF v_case IS NULL THEN RETURN; END IF;

  -- Priority auto-determination based on AI summary severity
  IF v_case.ai_summary IS NOT NULL AND (v_case.ai_summary->>'severity') = 'high' THEN
    UPDATE cases SET priority = 'high' WHERE id = p_case_id AND priority != 'high';
  END IF;

  -- Skill-based expert assignment from the new `experts` table
  SELECT e.id INTO v_expert_id
  FROM experts e
  WHERE e.status = 'active'
    AND (e.max_open_cases IS NULL OR (
      (SELECT count(*) FROM cases c2 WHERE c2.assigned_expert_id = e.id AND c2.status NOT IN ('closed', 'answered')) < e.max_open_cases
    ))
    AND (v_case.district IS NULL OR v_case.district = ANY(e.districts))
    AND (v_case.crop IS NULL OR v_case.crop = ANY(e.crops))
    AND (v_case.problem_type IS NULL OR v_case.problem_type = ANY(e.problem_types))
  ORDER BY (SELECT count(*) FROM cases c3 WHERE c3.assigned_expert_id = e.id AND c3.status NOT IN ('closed', 'answered')) ASC
  LIMIT 1;

  IF v_expert_id IS NOT NULL THEN
    UPDATE cases 
    SET assigned_expert_id = v_expert_id,
        status = 'in_review'
    WHERE id = p_case_id AND assigned_expert_id IS NULL;
  END IF;
END;
$$;
