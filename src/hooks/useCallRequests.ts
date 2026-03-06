import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CallRequest {
  id: string;
  ticket_id: string;
  farmer_id: string;
  technician_id: string;
  status: string;
  preferred_time: string | null;
  farmer_note: string | null;
  technician_note: string | null;
  scheduled_window: string | null;
  decline_reason: string | null;
  decline_note: string | null;
  created_at: string;
  updated_at: string;
}

export function useTicketCallRequest(ticketId: string | null) {
  return useQuery({
    queryKey: ['call-request', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const { data, error } = await (supabase as any)
        .from('call_requests')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as CallRequest | null;
    },
    enabled: !!ticketId,
  });
}

export function useCreateCallRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ticketId: string;
      technicianId: string;
      preferredTime?: string;
      farmerNote?: string;
    }) => {
      const { data: result, error } = await (supabase as any)
        .from('call_requests')
        .insert({
          ticket_id: data.ticketId,
          farmer_id: user!.id,
          technician_id: data.technicianId,
          status: 'requested',
          preferred_time: data.preferredTime || null,
          farmer_note: data.farmerNote || null,
        })
        .select()
        .single();
      if (error) throw error;

      // Mark ticket as having a call request
      await (supabase as any)
        .from('expert_tickets')
        .update({ has_unread_technician: true })
        .eq('id', data.ticketId);

      return result as CallRequest;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['call-request', vars.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['my-expert-tickets'] });
      toast({ title: '📞 Call अनुरोध पठाइयो', description: 'कृषि विज्ञले तपाईंको अनुरोध हेर्नेछन्।' });
    },
    onError: () => {
      toast({ title: 'त्रुटि', description: 'Call अनुरोध पठाउन सकिएन।', variant: 'destructive' });
    },
  });
}

export function useUpdateCallRequestStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      requestId: string;
      status: string;
      technicianNote?: string;
      scheduledWindow?: string;
      declineReason?: string;
      declineNote?: string;
    }) => {
      const updates: any = {
        status: data.status,
        technician_note: data.technicianNote || null,
      };
      if (data.scheduledWindow) updates.scheduled_window = data.scheduledWindow;
      if (data.declineReason) updates.decline_reason = data.declineReason;
      if (data.declineNote) updates.decline_note = data.declineNote;

      const { error } = await (supabase as any)
        .from('call_requests')
        .update(updates)
        .eq('id', data.requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-request'] });
      queryClient.invalidateQueries({ queryKey: ['my-expert-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['expert-assigned-tickets'] });
      toast({ title: '✅ Status अपडेट भयो' });
    },
    onError: () => {
      toast({ title: 'त्रुटि', variant: 'destructive' });
    },
  });
}
