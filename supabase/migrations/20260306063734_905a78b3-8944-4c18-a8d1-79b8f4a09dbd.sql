
ALTER TABLE public.call_requests 
ADD COLUMN IF NOT EXISTS scheduled_window text,
ADD COLUMN IF NOT EXISTS decline_reason text,
ADD COLUMN IF NOT EXISTS decline_note text;
