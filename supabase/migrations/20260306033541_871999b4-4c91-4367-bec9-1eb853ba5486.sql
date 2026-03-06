
-- Trigger: new user_feedback → admin notification (especially low ratings)
CREATE OR REPLACE FUNCTION public.notify_admin_new_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_priority text := 'normal';
  v_type text := 'feedback_new';
  v_title text := 'New feedback received';
BEGIN
  IF NEW.rating IS NOT NULL AND NEW.rating <= 2 THEN
    v_priority := 'high';
    v_type := 'rating_low';
    v_title := '⚠️ Low rating alert (' || NEW.rating || ' stars)';
  END IF;

  PERFORM public.create_admin_notification(
    v_type,
    v_title,
    'Type: ' || COALESCE(NEW.target_type::text, 'general') || ' | Rating: ' || COALESCE(NEW.rating::text, 'N/A'),
    jsonb_build_object('feedback_id', NEW.id, 'target_type', NEW.target_type, 'rating', NEW.rating, 'comment', NEW.comment_text, 'user_id', NEW.user_id),
    v_priority
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_notify_new_feedback
  AFTER INSERT ON public.user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_feedback();
