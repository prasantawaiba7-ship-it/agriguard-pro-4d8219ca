-- Create appointments table for booking visits with agricultural officers
CREATE TABLE public.officer_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
  officer_id UUID NOT NULL REFERENCES public.agricultural_officers(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  farmer_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.officer_appointments ENABLE ROW LEVEL SECURITY;

-- Farmers can view their own appointments
CREATE POLICY "Farmers can view their appointments"
ON public.officer_appointments
FOR SELECT
USING (farmer_id IN (
  SELECT id FROM farmer_profiles WHERE user_id = auth.uid()
));

-- Farmers can create appointments
CREATE POLICY "Farmers can create appointments"
ON public.officer_appointments
FOR INSERT
WITH CHECK (farmer_id IN (
  SELECT id FROM farmer_profiles WHERE user_id = auth.uid()
));

-- Farmers can update their pending appointments
CREATE POLICY "Farmers can update their pending appointments"
ON public.officer_appointments
FOR UPDATE
USING (
  farmer_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid())
  AND status = 'pending'
);

-- Farmers can cancel their appointments
CREATE POLICY "Farmers can delete their appointments"
ON public.officer_appointments
FOR DELETE
USING (farmer_id IN (
  SELECT id FROM farmer_profiles WHERE user_id = auth.uid()
));

-- Admins can manage all appointments
CREATE POLICY "Admins can manage all appointments"
ON public.officer_appointments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Officers can view appointments for their district (authorities)
CREATE POLICY "Authorities can view all appointments"
ON public.officer_appointments
FOR SELECT
USING (has_role(auth.uid(), 'authority'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_officer_appointments_updated_at
BEFORE UPDATE ON public.officer_appointments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add latitude and longitude to agricultural_officers for distance calculation
ALTER TABLE public.agricultural_officers 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Update sample data with approximate coordinates for Nepal districts
UPDATE public.agricultural_officers SET latitude = 27.7172, longitude = 85.3240 WHERE district = 'काठमाडौं';
UPDATE public.agricultural_officers SET latitude = 27.6710, longitude = 85.4298 WHERE district = 'भक्तपुर';
UPDATE public.agricultural_officers SET latitude = 27.6588, longitude = 85.3247 WHERE district = 'ललितपुर';
UPDATE public.agricultural_officers SET latitude = 28.2096, longitude = 83.9856 WHERE district = 'कास्की';
UPDATE public.agricultural_officers SET latitude = 27.5291, longitude = 83.4540 WHERE district = 'रूपन्देही';
UPDATE public.agricultural_officers SET latitude = 26.4525, longitude = 87.2718 WHERE district = 'मोरङ';
UPDATE public.agricultural_officers SET latitude = 28.8012, longitude = 80.5795 WHERE district = 'कैलाली';