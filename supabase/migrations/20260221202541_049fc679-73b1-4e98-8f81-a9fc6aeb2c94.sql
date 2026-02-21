
-- Drop the existing admin policy on cases and recreate with direct check
DROP POLICY IF EXISTS "Admins can manage all cases" ON public.cases;
CREATE POLICY "Admins can manage all cases"
  ON public.cases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
    )
  );

-- Same fix for ticket_messages
DROP POLICY IF EXISTS "Admins can manage all ticket messages" ON public.ticket_messages;
CREATE POLICY "Admins can manage all ticket messages"
  ON public.ticket_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
    )
  );
