
-- Add expert-specific fields to agricultural_officers table
ALTER TABLE public.agricultural_officers 
  ADD COLUMN IF NOT EXISTS max_open_cases integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS channel_access text[] DEFAULT '{APP}'::text[],
  ADD COLUMN IF NOT EXISTS expertise_areas text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS years_of_experience integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preferred_languages text[] DEFAULT '{नेपाली}'::text[],
  ADD COLUMN IF NOT EXISTS permission_level text DEFAULT 'expert',
  ADD COLUMN IF NOT EXISTS priority_types text[] DEFAULT '{NORMAL}'::text[],
  ADD COLUMN IF NOT EXISTS open_cases_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT NULL;
