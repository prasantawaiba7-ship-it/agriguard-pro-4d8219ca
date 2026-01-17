-- Add RLS policy for farmers to insert their own disease detections
CREATE POLICY "Farmers can insert their disease detections"
ON public.disease_detections
FOR INSERT
WITH CHECK (
  farmer_id IN (
    SELECT id FROM farmer_profiles WHERE user_id = auth.uid()
  )
);