
-- Learning levels for farmers (beginner, intermediate, advanced)
CREATE TABLE public.learning_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title_ne text NOT NULL,
  description_ne text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Training documents (PDF manuals for reference)
CREATE TABLE public.training_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_ne text,
  source_org text,
  language text DEFAULT 'ne',
  file_url text NOT NULL,
  uploaded_by_admin_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Courses
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid REFERENCES public.learning_levels(id) ON DELETE SET NULL,
  title_ne text NOT NULL,
  description_ne text,
  thumbnail_url text,
  target_crop_id integer REFERENCES public.crops(id) ON DELETE SET NULL,
  estimated_duration_min integer DEFAULT 30,
  is_published boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Course modules
CREATE TABLE public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title_ne text NOT NULL,
  description_ne text,
  order_index integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Lessons
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE NOT NULL,
  title_ne text NOT NULL,
  content_ne text,
  content_type text DEFAULT 'text' CHECK (content_type IN ('text', 'video', 'audio', 'mixed')),
  media_url text,
  order_index integer DEFAULT 0,
  estimated_duration_min integer DEFAULT 5,
  is_published boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Lesson quizzes
CREATE TABLE public.lesson_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL UNIQUE,
  pass_score integer DEFAULT 60,
  max_attempts integer,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Quiz questions
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES public.lesson_quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text_ne text NOT NULL,
  question_type text DEFAULT 'mcq_single' CHECK (question_type IN ('mcq_single', 'true_false')),
  order_index integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Quiz options
CREATE TABLE public.quiz_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.quiz_questions(id) ON DELETE CASCADE NOT NULL,
  option_text_ne text NOT NULL,
  is_correct boolean DEFAULT false,
  order_index integer DEFAULT 0
);

-- Quiz attempts
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES public.lesson_quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  attempt_number integer DEFAULT 1,
  score integer DEFAULT 0,
  total_questions integer DEFAULT 0,
  is_passed boolean DEFAULT false,
  answers_json jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- User course progress
CREATE TABLE public.user_course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  is_completed boolean DEFAULT false,
  UNIQUE(user_id, course_id)
);

-- User lesson status
CREATE TABLE public.user_lesson_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  UNIQUE(user_id, lesson_id)
);

-- Certificate templates (admin-editable)
CREATE TABLE public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT 'default_course_certificate',
  title_ne text NOT NULL DEFAULT 'किसान साथी',
  subtitle_ne text DEFAULT 'प्रशिक्षण प्रमाणपत्र',
  body_text_ne text DEFAULT 'यो प्रमाणित गरिन्छ कि [farmer_name] ले [course_title] ([level_name]) कोर्स सफलतापूर्वक पूरा गर्नुभयो।',
  footer_ne text DEFAULT 'किसान साथी टीम',
  background_image_url text,
  signature_image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User certificates
CREATE TABLE public.user_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  template_id uuid REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  certificate_number text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  file_url text,
  meta_json jsonb,
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.learning_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_levels
CREATE POLICY "Anyone can view active learning levels" ON public.learning_levels FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage learning levels" ON public.learning_levels FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for training_documents
CREATE POLICY "Admins can manage training documents" ON public.training_documents FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view training documents" ON public.training_documents FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for courses
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for course_modules
CREATE POLICY "Anyone can view modules of published courses" ON public.course_modules FOR SELECT USING (
  course_id IN (SELECT id FROM public.courses WHERE is_published = true)
);
CREATE POLICY "Admins can manage course modules" ON public.course_modules FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for lessons
CREATE POLICY "Anyone can view published lessons" ON public.lessons FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for lesson_quizzes
CREATE POLICY "Anyone can view active quizzes" ON public.lesson_quizzes FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage quizzes" ON public.lesson_quizzes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for quiz_questions
CREATE POLICY "Anyone can view quiz questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage quiz questions" ON public.quiz_questions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for quiz_options
CREATE POLICY "Anyone can view quiz options" ON public.quiz_options FOR SELECT USING (true);
CREATE POLICY "Admins can manage quiz options" ON public.quiz_options FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for quiz_attempts
CREATE POLICY "Users can view their own attempts" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own attempts" ON public.quiz_attempts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all attempts" ON public.quiz_attempts FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_course_progress
CREATE POLICY "Users can view their own progress" ON public.user_course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own progress" ON public.user_course_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.user_course_progress FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_lesson_status
CREATE POLICY "Users can view their own lesson status" ON public.user_lesson_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own lesson status" ON public.user_lesson_status FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all lesson status" ON public.user_lesson_status FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for certificate_templates
CREATE POLICY "Anyone can view active templates" ON public.certificate_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage certificate templates" ON public.certificate_templates FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_certificates
CREATE POLICY "Users can view their own certificates" ON public.user_certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert certificates" ON public.user_certificates FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all certificates" ON public.user_certificates FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Insert default learning levels
INSERT INTO public.learning_levels (code, title_ne, description_ne, display_order) VALUES
('beginner', 'सुरुआती किसान', 'खेतीको आधारभूत ज्ञान सिक्नुहोस्', 1),
('intermediate', 'मध्यम स्तर किसान', 'उन्नत प्रविधि र व्यवस्थापन सिक्नुहोस्', 2),
('advanced', 'उन्नत किसान', 'विशेषज्ञ स्तरको ज्ञान र अभ्यास', 3);

-- Insert default certificate template
INSERT INTO public.certificate_templates (code, title_ne, subtitle_ne, body_text_ne, footer_ne) VALUES
('default_course_certificate', 'किसान साथी', 'प्रशिक्षण प्रमाणपत्र', 
'यो प्रमाणित गरिन्छ कि [farmer_name] ले [course_title] ([level_name]) कोर्स सफलतापूर्वक पूरा गर्नुभयो।',
'किसान साथी टीम');

-- Add updated_at trigger for courses
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for certificate_templates
CREATE TRIGGER update_certificate_templates_updated_at
BEFORE UPDATE ON public.certificate_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
