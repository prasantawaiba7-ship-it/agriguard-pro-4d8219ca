import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface DeliveryRequest {
  id: string;
  card_id: string;
  buyer_id: string;
  requested_quantity: number;
  requested_price: number | null;
  delivery_address_text: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  seller_notes: string | null;
  buyer_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user_market_cards?: {
    id: string;
    title: string;
    user_id: string;
    unit: string;
    price: number | null;
    crops?: { name_ne: string; image_url: string | null } | null;
  } | null;
}

export interface DeliveryShipment {
  id: string;
  delivery_request_id: string;
  carrier_code: string | null;
  tracking_number: string | null;
  status: 'created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed';
  last_location_text: string | null;
  last_event_time: string | null;
  raw_payload: any;
  created_at: string;
  updated_at: string;
}

export interface CreateDeliveryRequestInput {
  card_id: string;
  requested_quantity: number;
  requested_price?: number;
  delivery_address_text: string;
  buyer_notes?: string;
}

export function useDeliveryRequests(mode: 'buyer' | 'seller' = 'buyer') {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ['delivery-requests', mode, user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('delivery_requests')
        .select(`
          *,
          user_market_cards:card_id (
            id, title, user_id, unit, price,
            crops:crop_id (name_ne, image_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter based on mode
      const filtered = (data || []).filter((req: any) => {
        if (mode === 'buyer') {
          return req.buyer_id === user.id;
        } else {
          return req.user_market_cards?.user_id === user.id;
        }
      });

      return filtered as DeliveryRequest[];
    },
    enabled: !!user,
  });

  const createRequest = useMutation({
    mutationFn: async (input: CreateDeliveryRequestInput) => {
      if (!user) throw new Error('Please login first');

      const { data, error } = await supabase
        .from('delivery_requests')
        .insert({
          ...input,
          buyer_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-requests'] });
      toast({ title: 'डेलिभरी अनुरोध पठाइयो!' });
    },
    onError: (error) => {
      toast({ title: 'त्रुटि', description: error.message, variant: 'destructive' });
    },
  });

  const updateRequestStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      seller_notes,
    }: {
      id: string;
      status: DeliveryRequest['status'];
      seller_notes?: string;
    }) => {
      const update: any = { status };
      if (seller_notes !== undefined) update.seller_notes = seller_notes;

      const { data, error } = await supabase
        .from('delivery_requests')
        .update(update)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-requests'] });
      toast({ title: 'अनुरोध स्थिति अपडेट भयो!' });
    },
    onError: (error) => {
      toast({ title: 'त्रुटि', description: error.message, variant: 'destructive' });
    },
  });

  const cancelRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('delivery_requests')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-requests'] });
      toast({ title: 'अनुरोध रद्द भयो!' });
    },
  });

  return {
    requests: requestsQuery.data || [],
    isLoading: requestsQuery.isLoading,
    error: requestsQuery.error,
    createRequest,
    updateRequestStatus,
    cancelRequest,
    refetch: requestsQuery.refetch,
  };
}

export function useDeliveryShipment(requestId?: string) {
  const shipmentsQuery = useQuery({
    queryKey: ['delivery-shipments', requestId],
    queryFn: async () => {
      if (!requestId) return null;

      const { data, error } = await supabase
        .from('delivery_shipments')
        .select('*')
        .eq('delivery_request_id', requestId)
        .maybeSingle();

      if (error) throw error;
      return data as DeliveryShipment | null;
    },
    enabled: !!requestId,
  });

  return {
    shipment: shipmentsQuery.data,
    isLoading: shipmentsQuery.isLoading,
    error: shipmentsQuery.error,
  };
}
