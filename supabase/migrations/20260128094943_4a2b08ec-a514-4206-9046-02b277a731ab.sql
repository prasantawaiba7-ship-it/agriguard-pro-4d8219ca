-- Add is_major field to districts for prioritization
ALTER TABLE public.districts 
ADD COLUMN IF NOT EXISTS is_major boolean DEFAULT false;

-- Add is_major field to markets for wholesale/main markets
ALTER TABLE public.markets 
ADD COLUMN IF NOT EXISTS is_major boolean DEFAULT false;

-- Add source_ref field to daily_market_products for external reference tracking
ALTER TABLE public.daily_market_products 
ADD COLUMN IF NOT EXISTS source_ref text;

-- Add last_synced_at for tracking sync times
ALTER TABLE public.daily_market_products 
ADD COLUMN IF NOT EXISTS last_synced_at timestamptz DEFAULT now();

-- Create index for faster Nepal-wide comparison queries
CREATE INDEX IF NOT EXISTS idx_daily_market_products_crop_date 
ON public.daily_market_products(crop_id, date);

CREATE INDEX IF NOT EXISTS idx_daily_market_products_date_market 
ON public.daily_market_products(date, district_id_fk);

-- Update some major districts (can be adjusted by admin later)
UPDATE public.districts SET is_major = true 
WHERE name_en IN ('Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kaski', 'Chitwan', 'Morang', 'Jhapa', 'Rupandehi', 'Banke', 'Kailali', 'Sunsari', 'Parsa');

-- Update major markets
UPDATE public.markets SET is_major = true 
WHERE market_code IN ('KALIMATI', 'BIRATNAGAR', 'POKHARA', 'BUTWAL', 'NEPALGUNJ', 'DHANGADHI', 'BIRGUNJ', 'ITAHARI');