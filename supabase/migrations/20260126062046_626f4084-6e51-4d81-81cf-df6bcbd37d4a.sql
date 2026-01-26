-- 1. Produce Listings table (बेच्ने सूची)
CREATE TABLE public.produce_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES public.farmer_profiles(id) ON DELETE SET NULL,
  crop_name TEXT NOT NULL,
  variety TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  expected_price NUMERIC,
  district TEXT,
  municipality TEXT,
  contact_phone TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.produce_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for produce_listings
CREATE POLICY "Anyone can view active listings"
  ON public.produce_listings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can insert their own listings"
  ON public.produce_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
  ON public.produce_listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
  ON public.produce_listings FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all listings"
  ON public.produce_listings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 2. Crop Activities table (खेती गतिविधि)
CREATE TABLE public.crop_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
  crop_name TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('sowing', 'fertilizer', 'spray', 'irrigation', 'weeding', 'harvest', 'other')),
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  cost_npr NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crop_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crop_activities
CREATE POLICY "Users can view their own activities"
  ON public.crop_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON public.crop_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON public.crop_activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
  ON public.crop_activities FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activities"
  ON public.crop_activities FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 3. Crop Guides table (कृषि ज्ञान)
CREATE TABLE public.crop_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_name TEXT NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('introduction', 'soil', 'sowing', 'fertilizer', 'irrigation', 'pests', 'diseases', 'harvest', 'storage', 'tips')),
  title TEXT NOT NULL,
  title_ne TEXT,
  content TEXT NOT NULL,
  content_ne TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crop_guides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crop_guides
CREATE POLICY "Anyone can view active guides"
  ON public.crop_guides FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all guides"
  ON public.crop_guides FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 4. Weather Alert Settings table (मौसम alert सेटिङ)
CREATE TABLE public.weather_alert_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enable_weather_alerts BOOLEAN NOT NULL DEFAULT true,
  enable_rain_alert BOOLEAN NOT NULL DEFAULT true,
  enable_spray_alert BOOLEAN NOT NULL DEFAULT true,
  enable_heat_alert BOOLEAN NOT NULL DEFAULT true,
  enable_cold_alert BOOLEAN NOT NULL DEFAULT false,
  preferred_time TEXT DEFAULT 'morning',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weather_alert_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weather_alert_settings
CREATE POLICY "Users can view their own settings"
  ON public.weather_alert_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.weather_alert_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.weather_alert_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_produce_listings_updated_at
  BEFORE UPDATE ON public.produce_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crop_guides_updated_at
  BEFORE UPDATE ON public.crop_guides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weather_alert_settings_updated_at
  BEFORE UPDATE ON public.weather_alert_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_produce_listings_user_id ON public.produce_listings(user_id);
CREATE INDEX idx_produce_listings_active ON public.produce_listings(is_active) WHERE is_active = true;
CREATE INDEX idx_crop_activities_user_id ON public.crop_activities(user_id);
CREATE INDEX idx_crop_activities_plot_id ON public.crop_activities(plot_id);
CREATE INDEX idx_crop_guides_crop_name ON public.crop_guides(crop_name);
CREATE INDEX idx_weather_alert_settings_user_id ON public.weather_alert_settings(user_id);