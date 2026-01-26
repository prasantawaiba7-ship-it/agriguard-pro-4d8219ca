-- Create crop_seasons table to track crops planted in fields
CREATE TABLE public.crop_seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  crop_name TEXT NOT NULL,
  variety TEXT,
  season_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  season_end_date DATE,
  expected_yield NUMERIC,
  actual_yield NUMERIC,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crop_seasons ENABLE ROW LEVEL SECURITY;

-- RLS policies for crop_seasons
CREATE POLICY "Users can view their own crop seasons"
ON public.crop_seasons FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own crop seasons"
ON public.crop_seasons FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crop seasons"
ON public.crop_seasons FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own crop seasons"
ON public.crop_seasons FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all crop seasons"
ON public.crop_seasons FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Index for performance
CREATE INDEX idx_crop_seasons_field_id ON public.crop_seasons(field_id);
CREATE INDEX idx_crop_seasons_user_id ON public.crop_seasons(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_crop_seasons_updated_at
BEFORE UPDATE ON public.crop_seasons
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create weather_alerts table to track sent alerts
CREATE TABLE public.weather_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  date_sent TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for weather_alerts
CREATE POLICY "Users can view their own weather alerts"
ON public.weather_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own weather alerts"
ON public.weather_alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert weather alerts"
ON public.weather_alerts FOR INSERT
WITH CHECK (true);

-- Index for performance
CREATE INDEX idx_weather_alerts_user_id ON public.weather_alerts(user_id);
CREATE INDEX idx_weather_alerts_date_sent ON public.weather_alerts(date_sent DESC);

-- Update crop_activities to link to crop_seasons (add column)
ALTER TABLE public.crop_activities 
ADD COLUMN IF NOT EXISTS crop_season_id UUID REFERENCES public.crop_seasons(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_crop_activities_crop_season_id ON public.crop_activities(crop_season_id);