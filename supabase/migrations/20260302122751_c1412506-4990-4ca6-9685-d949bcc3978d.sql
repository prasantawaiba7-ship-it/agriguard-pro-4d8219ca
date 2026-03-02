
-- Create expert_templates table
CREATE TABLE public.expert_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop text NOT NULL,
  disease text NOT NULL,
  language text NOT NULL DEFAULT 'ne',
  title text NOT NULL,
  body text NOT NULL,
  tags text[] DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE TRIGGER set_expert_templates_updated_at
  BEFORE UPDATE ON public.expert_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.expert_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: admin or active expert technicians
CREATE POLICY "Experts and admins can read templates"
  ON public.expert_templates FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.technicians
      WHERE user_id = auth.uid() AND is_active = true AND is_expert = true
    )
  );

-- INSERT/UPDATE/DELETE: admin only
CREATE POLICY "Admins can insert templates"
  ON public.expert_templates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update templates"
  ON public.expert_templates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete templates"
  ON public.expert_templates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
