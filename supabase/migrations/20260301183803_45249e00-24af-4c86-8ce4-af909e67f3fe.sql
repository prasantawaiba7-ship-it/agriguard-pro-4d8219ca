
-- Security definer function: auto-link technician by email
-- Called client-side when a user logs in; safely sets user_id if email matches
CREATE OR REPLACE FUNCTION public.auto_link_technician_by_email(p_user_id uuid, p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tech RECORD;
BEGIN
  -- First try to find already-linked technician
  SELECT id, name, office_id, is_expert, is_active, email, role_title, specialization, phone
  INTO v_tech
  FROM technicians
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'id', v_tech.id,
      'name', v_tech.name,
      'office_id', v_tech.office_id,
      'is_expert', v_tech.is_expert,
      'is_active', v_tech.is_active,
      'email', v_tech.email,
      'role_title', v_tech.role_title,
      'specialization', v_tech.specialization,
      'phone', v_tech.phone
    );
  END IF;

  -- Try to link by email match (only if user_id is NULL)
  UPDATE technicians
  SET user_id = p_user_id
  WHERE LOWER(email) = LOWER(p_email)
    AND is_active = true
    AND user_id IS NULL
  RETURNING id, name, office_id, is_expert, is_active, email, role_title, specialization, phone
  INTO v_tech;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'id', v_tech.id,
      'name', v_tech.name,
      'office_id', v_tech.office_id,
      'is_expert', v_tech.is_expert,
      'is_active', v_tech.is_active,
      'email', v_tech.email,
      'role_title', v_tech.role_title,
      'specialization', v_tech.specialization,
      'phone', v_tech.phone
    );
  END IF;

  RETURN NULL;
END;
$$;
