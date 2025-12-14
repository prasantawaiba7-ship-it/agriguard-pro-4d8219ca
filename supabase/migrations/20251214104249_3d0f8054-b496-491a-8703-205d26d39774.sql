-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'farmer', 'field_official', 'authority', 'insurer');

-- Create user roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create farmer profiles table
CREATE TABLE public.farmer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  village TEXT,
  district TEXT,
  state TEXT,
  pmfby_enrollment_id TEXT,
  land_record_id TEXT,
  preferred_language TEXT DEFAULT 'en',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on farmer_profiles
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;

-- Create crop types enum
CREATE TYPE public.crop_type AS ENUM ('wheat', 'rice', 'cotton', 'sugarcane', 'maize', 'soybean', 'groundnut', 'mustard', 'other');

-- Create crop stage enum
CREATE TYPE public.crop_stage AS ENUM ('sowing', 'early_vegetative', 'vegetative', 'flowering', 'grain_filling', 'maturity', 'harvest');

-- Create plots table
CREATE TABLE public.plots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmer_profiles(id) ON DELETE CASCADE NOT NULL,
  plot_name TEXT NOT NULL,
  crop_type crop_type NOT NULL,
  area_hectares DECIMAL(10, 2),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  village TEXT,
  district TEXT,
  state TEXT,
  season TEXT,
  sowing_date DATE,
  expected_harvest_date DATE,
  pmfby_insured BOOLEAN DEFAULT false,
  insurance_sum DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on plots
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;

-- Create health status enum
CREATE TYPE public.health_status AS ENUM ('healthy', 'mild_stress', 'moderate_stress', 'severe_damage', 'pending');

-- Create crop photos table
CREATE TABLE public.crop_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id UUID REFERENCES public.plots(id) ON DELETE CASCADE NOT NULL,
  farmer_id UUID REFERENCES public.farmer_profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  capture_stage crop_stage NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  is_synced BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on crop_photos
ALTER TABLE public.crop_photos ENABLE ROW LEVEL SECURITY;

-- Create damage types enum
CREATE TYPE public.damage_type AS ENUM ('waterlogging', 'drought', 'lodging', 'pest', 'disease', 'hail', 'frost', 'other', 'none');

-- Create AI analysis results table
CREATE TABLE public.ai_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES public.crop_photos(id) ON DELETE CASCADE NOT NULL UNIQUE,
  detected_crop_type crop_type,
  detected_stage crop_stage,
  health_status health_status NOT NULL DEFAULT 'pending',
  health_score DECIMAL(3, 2) CHECK (health_score >= 0 AND health_score <= 1),
  damage_type damage_type DEFAULT 'none',
  damage_severity DECIMAL(3, 2) CHECK (damage_severity >= 0 AND damage_severity <= 1),
  confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  quality_passed BOOLEAN DEFAULT true,
  quality_issues TEXT[],
  gps_validated BOOLEAN DEFAULT false,
  recommendations TEXT[],
  raw_response JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ai_analysis_results
ALTER TABLE public.ai_analysis_results ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_farmer_profiles_updated_at
  BEFORE UPDATE ON public.farmer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plots_updated_at
  BEFORE UPDATE ON public.plots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for farmer_profiles
CREATE POLICY "Farmers can view their own profile"
  ON public.farmer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Farmers can insert their own profile"
  ON public.farmer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Farmers can update their own profile"
  ON public.farmer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authorities can view all profiles"
  ON public.farmer_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'authority') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for plots
CREATE POLICY "Farmers can view their own plots"
  ON public.plots FOR SELECT
  USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Farmers can insert their own plots"
  ON public.plots FOR INSERT
  WITH CHECK (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Farmers can update their own plots"
  ON public.plots FOR UPDATE
  USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Farmers can delete their own plots"
  ON public.plots FOR DELETE
  USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authorities can view all plots"
  ON public.plots FOR SELECT
  USING (public.has_role(auth.uid(), 'authority') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for crop_photos
CREATE POLICY "Farmers can view their own photos"
  ON public.crop_photos FOR SELECT
  USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Farmers can insert their own photos"
  ON public.crop_photos FOR INSERT
  WITH CHECK (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authorities can view all photos"
  ON public.crop_photos FOR SELECT
  USING (public.has_role(auth.uid(), 'authority') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ai_analysis_results
CREATE POLICY "Users can view analysis for their photos"
  ON public.ai_analysis_results FOR SELECT
  USING (photo_id IN (
    SELECT cp.id FROM public.crop_photos cp
    JOIN public.farmer_profiles fp ON cp.farmer_id = fp.id
    WHERE fp.user_id = auth.uid()
  ));

CREATE POLICY "Authorities can view all analysis results"
  ON public.ai_analysis_results FOR SELECT
  USING (public.has_role(auth.uid(), 'authority') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert analysis results"
  ON public.ai_analysis_results FOR INSERT
  WITH CHECK (true);

-- Create storage bucket for crop photos
INSERT INTO storage.buckets (id, name, public) VALUES ('crop-photos', 'crop-photos', true);

-- Storage policies for crop photos
CREATE POLICY "Anyone can view crop photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'crop-photos');

CREATE POLICY "Authenticated users can upload crop photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'crop-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own crop photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'crop-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own crop photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'crop-photos' AND auth.uid()::text = (storage.foldername(name))[1]);