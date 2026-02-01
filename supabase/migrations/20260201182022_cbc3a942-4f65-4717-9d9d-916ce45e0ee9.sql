-- Create enums for the disease diagnosis system
CREATE TYPE public.diagnosis_case_status AS ENUM ('new', 'ai_suggested', 'expert_pending', 'expert_answered', 'closed');
CREATE TYPE public.diagnosis_source_type AS ENUM ('rule_engine', 'ai_model', 'human_expert');
CREATE TYPE public.diagnosis_angle_type AS ENUM ('leaf_closeup', 'plant_full', 'fruit', 'stem', 'other');

-- Create diagnosis_cases table
CREATE TABLE public.diagnosis_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  crop_id INTEGER REFERENCES public.crops(id) ON DELETE SET NULL,
  case_status public.diagnosis_case_status NOT NULL DEFAULT 'new',
  farmer_question TEXT,
  location_province_id INTEGER REFERENCES public.provinces(id) ON DELETE SET NULL,
  location_district_id INTEGER REFERENCES public.districts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create diagnosis_case_images table
CREATE TABLE public.diagnosis_case_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.diagnosis_cases(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  angle_type public.diagnosis_angle_type DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create diagnosis_suggestions table
CREATE TABLE public.diagnosis_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.diagnosis_cases(id) ON DELETE CASCADE,
  source_type public.diagnosis_source_type NOT NULL,
  suspected_problem TEXT,
  confidence_level INTEGER CHECK (confidence_level >= 0 AND confidence_level <= 100),
  advice_text TEXT,
  language_code TEXT DEFAULT 'ne',
  created_by_expert_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_final BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.diagnosis_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_case_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diagnosis_cases
CREATE POLICY "Users can view their own cases"
  ON public.diagnosis_cases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cases"
  ON public.diagnosis_cases FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all cases"
  ON public.diagnosis_cases FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all cases"
  ON public.diagnosis_cases FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert cases"
  ON public.diagnosis_cases FOR INSERT
  WITH CHECK (true);

-- RLS Policies for diagnosis_case_images
CREATE POLICY "Users can view images for their cases"
  ON public.diagnosis_case_images FOR SELECT
  USING (case_id IN (SELECT id FROM public.diagnosis_cases WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can insert case images"
  ON public.diagnosis_case_images FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all case images"
  ON public.diagnosis_case_images FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for diagnosis_suggestions
CREATE POLICY "Users can view suggestions for their cases"
  ON public.diagnosis_suggestions FOR SELECT
  USING (case_id IN (SELECT id FROM public.diagnosis_cases WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all suggestions"
  ON public.diagnosis_suggestions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert suggestions"
  ON public.diagnosis_suggestions FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_diagnosis_cases_status ON public.diagnosis_cases(case_status);
CREATE INDEX idx_diagnosis_cases_user ON public.diagnosis_cases(user_id);
CREATE INDEX idx_diagnosis_cases_created ON public.diagnosis_cases(created_at DESC);
CREATE INDEX idx_diagnosis_case_images_case ON public.diagnosis_case_images(case_id);
CREATE INDEX idx_diagnosis_suggestions_case ON public.diagnosis_suggestions(case_id);

-- Add trigger for updated_at
CREATE TRIGGER update_diagnosis_cases_updated_at
  BEFORE UPDATE ON public.diagnosis_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();