-- Add region_group to crops table if not exists
ALTER TABLE public.crops ADD COLUMN IF NOT EXISTS region_group text DEFAULT 'all';

-- Create crop_local_names table if not exists
CREATE TABLE IF NOT EXISTS public.crop_local_names (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id integer REFERENCES public.crops(id) ON DELETE CASCADE NOT NULL,
  local_name text NOT NULL,
  region_group text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on crop_local_names
ALTER TABLE public.crop_local_names ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view crop local names" ON public.crop_local_names;
DROP POLICY IF EXISTS "Admins can manage crop local names" ON public.crop_local_names;

-- Anyone can view local names
CREATE POLICY "Anyone can view crop local names"
  ON public.crop_local_names FOR SELECT
  USING (true);

-- Admins can manage local names
CREATE POLICY "Admins can manage crop local names"
  ON public.crop_local_names FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_crops_region_group ON public.crops(region_group);
CREATE INDEX IF NOT EXISTS idx_crop_local_names_crop_id ON public.crop_local_names(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_local_names_region ON public.crop_local_names(region_group);