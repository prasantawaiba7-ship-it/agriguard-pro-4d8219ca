import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface UserMarketCard {
  id: string;
  user_id: string;
  crop_id: number | null;
  title: string;
  description: string | null;
  card_type: 'sell' | 'buy';
  price_type: 'fixed' | 'range' | 'negotiable';
  price: number | null;
  price_min: number | null;
  price_max: number | null;
  unit: string;
  available_quantity: number | null;
  province_id: number | null;
  district_id: number | null;
  local_level_id: number | null;
  ward_number: number | null;
  lat: number | null;
  lng: number | null;
  images: string[];
  contact_phone: string | null;
  whatsapp: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  crops?: { name_ne: string; name_en: string; image_url: string | null } | null;
  provinces?: { name_ne: string } | null;
  districts?: { name_ne: string } | null;
  local_levels?: { name_ne: string } | null;
}

export interface CreateCardInput {
  crop_id?: number;
  title: string;
  description?: string;
  card_type: 'sell' | 'buy';
  price_type: 'fixed' | 'range' | 'negotiable';
  price?: number;
  price_min?: number;
  price_max?: number;
  unit: string;
  available_quantity?: number;
  province_id?: number;
  district_id?: number;
  local_level_id?: number;
  ward_number?: number;
  lat?: number;
  lng?: number;
  images?: string[];
  contact_phone?: string;
  whatsapp?: string;
}

interface CardFilters {
  crop_id?: number;
  card_type?: 'sell' | 'buy';
  province_id?: number;
  district_id?: number;
  local_level_id?: number;
  myCardsOnly?: boolean;
}

export function useUserMarketCards(filters?: CardFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const cardsQuery = useQuery({
    queryKey: ['user-market-cards', filters],
    queryFn: async () => {
      let query = supabase
        .from('user_market_cards')
        .select(`
          *,
          crops:crop_id (name_ne, name_en, image_url),
          provinces:province_id (name_ne),
          districts:district_id (name_ne),
          local_levels:local_level_id (name_ne)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.myCardsOnly && user) {
        query = query.eq('user_id', user.id);
      }
      if (filters?.crop_id) {
        query = query.eq('crop_id', filters.crop_id);
      }
      if (filters?.card_type) {
        query = query.eq('card_type', filters.card_type);
      }
      if (filters?.province_id) {
        query = query.eq('province_id', filters.province_id);
      }
      if (filters?.district_id) {
        query = query.eq('district_id', filters.district_id);
      }
      if (filters?.local_level_id) {
        query = query.eq('local_level_id', filters.local_level_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserMarketCard[];
    },
  });

  const createCard = useMutation({
    mutationFn: async (input: CreateCardInput) => {
      if (!user) throw new Error('Please login first');

      const { data, error } = await supabase
        .from('user_market_cards')
        .insert({
          ...input,
          user_id: user.id,
          images: input.images || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-market-cards'] });
      toast({ title: 'कार्ड सफलतापूर्वक थपियो!' });
    },
    onError: (error) => {
      toast({ title: 'त्रुटि', description: error.message, variant: 'destructive' });
    },
  });

  const updateCard = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateCardInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_market_cards')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-market-cards'] });
      toast({ title: 'कार्ड अपडेट भयो!' });
    },
    onError: (error) => {
      toast({ title: 'त्रुटि', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_market_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-market-cards'] });
      toast({ title: 'कार्ड हटाइयो!' });
    },
    onError: (error) => {
      toast({ title: 'त्रुटि', description: error.message, variant: 'destructive' });
    },
  });

  const toggleCardActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('user_market_cards')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-market-cards'] });
      toast({ title: 'कार्ड स्थिति अपडेट भयो!' });
    },
  });

  return {
    cards: cardsQuery.data || [],
    isLoading: cardsQuery.isLoading,
    error: cardsQuery.error,
    createCard,
    updateCard,
    deleteCard,
    toggleCardActive,
    refetch: cardsQuery.refetch,
  };
}
