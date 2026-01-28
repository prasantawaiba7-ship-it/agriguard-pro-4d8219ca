-- Create condition type enum for price alerts
CREATE TYPE public.price_alert_condition AS ENUM ('greater_equal', 'less_equal', 'percent_increase', 'percent_decrease');

-- Create price_alerts table for user-defined alert rules
CREATE TABLE public.price_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  crop_id INTEGER REFERENCES public.crops(id) ON DELETE CASCADE,
  market_code TEXT, -- optional: specific market
  province_id INTEGER REFERENCES public.provinces(id),
  district_id INTEGER REFERENCES public.districts(id),
  local_level_id INTEGER REFERENCES public.local_levels(id),
  condition_type public.price_alert_condition NOT NULL,
  threshold_value NUMERIC NOT NULL, -- price threshold or percent value
  percent_reference_days INTEGER DEFAULT 7, -- for percent change conditions
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for price_alerts
CREATE POLICY "Users can view their own price alerts"
ON public.price_alerts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own price alerts"
ON public.price_alerts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price alerts"
ON public.price_alerts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price alerts"
ON public.price_alerts
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all alerts
CREATE POLICY "Admins can view all price alerts"
ON public.price_alerts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_price_alerts_updated_at
BEFORE UPDATE ON public.price_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add market_code column to markets table if not exists (for compatibility)
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS market_code TEXT;

-- Create unique constraint for market_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_markets_market_code ON public.markets(market_code) WHERE market_code IS NOT NULL;

-- Update existing markets with market_code based on name_en
UPDATE public.markets 
SET market_code = UPPER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_'))
WHERE market_code IS NULL;