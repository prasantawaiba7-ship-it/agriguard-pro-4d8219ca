
-- Add user_id and is_primary columns to technicians table
ALTER TABLE public.technicians
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;
