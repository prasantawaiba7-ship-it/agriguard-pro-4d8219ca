-- Add farming details fields to farmer_profiles
ALTER TABLE public.farmer_profiles
ADD COLUMN IF NOT EXISTS main_crops text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS land_size_hectares numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS irrigation_type text DEFAULT NULL;