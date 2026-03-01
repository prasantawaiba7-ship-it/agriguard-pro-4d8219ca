
-- Allow expert_tickets.technician_id to be NULL (admin triage flow)
ALTER TABLE public.expert_tickets ALTER COLUMN technician_id DROP NOT NULL;

-- Set default for has_unread_technician to false (admin assigns later)
ALTER TABLE public.expert_tickets ALTER COLUMN has_unread_technician SET DEFAULT false;
