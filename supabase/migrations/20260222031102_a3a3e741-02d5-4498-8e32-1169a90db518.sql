
-- Allow admins to insert farmer notifications (for expert reply notifications)
CREATE POLICY "Admins can insert farmer notifications"
ON public.farmer_notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for farmer_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.farmer_notifications;
