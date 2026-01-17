-- Create disease outbreak alerts table
CREATE TABLE public.disease_outbreak_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  disease_name TEXT NOT NULL,
  detection_count INTEGER NOT NULL DEFAULT 1,
  severity TEXT NOT NULL DEFAULT 'medium',
  first_detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  affected_crops TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create farmer notification preferences table
CREATE TABLE public.farmer_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmer_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  outbreak_alerts BOOLEAN NOT NULL DEFAULT true,
  weather_alerts BOOLEAN NOT NULL DEFAULT true,
  push_subscription JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table for storing sent notifications
CREATE TABLE public.farmer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmer_profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disease_outbreak_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disease_outbreak_alerts (public read, only system can write)
CREATE POLICY "Anyone can view outbreak alerts"
ON public.disease_outbreak_alerts
FOR SELECT
USING (true);

-- RLS Policies for farmer_notification_preferences
CREATE POLICY "Farmers can view their notification preferences"
ON public.farmer_notification_preferences
FOR SELECT
USING (farmer_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Farmers can insert their notification preferences"
ON public.farmer_notification_preferences
FOR INSERT
WITH CHECK (farmer_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Farmers can update their notification preferences"
ON public.farmer_notification_preferences
FOR UPDATE
USING (farmer_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()));

-- RLS Policies for farmer_notifications
CREATE POLICY "Farmers can view their notifications"
ON public.farmer_notifications
FOR SELECT
USING (farmer_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Farmers can update their notifications"
ON public.farmer_notifications
FOR UPDATE
USING (farmer_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_outbreak_alerts_location ON public.disease_outbreak_alerts(district, state);
CREATE INDEX idx_outbreak_alerts_active ON public.disease_outbreak_alerts(is_active) WHERE is_active = true;
CREATE INDEX idx_farmer_notifications_farmer ON public.farmer_notifications(farmer_id);
CREATE INDEX idx_farmer_notifications_unread ON public.farmer_notifications(farmer_id, read) WHERE read = false;

-- Trigger for updated_at
CREATE TRIGGER update_disease_outbreak_alerts_updated_at
BEFORE UPDATE ON public.disease_outbreak_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farmer_notification_preferences_updated_at
BEFORE UPDATE ON public.farmer_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();