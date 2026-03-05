
-- Stage-wise crop advisory content table
CREATE TABLE public.crop_stage_advisories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name text NOT NULL,
  crop_name_ne text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('nursery', 'early_growth', 'mid_growth', 'pre_harvest', 'post_harvest')),
  stage_name_ne text NOT NULL,
  risks jsonb NOT NULL DEFAULT '[]',
  safe_practices jsonb NOT NULL DEFAULT '[]',
  red_lines jsonb NOT NULL DEFAULT '[]',
  warning_signs jsonb NOT NULL DEFAULT '[]',
  referral_message text,
  referral_message_ne text,
  season_applicability text[] DEFAULT ARRAY['Winter','Summer','Monsoon','Autumn'],
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  reviewed_at timestamptz,
  reviewed_by text,
  deprecated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(crop_name, stage, version)
);

-- Enable RLS
ALTER TABLE public.crop_stage_advisories ENABLE ROW LEVEL SECURITY;

-- Public read access (advisory content is public)
CREATE POLICY "Anyone can read active advisories"
  ON public.crop_stage_advisories FOR SELECT
  USING (is_active = true AND deprecated_at IS NULL);

-- Admin write access
CREATE POLICY "Admins can manage advisories"
  ON public.crop_stage_advisories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamp
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.crop_stage_advisories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- AI red lines table for global + per-crop guardrails
CREATE TABLE public.ai_safety_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type text NOT NULL CHECK (rule_type IN ('red_line', 'guardrail', 'disclaimer', 'referral')),
  scope text NOT NULL DEFAULT 'global',
  crop_name text,
  rule_text text NOT NULL,
  rule_text_ne text,
  severity text NOT NULL DEFAULT 'critical' CHECK (severity IN ('critical', 'high', 'medium')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_safety_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active safety rules"
  ON public.ai_safety_rules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage safety rules"
  ON public.ai_safety_rules FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER handle_safety_rules_updated_at
  BEFORE UPDATE ON public.ai_safety_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
