-- Create markets table for storing market locations
CREATE TABLE public.markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ne text NOT NULL,
  province_id integer REFERENCES public.provinces(id),
  district_id integer REFERENCES public.districts(id),
  local_level_id integer REFERENCES public.local_levels(id),
  ward_number integer,
  latitude numeric,
  longitude numeric,
  market_type text NOT NULL DEFAULT 'retail' CHECK (market_type IN ('wholesale', 'retail', 'cooperative', 'haat')),
  contact_phone text,
  contact_whatsapp text,
  popular_products text[],
  address text,
  address_ne text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

-- Anyone can view active markets
CREATE POLICY "Anyone can view active markets"
ON public.markets
FOR SELECT
USING (is_active = true);

-- Admins can manage markets
CREATE POLICY "Admins can manage markets"
ON public.markets
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_markets_updated_at
  BEFORE UPDATE ON public.markets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for location-based queries
CREATE INDEX idx_markets_location ON public.markets(province_id, district_id, local_level_id);
CREATE INDEX idx_markets_coordinates ON public.markets(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Insert sample markets for testing
INSERT INTO public.markets (name_en, name_ne, province_id, district_id, market_type, latitude, longitude, popular_products, address_ne) VALUES
('Kalimati Wholesale Market', 'कालिमाटी थोक बजार', 3, NULL, 'wholesale', 27.6990, 85.2850, ARRAY['Tomato', 'Potato', 'Onion', 'Cabbage'], 'काठमाण्डौ'),
('Balkhu Haat Bazaar', 'बल्खु हाट बजार', 3, NULL, 'haat', 27.6850, 85.2970, ARRAY['Vegetables', 'Fruits'], 'काठमाण्डौ'),
('Dharan Market', 'धरान बजार', 1, NULL, 'retail', 26.8124, 87.2839, ARRAY['Ginger', 'Cardamom', 'Vegetables'], 'धरान'),
('Pokhara Sabji Mandi', 'पोखरा सब्जी मण्डी', 4, NULL, 'wholesale', 28.2096, 83.9856, ARRAY['Vegetables', 'Fruits', 'Spices'], 'पोखरा'),
('Biratnagar Haat', 'विराटनगर हाट', 1, NULL, 'haat', 26.4547, 87.2718, ARRAY['Rice', 'Vegetables', 'Fish'], 'विराटनगर');