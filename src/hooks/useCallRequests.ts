import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

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
  const queryClient = useQueryClient();

  const query = useQuery({
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

  // Realtime subscription for call_requests changes
  useEffect(() => {
    if (!ticketId) return;
    const channel = supabase
      .channel(`call-req-${ticketId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'call_requests', filter: `ticket_id=eq.${ticketId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['call-request', ticketId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticketId, queryClient]);

  return query;
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
  const { user } = useAuth();
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
      ticketId?: string;
    }) => {
      const updates: any = {
        status: data.status,
        technician_note: data.technicianNote || null,
      };
      if (data.scheduledWindow) updates.scheduled_window = data.scheduledWindow;
      if (data.declineReason) updates.decline_reason = data.declineReason;
      if (data.declineNote) updates.decline_note = data.declineNote;

      // Update call request
      const { data: updatedRequest, error } = await (supabase as any)
        .from('call_requests')
        .update(updates)
        .eq('id', data.requestId)
        .select('ticket_id')
        .single();
      if (error) throw error;

      const ticketId = data.ticketId || updatedRequest?.ticket_id;
      if (!ticketId) return;

      // Build notification message for farmer
      let notifMessage = '';
      if (data.status === 'accepted') {
        notifMessage = `📞 कृषि विज्ञले Call स्वीकार गर्नुभयो।`;
        if (data.scheduledWindow) notifMessage += ` 🕐 ${data.scheduledWindow} मा call आउँछ।`;
      } else if (data.status === 'declined') {
        const reasons: Record<string, string> = {
          busy: 'अहिले व्यस्त भएकाले',
          wrong_expert: 'यो विषय अर्को विज्ञको क्षेत्र भएकाले',
          use_chat: 'Chat मा लेख्नुस्, जवाफ दिइनेछ',
          network: 'Network समस्याका कारण',
        };
        notifMessage = `📞 Call अस्वीकार गरिएको छ। ${reasons[data.declineReason || ''] || ''}`;
        if (data.declineNote) notifMessage += ` — "${data.declineNote}"`;
      } else if (data.status === 'in_progress') {
        notifMessage = '📞 कृषि विज्ञले अहिले call गर्दै हुनुहुन्छ।';
      } else if (data.status === 'completed') {
        notifMessage = '✅ Call सम्पन्न भयो।';
      }

      // Insert system message into ticket chat so farmer sees it
      if (notifMessage) {
        await (supabase as any).from('expert_ticket_messages').insert({
          ticket_id: ticketId,
          sender_type: 'technician',
          sender_id: user?.id || null,
          message_text: notifMessage,
        });
      }

      // Mark ticket as unread for farmer
      await (supabase as any)
        .from('expert_tickets')
        .update({ has_unread_farmer: true })
        .eq('id', ticketId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-request'] });
      queryClient.invalidateQueries({ queryKey: ['my-expert-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['expert-assigned-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['expert-ticket-messages'] });
      toast({ title: '✅ Status अपडेट भयो' });
    },
    onError: () => {
      toast({ title: 'त्रुटि', variant: 'destructive' });
    },
  });
}
