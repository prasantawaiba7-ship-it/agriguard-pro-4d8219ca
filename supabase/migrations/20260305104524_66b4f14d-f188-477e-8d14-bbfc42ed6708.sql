
-- 1. Create area_unit enum
CREATE TYPE public.area_unit AS ENUM ('ropani', 'bigha', 'kattha', 'hectare', 'acre');

-- 2. Create farm_crop_status enum
CREATE TYPE public.farm_crop_status AS ENUM ('active', 'completed');

-- 3. Create farms table
CREATE TABLE public.farms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_name TEXT NOT NULL,
  village TEXT,
  district TEXT,
  total_area NUMERIC,
  area_unit TEXT DEFAULT 'ropani',
  main_crops TEXT[] DEFAULT '{}',
  irrigation_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create farm_crops table
CREATE TABLE public.farm_crops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  crop_type TEXT NOT NULL,
  season TEXT,
  sowing_date DATE,
  transplant_date DATE,
  harvest_date_estimated DATE,
  area NUMERIC,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Indexes
CREATE INDEX idx_farms_farmer_id ON public.farms(farmer_id);
CREATE INDEX idx_farm_crops_farm_id ON public.farm_crops(farm_id);
CREATE INDEX idx_farm_crops_status ON public.farm_crops(status);

-- 6. Add farm_id and farm_crop_id to expert_tickets
ALTER TABLE public.expert_tickets
  ADD COLUMN farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  ADD COLUMN farm_crop_id UUID REFERENCES public.farm_crops(id) ON DELETE SET NULL;

-- 7. updated_at triggers
CREATE TRIGGER handle_farms_updated_at
  BEFORE UPDATE ON public.farms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_farm_crops_updated_at
  BEFORE UPDATE ON public.farm_crops
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. RLS for farms
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own farms"
  ON public.farms FOR SELECT
  TO authenticated
  USING (farmer_id = auth.uid());

CREATE POLICY "Farmers can insert own farms"
  ON public.farms FOR INSERT
  TO authenticated
  WITH CHECK (farmer_id = auth.uid());

CREATE POLICY "Farmers can update own farms"
  ON public.farms FOR UPDATE
  TO authenticated
  USING (farmer_id = auth.uid())
  WITH CHECK (farmer_id = auth.uid());

CREATE POLICY "Farmers can delete own farms"
  ON public.farms FOR DELETE
  TO authenticated
  USING (farmer_id = auth.uid());

-- 9. RLS for farm_crops
ALTER TABLE public.farm_crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own farm crops"
  ON public.farm_crops FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.farms WHERE farms.id = farm_crops.farm_id AND farms.farmer_id = auth.uid()
  ));

CREATE POLICY "Farmers can insert own farm crops"
  ON public.farm_crops FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.farms WHERE farms.id = farm_crops.farm_id AND farms.farmer_id = auth.uid()
  ));

CREATE POLICY "Farmers can update own farm crops"
  ON public.farm_crops FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.farms WHERE farms.id = farm_crops.farm_id AND farms.farmer_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.farms WHERE farms.id = farm_crops.farm_id AND farms.farmer_id = auth.uid()
  ));

CREATE POLICY "Farmers can delete own farm crops"
  ON public.farm_crops FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.farms WHERE farms.id = farm_crops.farm_id AND farms.farmer_id = auth.uid()
  ));
