-- Create fields table (separate from plots for farm management)
CREATE TABLE public.fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area NUMERIC,
  area_unit TEXT NOT NULL DEFAULT 'ropani' CHECK (area_unit IN ('ropani', 'katha', 'hectare', 'bigha')),
  district TEXT,
  municipality TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create soil_tests table for NPK advisory
CREATE TABLE public.soil_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sample_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ph NUMERIC CHECK (ph >= 0 AND ph <= 14),
  nitrogen_level NUMERIC CHECK (nitrogen_level >= 0),
  phosphorus_level NUMERIC CHECK (phosphorus_level >= 0),
  potassium_level NUMERIC CHECK (potassium_level >= 0),
  organic_matter_percent NUMERIC CHECK (organic_matter_percent >= 0 AND organic_matter_percent <= 100),
  ec NUMERIC,
  lab_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on fields
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fields"
  ON public.fields FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fields"
  ON public.fields FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fields"
  ON public.fields FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fields"
  ON public.fields FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all fields"
  ON public.fields FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Enable RLS on soil_tests
ALTER TABLE public.soil_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own soil tests"
  ON public.soil_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own soil tests"
  ON public.soil_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own soil tests"
  ON public.soil_tests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own soil tests"
  ON public.soil_tests FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all soil tests"
  ON public.soil_tests FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Create trigger for fields updated_at
CREATE TRIGGER update_fields_updated_at
  BEFORE UPDATE ON public.fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_fields_user_id ON public.fields(user_id);
CREATE INDEX idx_soil_tests_field_id ON public.soil_tests(field_id);
CREATE INDEX idx_soil_tests_user_id ON public.soil_tests(user_id);