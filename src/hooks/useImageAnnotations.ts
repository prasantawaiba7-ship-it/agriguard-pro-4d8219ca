// Image annotation start
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AnnotationShape } from '@/components/tickets/AnnotationToolbar';

/**
 * Hook to update annotation_data on an expert_ticket_images row.
 * Annotations are stored as a JSON array of AnnotationShape objects.
 */
export function useUpdateAnnotations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ imageId, annotations, ticketId }: { imageId: string; annotations: AnnotationShape[]; ticketId: string }) => {
      const { error } = await (supabase as any)
        .from('expert_ticket_images')
        .update({ annotation_data: annotations })
        .eq('id', imageId);
      if (error) throw error;
      return ticketId;
    },
    onSuccess: (ticketId) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-images', ticketId] });
    },
  });
}
// Image annotation end
