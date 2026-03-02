import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TicketImage {
  id: string;
  ticket_id: string;
  uploaded_by: string;
  role: 'farmer' | 'technician';
  image_url: string;
  note: string | null;
  annotation_data: any;
  created_at: string;
}

// Fetch all images for a ticket
export function useTicketImages(ticketId: string | null) {
  return useQuery({
    queryKey: ['ticket-images', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await (supabase as any)
        .from('expert_ticket_images')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as TicketImage[];
    },
    enabled: !!ticketId,
  });
}

// Upload a ticket image to storage + insert DB row
export async function uploadTicketImage(
  ticketId: string,
  file: File,
  uploadedBy: string,
  role: 'farmer' | 'technician'
): Promise<TicketImage> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${ticketId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('ticket-images')
    .upload(path, file, { contentType: file.type });
  if (uploadErr) throw uploadErr;

  const { data: urlData } = supabase.storage
    .from('ticket-images')
    .getPublicUrl(path);

  const { data, error } = await (supabase as any)
    .from('expert_ticket_images')
    .insert({
      ticket_id: ticketId,
      uploaded_by: uploadedBy,
      role,
      image_url: urlData.publicUrl,
    })
    .select()
    .single();
  if (error) throw error;
  return data as TicketImage;
}

// Update note on an image
export function useUpdateImageNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ imageId, note, ticketId }: { imageId: string; note: string; ticketId: string }) => {
      const { error } = await (supabase as any)
        .from('expert_ticket_images')
        .update({ note })
        .eq('id', imageId);
      if (error) throw error;
      return ticketId;
    },
    onSuccess: (ticketId) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-images', ticketId] });
    },
  });
}
