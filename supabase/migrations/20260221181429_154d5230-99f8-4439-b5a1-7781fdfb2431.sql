
-- Add structured fields to diagnosis_cases for proper ticket management
ALTER TABLE public.diagnosis_cases
  ADD COLUMN IF NOT EXISTS problem_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS channel text DEFAULT 'APP',
  ADD COLUMN IF NOT EXISTS assigned_expert_id uuid DEFAULT NULL;

-- Add foreign key for assigned expert
ALTER TABLE public.diagnosis_cases
  ADD CONSTRAINT diagnosis_cases_assigned_expert_id_fkey
  FOREIGN KEY (assigned_expert_id) REFERENCES public.agricultural_officers(id)
  ON DELETE SET NULL;

-- Create index for common filters
CREATE INDEX IF NOT EXISTS idx_diagnosis_cases_priority ON public.diagnosis_cases(priority);
CREATE INDEX IF NOT EXISTS idx_diagnosis_cases_problem_type ON public.diagnosis_cases(problem_type);
CREATE INDEX IF NOT EXISTS idx_diagnosis_cases_channel ON public.diagnosis_cases(channel);
CREATE INDEX IF NOT EXISTS idx_diagnosis_cases_assigned_expert ON public.diagnosis_cases(assigned_expert_id);
