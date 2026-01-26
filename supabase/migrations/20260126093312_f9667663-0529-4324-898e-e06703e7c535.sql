-- Create table for daily market products with photos and prices
CREATE TABLE public.daily_market_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  crop_name TEXT NOT NULL,
  crop_name_ne TEXT,
  image_url TEXT,
  unit TEXT NOT NULL DEFAULT 'kg',
  price_min NUMERIC,
  price_max NUMERIC,
  price_avg NUMERIC,
  market_name TEXT DEFAULT 'Kalimati',
  market_name_ne TEXT DEFAULT 'कालिमाटी',
  district TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, crop_name, market_name)
);

-- Enable RLS
ALTER TABLE public.daily_market_products ENABLE ROW LEVEL SECURITY;

-- Anyone can view daily market products
CREATE POLICY "Anyone can view daily market products"
ON public.daily_market_products
FOR SELECT
USING (true);

-- Admins can manage daily market products
CREATE POLICY "Admins can manage daily market products"
ON public.daily_market_products
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert/update daily market products
CREATE POLICY "System can insert daily market products"
ON public.daily_market_products
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update daily market products"
ON public.daily_market_products
FOR UPDATE
USING (true);

-- Create index for faster queries
CREATE INDEX idx_daily_market_products_date ON public.daily_market_products(date DESC);
CREATE INDEX idx_daily_market_products_crop ON public.daily_market_products(crop_name);
CREATE INDEX idx_daily_market_products_district ON public.daily_market_products(district);

-- Add trigger for updated_at
CREATE TRIGGER update_daily_market_products_updated_at
BEFORE UPDATE ON public.daily_market_products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample data for today with common Nepal vegetables
INSERT INTO public.daily_market_products (date, crop_name, crop_name_ne, image_url, unit, price_min, price_max, price_avg, market_name, market_name_ne, district, source)
VALUES
  (CURRENT_DATE, 'Tomato', 'गोलभेडा', 'https://images.unsplash.com/photo-1546470427-227c7369a9b0?w=400', 'kg', 80, 120, 100, 'Kalimati', 'कालिमाटी', 'Kathmandu', 'sample'),
  (CURRENT_DATE, 'Potato', 'आलु', 'https://images.unsplash.com/photo-1518977676601-b53f82ber40a?w=400', 'kg', 40, 60, 50, 'Kalimati', 'कालिमाटी', 'Kathmandu', 'sample'),
  (CURRENT_DATE, 'Onion', 'प्याज', 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400', 'kg', 60, 90, 75, 'Kalimati', 'कालिमाटी', 'Kathmandu', 'sample'),
  (CURRENT_DATE, 'Cabbage', 'बन्दा', 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400', 'piece', 30, 50, 40, 'Kalimati', 'कालिमाटी', 'Kathmandu', 'sample'),
  (CURRENT_DATE, 'Cauliflower', 'काउली', 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400', 'piece', 40, 70, 55, 'Kalimati', 'कालिमाटी', 'Kathmandu', 'sample'),
  (CURRENT_DATE, 'Carrot', 'गाजर', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400', 'kg', 50, 80, 65, 'Kalimati', 'कालिमाटी', 'Kathmandu', 'sample'),
  (CURRENT_DATE, 'Green Beans', 'सिमी', 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=400', 'kg', 60, 100, 80, 'Kalimati', 'कालिमाटी', 'Kathmandu', 'sample'),
  (CURRENT_DATE, 'Cucumber', 'काँक्रो', 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400', 'kg', 40, 70, 55, 'Kalimati', 'कालिमाटी', 'Kathmandu', 'sample'),
  (CURRENT_DATE, 'Spinach', 'पालुङ्गो', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400', 'bundle', 20, 40, 30, 'Kalimati', 'कालिमाटी', 'Kathmandu', 'sample'),
  (CURRENT_DATE, 'Radish', 'मूला', 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400', 'kg', 30, 50, 40, 'Kalimati', 'कालिमाटी', 'Kathmandu', 'sample'),
  (CURRENT_DATE, 'Chili', 'खुर्सानी', 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400', 'kg', 100, 150, 125, 'Kalimati', 'कालिमाटी', 'Kathmandu', 'sample'),
  (CURRENT_DATE, 'Garlic', 'लसुन', 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400', 'kg', 200, 300, 250, 'Kalimati', 'कालिमाटी', 'Kathmandu', 'sample');