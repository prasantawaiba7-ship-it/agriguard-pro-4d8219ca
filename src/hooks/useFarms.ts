import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Farm {
  id: string;
  farmer_id: string;
  farm_name: string;
  village: string | null;
  district: string | null;
  total_area: number | null;
  area_unit: string;
  main_crops: string[];
  irrigation_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface FarmCrop {
  id: string;
  farm_id: string;
  crop_type: string;
  season: string | null;
  sowing_date: string | null;
  transplant_date: string | null;
  harvest_date_estimated: string | null;
  area: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useFarms() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['farms', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('farms')
        .select('*')
        .eq('farmer_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Farm[];
    },
    enabled: !!user,
  });
}

export function useFarmCrops(farmId: string | null) {
  return useQuery({
    queryKey: ['farm-crops', farmId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('farm_crops')
        .select('*')
        .eq('farm_id', farmId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as FarmCrop[];
    },
    enabled: !!farmId,
  });
}

export function useActiveFarmCrops(farmId: string | null) {
  return useQuery({
    queryKey: ['farm-crops-active', farmId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('farm_crops')
        .select('*')
        .eq('farm_id', farmId!)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as FarmCrop[];
    },
    enabled: !!farmId,
  });
}

export function useCreateFarm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      farm_name: string;
      village?: string;
      district?: string;
      total_area?: number;
      area_unit?: string;
      main_crops?: string[];
      irrigation_type?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: farm, error } = await (supabase as any)
        .from('farms')
        .insert({ ...data, farmer_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return farm as Farm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      toast({ title: '✅ खेत थपियो' });
    },
    onError: (e: any) => {
      toast({ title: 'त्रुटि', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdateFarm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Farm> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('farms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Farm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      toast({ title: '✅ खेत अपडेट भयो' });
    },
    onError: (e: any) => {
      toast({ title: 'त्रुटि', description: e.message, variant: 'destructive' });
    },
  });
}

export function useDeleteFarm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('farms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      toast({ title: 'खेत हटाइयो' });
    },
    onError: (e: any) => {
      toast({ title: 'त्रुटि', description: e.message, variant: 'destructive' });
    },
  });
}

export function useCreateFarmCrop() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      farm_id: string;
      crop_type: string;
      season?: string;
      sowing_date?: string;
      transplant_date?: string;
      harvest_date_estimated?: string;
      area?: number;
    }) => {
      const { data: crop, error } = await (supabase as any)
        .from('farm_crops')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return crop as FarmCrop;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-crops'] });
      queryClient.invalidateQueries({ queryKey: ['farm-crops-active'] });
      toast({ title: '✅ बाली थपियो' });
    },
    onError: (e: any) => {
      toast({ title: 'त्रुटि', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdateFarmCrop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FarmCrop> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('farm_crops')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as FarmCrop;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-crops'] });
      queryClient.invalidateQueries({ queryKey: ['farm-crops-active'] });
    },
  });
}

export function useDeleteFarmCrop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('farm_crops').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-crops'] });
      queryClient.invalidateQueries({ queryKey: ['farm-crops-active'] });
    },
  });
}
