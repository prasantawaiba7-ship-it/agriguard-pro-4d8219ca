import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Recommendation templates start

export interface ExpertTemplate {
  id: string;
  crop: string;
  disease: string;
  language: string;
  title: string;
  body: string;
  tags: string[] | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpertTemplateFilters {
  crop?: string;
  disease?: string;
  language?: string;
  isActive?: boolean;
  search?: string;
}

export function useExpertTemplates(filters?: ExpertTemplateFilters) {
  return useQuery({
    queryKey: ['expert-templates', filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from('expert_templates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters?.crop) {
        query = query.eq('crop', filters.crop);
      }
      if (filters?.language) {
        query = query.eq('language', filters.language);
      }
      if (filters?.disease) {
        query = query.ilike('disease', `%${filters.disease}%`);
      }
      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,disease.ilike.%${filters.search}%,body.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ExpertTemplate[];
    },
  });
}

export function useCreateExpertTemplate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ExpertTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { error } = await (supabase as any)
        .from('expert_templates')
        .insert({ ...data, created_by: user?.id || null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-templates'] });
      toast({ title: '✅ Template सिर्जना भयो' });
    },
    onError: () => {
      toast({ title: 'Template सिर्जना असफल', variant: 'destructive' });
    },
  });
}

export function useUpdateExpertTemplate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ExpertTemplate> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('expert_templates')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-templates'] });
      toast({ title: '✅ Template अपडेट भयो' });
    },
    onError: () => {
      toast({ title: 'Template अपडेट असफल', variant: 'destructive' });
    },
  });
}

// Stub for future AI-assisted template suggestion
// export function getSuggestedTemplateIds(ticket: { crop_name?: string; problem_description?: string }): string[] {
//   // Future: call AI endpoint to rank templates by relevance
//   return [];
// }

// Recommendation templates end
