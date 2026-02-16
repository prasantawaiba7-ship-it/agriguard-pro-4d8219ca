
-- Create prevention_tips table
CREATE TABLE IF NOT EXISTS public.prevention_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop text,
  season text,
  short_tip text NOT NULL,
  detailed_tip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prevention_tips ENABLE ROW LEVEL SECURITY;

-- Anyone can read prevention tips
CREATE POLICY "Anyone can view prevention tips"
  ON public.prevention_tips FOR SELECT
  USING (true);

-- Admins can manage prevention tips
CREATE POLICY "Admins can manage prevention tips"
  ON public.prevention_tips FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Sample data for Nepal crops
INSERT INTO public.prevention_tips (crop, season, short_tip, detailed_tip) VALUES
  ('Tomato', 'Monsoon', 'Avoid overhead irrigation', 'Irrigate at soil level in the morning to reduce leaf wetness and fungal spread during monsoon.'),
  ('Tomato', 'Summer', 'Use mulch to retain moisture', 'Apply straw or plastic mulch around tomato plants to conserve soil moisture and suppress weeds in dry season.'),
  ('Rice', 'Monsoon', 'Maintain proper water level', 'Keep 2-5 cm standing water during tillering stage. Drain field 2 weeks before harvest for uniform ripening.'),
  ('Rice', 'Monsoon', 'Use resistant varieties', 'Plant blast-resistant varieties like Sabitri or Radha-4 recommended by local agriculture office.'),
  ('Wheat', 'Winter', 'Timely sowing is critical', 'Sow wheat by mid-November (Mangsir) in Terai and early November in hills for best yield.'),
  ('Potato', 'Winter', 'Use certified seed tubers', 'Source certified seed potatoes from government farms or cooperatives. Avoid using market potatoes as seeds.'),
  ('Maize', 'Summer', 'Practice crop rotation', 'Rotate maize with legumes like soybean or lentil to improve soil nitrogen and break disease cycles.'),
  (NULL, 'Monsoon', 'Ensure good drainage', 'Create proper drainage channels around fields to prevent waterlogging during heavy monsoon rains.'),
  (NULL, NULL, 'Regular field scouting', 'Walk through your field every 3-4 days. Early detection of pests and diseases saves crops and money.'),
  (NULL, NULL, 'Keep tools clean', 'Clean and disinfect pruning tools between plants to prevent spreading diseases.');
