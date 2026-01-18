-- Add DELETE policy for ai_chat_history so farmers can clear their chat
CREATE POLICY "Farmers can delete their chat messages"
ON public.ai_chat_history
FOR DELETE
USING (farmer_id IN (
  SELECT id FROM farmer_profiles WHERE user_id = auth.uid()
));