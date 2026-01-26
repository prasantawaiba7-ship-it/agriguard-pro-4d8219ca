-- Create provinces table
CREATE TABLE public.provinces (
  id SERIAL PRIMARY KEY,
  name_ne TEXT NOT NULL,
  name_en TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create districts table
CREATE TABLE public.districts (
  id SERIAL PRIMARY KEY,
  province_id INTEGER NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  name_ne TEXT NOT NULL,
  name_en TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create local_levels table (municipality / rural municipality / metropolitan etc.)
CREATE TYPE public.local_level_type AS ENUM ('metropolitan', 'sub_metropolitan', 'municipality', 'rural_municipality');

CREATE TABLE public.local_levels (
  id SERIAL PRIMARY KEY,
  district_id INTEGER NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name_ne TEXT NOT NULL,
  name_en TEXT NOT NULL,
  type public.local_level_type NOT NULL DEFAULT 'municipality',
  total_wards INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wards table
CREATE TABLE public.wards (
  id SERIAL PRIMARY KEY,
  local_level_id INTEGER NOT NULL REFERENCES public.local_levels(id) ON DELETE CASCADE,
  ward_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(local_level_id, ward_number)
);

-- Create crops master table
CREATE TABLE public.crops (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ne TEXT NOT NULL,
  category TEXT DEFAULT 'vegetable',
  image_url TEXT,
  unit TEXT DEFAULT 'kg',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add trigger for updated_at on crops
CREATE TRIGGER update_crops_updated_at
  BEFORE UPDATE ON public.crops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Modify daily_market_products to use foreign keys
ALTER TABLE public.daily_market_products
  ADD COLUMN IF NOT EXISTS province_id INTEGER REFERENCES public.provinces(id),
  ADD COLUMN IF NOT EXISTS district_id_fk INTEGER REFERENCES public.districts(id),
  ADD COLUMN IF NOT EXISTS local_level_id INTEGER REFERENCES public.local_levels(id),
  ADD COLUMN IF NOT EXISTS ward_number INTEGER,
  ADD COLUMN IF NOT EXISTS crop_id INTEGER REFERENCES public.crops(id);

-- Create indexes for performance
CREATE INDEX idx_districts_province ON public.districts(province_id);
CREATE INDEX idx_local_levels_district ON public.local_levels(district_id);
CREATE INDEX idx_wards_local_level ON public.wards(local_level_id);
CREATE INDEX idx_daily_market_district ON public.daily_market_products(district_id_fk);
CREATE INDEX idx_daily_market_local_level ON public.daily_market_products(local_level_id);
CREATE INDEX idx_daily_market_crop ON public.daily_market_products(crop_id);

-- Enable RLS on new tables
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;

-- RLS policies for provinces (public read, admin write)
CREATE POLICY "Anyone can view provinces" ON public.provinces FOR SELECT USING (true);
CREATE POLICY "Admins can manage provinces" ON public.provinces FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS policies for districts (public read, admin write)
CREATE POLICY "Anyone can view districts" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Admins can manage districts" ON public.districts FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS policies for local_levels (public read, admin write)
CREATE POLICY "Anyone can view local_levels" ON public.local_levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage local_levels" ON public.local_levels FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS policies for wards (public read, admin write)
CREATE POLICY "Anyone can view wards" ON public.wards FOR SELECT USING (true);
CREATE POLICY "Admins can manage wards" ON public.wards FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS policies for crops (public read active, admin write)
CREATE POLICY "Anyone can view active crops" ON public.crops FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage crops" ON public.crops FOR ALL USING (has_role(auth.uid(), 'admin'));