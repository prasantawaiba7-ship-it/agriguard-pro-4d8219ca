import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ProduceListing {
  id: string;
  user_id: string;
  farmer_id: string | null;
  crop_name: string;
  variety: string | null;
  quantity: number;
  unit: string;
  expected_price: number | null;
  district: string | null;
  municipality: string | null;
  contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateListingInput {
  crop_name: string;
  variety?: string;
  quantity: number;
  unit: string;
  expected_price?: number;
  district?: string;
  municipality?: string;
  contact_phone?: string;
  notes?: string;
}

export function useProduceListings() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [myListings, setMyListings] = useState<ProduceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllListings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('produce_listings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings((data as ProduceListing[]) || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  }, []);

  const fetchMyListings = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('produce_listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyListings((data as ProduceListing[]) || []);
    } catch (error) {
      console.error('Error fetching my listings:', error);
    }
  }, [user]);

  const createListing = useCallback(async (input: CreateListingInput) => {
    if (!user) {
      toast({ title: 'Error', description: 'Please login first', variant: 'destructive' });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('produce_listings')
        .insert({
          user_id: user.id,
          farmer_id: profile?.id || null,
          crop_name: input.crop_name,
          variety: input.variety || null,
          quantity: input.quantity,
          unit: input.unit,
          expected_price: input.expected_price || null,
          district: input.district || profile?.district || null,
          municipality: input.municipality || null,
          contact_phone: input.contact_phone || profile?.phone || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'सफल!', description: 'तपाईंको उब्जनी list गरियो।' });
      await fetchMyListings();
      await fetchAllListings();
      return data as ProduceListing;
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({ title: 'Error', description: 'Listing बनाउन सकिएन।', variant: 'destructive' });
      return null;
    }
  }, [user, profile, toast, fetchMyListings, fetchAllListings]);

  const updateListing = useCallback(async (id: string, updates: Partial<CreateListingInput & { is_active: boolean }>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('produce_listings')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Updated!', description: 'Listing अपडेट भयो।' });
      await fetchMyListings();
      await fetchAllListings();
      return true;
    } catch (error) {
      console.error('Error updating listing:', error);
      toast({ title: 'Error', description: 'Update गर्न सकिएन।', variant: 'destructive' });
      return false;
    }
  }, [user, toast, fetchMyListings, fetchAllListings]);

  const deleteListing = useCallback(async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('produce_listings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Deleted!', description: 'Listing हटाइयो।' });
      await fetchMyListings();
      await fetchAllListings();
      return true;
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast({ title: 'Error', description: 'Delete गर्न सकिएन।', variant: 'destructive' });
      return false;
    }
  }, [user, toast, fetchMyListings, fetchAllListings]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchAllListings(), fetchMyListings()]).finally(() => setIsLoading(false));
  }, [fetchAllListings, fetchMyListings]);

  return {
    listings,
    myListings,
    isLoading,
    createListing,
    updateListing,
    deleteListing,
    refresh: () => Promise.all([fetchAllListings(), fetchMyListings()]),
  };
}
