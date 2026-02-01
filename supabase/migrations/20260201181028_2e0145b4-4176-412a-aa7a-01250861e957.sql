-- Create enum types for feedback
CREATE TYPE public.feedback_type AS ENUM (
  'price_accuracy',
  'guide_usefulness', 
  'app_experience',
  'bug_report',
  'feature_request'
);

CREATE TYPE public.feedback_target_type AS ENUM (
  'market_price',
  'guide',
  'screen',
  'feature',
  'app',
  'other'
);

CREATE TYPE public.feedback_status AS ENUM (
  'pending',
  'seen',
  'in_progress',
  'resolved',
  'dismissed'
);

-- Create user_feedback table
CREATE TABLE public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feedback_type public.feedback_type NOT NULL,
  target_type public.feedback_target_type NOT NULL,
  target_id TEXT NULL,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  comment_text TEXT,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  status public.feedback_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for common queries
CREATE INDEX idx_user_feedback_type ON public.user_feedback(feedback_type);
CREATE INDEX idx_user_feedback_target ON public.user_feedback(target_type, target_id);
CREATE INDEX idx_user_feedback_rating ON public.user_feedback(rating);
CREATE INDEX idx_user_feedback_status ON public.user_feedback(status);
CREATE INDEX idx_user_feedback_created ON public.user_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can insert feedback (even anonymous)
CREATE POLICY "Anyone can submit feedback"
ON public.user_feedback
FOR INSERT
WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.user_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.user_feedback
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update feedback status
CREATE POLICY "Admins can update feedback"
ON public.user_feedback
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete feedback
CREATE POLICY "Admins can delete feedback"
ON public.user_feedback
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_user_feedback_updated_at
BEFORE UPDATE ON public.user_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();