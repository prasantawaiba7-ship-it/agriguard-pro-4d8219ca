-- Create listing_views table to track how many times a listing was viewed
CREATE TABLE public.listing_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.produce_listings(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT
);

-- Create listing_contacts table to track call button clicks
CREATE TABLE public.listing_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.produce_listings(id) ON DELETE CASCADE,
  contactor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_type TEXT NOT NULL DEFAULT 'call',
  contacted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listing_views
CREATE POLICY "Anyone can insert views" ON public.listing_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Listing owners can view their stats" ON public.listing_views
  FOR SELECT USING (
    listing_id IN (
      SELECT id FROM public.produce_listings 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all stats" ON public.listing_views
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for listing_contacts  
CREATE POLICY "Anyone can insert contacts" ON public.listing_contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Listing owners can view their contact stats" ON public.listing_contacts
  FOR SELECT USING (
    listing_id IN (
      SELECT id FROM public.produce_listings 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all contact stats" ON public.listing_contacts
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Add image_urls column to produce_listings
ALTER TABLE public.produce_listings 
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX idx_listing_views_listing_id ON public.listing_views(listing_id);
CREATE INDEX idx_listing_contacts_listing_id ON public.listing_contacts(listing_id);
CREATE INDEX idx_market_prices_crop_district ON public.market_prices(crop_type, district);