-- =============================================
-- KISAN SATHI: User Market Cards & Delivery System
-- =============================================

-- 1. Create user_market_cards table (user-posted veggie cards)
CREATE TABLE public.user_market_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    crop_id INTEGER REFERENCES public.crops(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    card_type TEXT NOT NULL DEFAULT 'sell' CHECK (card_type IN ('sell', 'buy')),
    price_type TEXT NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'range', 'negotiable')),
    price NUMERIC,
    price_min NUMERIC,
    price_max NUMERIC,
    unit TEXT NOT NULL DEFAULT 'kg',
    available_quantity NUMERIC,
    province_id INTEGER REFERENCES public.provinces(id),
    district_id INTEGER REFERENCES public.districts(id),
    local_level_id INTEGER REFERENCES public.local_levels(id),
    ward_number INTEGER,
    lat NUMERIC,
    lng NUMERIC,
    images TEXT[] DEFAULT '{}',
    contact_phone TEXT,
    whatsapp TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create delivery_requests table
CREATE TABLE public.delivery_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES public.user_market_cards(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_quantity NUMERIC NOT NULL,
    requested_price NUMERIC,
    delivery_address_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
    seller_notes TEXT,
    buyer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create delivery_shipments table (for future courier integration)
CREATE TABLE public.delivery_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_request_id UUID NOT NULL REFERENCES public.delivery_requests(id) ON DELETE CASCADE,
    carrier_code TEXT,
    tracking_number TEXT,
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed')),
    last_location_text TEXT,
    last_event_time TIMESTAMP WITH TIME ZONE,
    raw_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create card_reports table for safety
CREATE TABLE public.card_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES public.user_market_cards(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_market_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_reports ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: user_market_cards
-- =============================================
CREATE POLICY "Anyone can view active cards"
    ON public.user_market_cards FOR SELECT
    USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Users can create their own cards"
    ON public.user_market_cards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
    ON public.user_market_cards FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
    ON public.user_market_cards FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all cards"
    ON public.user_market_cards FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- RLS POLICIES: delivery_requests
-- =============================================
CREATE POLICY "Buyers can view their own requests"
    ON public.delivery_requests FOR SELECT
    USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view requests for their cards"
    ON public.delivery_requests FOR SELECT
    USING (card_id IN (SELECT id FROM public.user_market_cards WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can create requests"
    ON public.delivery_requests FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their pending requests"
    ON public.delivery_requests FOR UPDATE
    USING (auth.uid() = buyer_id AND status = 'pending');

CREATE POLICY "Sellers can update requests for their cards"
    ON public.delivery_requests FOR UPDATE
    USING (card_id IN (SELECT id FROM public.user_market_cards WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all delivery requests"
    ON public.delivery_requests FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- RLS POLICIES: delivery_shipments
-- =============================================
CREATE POLICY "Users can view shipments for their requests"
    ON public.delivery_shipments FOR SELECT
    USING (
        delivery_request_id IN (
            SELECT dr.id FROM public.delivery_requests dr
            WHERE dr.buyer_id = auth.uid()
            OR dr.card_id IN (SELECT id FROM public.user_market_cards WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "System can insert shipments"
    ON public.delivery_shipments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update shipments"
    ON public.delivery_shipments FOR UPDATE
    USING (true);

CREATE POLICY "Admins can manage all shipments"
    ON public.delivery_shipments FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- RLS POLICIES: card_reports
-- =============================================
CREATE POLICY "Anyone can report a card"
    ON public.card_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
    ON public.card_reports FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage all reports"
    ON public.card_reports FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIGGERS: Auto-update updated_at
-- =============================================
CREATE TRIGGER update_user_market_cards_updated_at
    BEFORE UPDATE ON public.user_market_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_requests_updated_at
    BEFORE UPDATE ON public.delivery_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_shipments_updated_at
    BEFORE UPDATE ON public.delivery_shipments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_card_reports_updated_at
    BEFORE UPDATE ON public.card_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX idx_user_market_cards_user_id ON public.user_market_cards(user_id);
CREATE INDEX idx_user_market_cards_crop_id ON public.user_market_cards(crop_id);
CREATE INDEX idx_user_market_cards_card_type ON public.user_market_cards(card_type);
CREATE INDEX idx_user_market_cards_is_active ON public.user_market_cards(is_active);
CREATE INDEX idx_user_market_cards_location ON public.user_market_cards(province_id, district_id, local_level_id);
CREATE INDEX idx_delivery_requests_card_id ON public.delivery_requests(card_id);
CREATE INDEX idx_delivery_requests_buyer_id ON public.delivery_requests(buyer_id);
CREATE INDEX idx_delivery_requests_status ON public.delivery_requests(status);
CREATE INDEX idx_delivery_shipments_request_id ON public.delivery_shipments(delivery_request_id);