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
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  farmer_note: string | null;
  technician_note: string | null;
  preferred_time: string | null;
  created_at: string;
  updated_at: string;
}

/** Fetch the active call request for a specific ticket (farmer side) */
export function useCallRequestForTicket(ticketId: string | null) {
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

  // Realtime subscription
  useEffect(() => {
    if (!ticketId) return;
    const channel = supabase
      .channel(`call-req-${ticketId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'call_requests',
        filter: `ticket_id=eq.${ticketId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['call-request', ticketId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticketId, queryClient]);

  return query;
}

/** Fetch all call requests for a technician */
export function useCallRequestsForTechnician(technicianId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['technician-call-requests', technicianId],
    queryFn: async () => {
      if (!technicianId) return [];
      const { data, error } = await (supabase as any)
        .from('call_requests')
        .select('*, ticket:expert_tickets(id, problem_title, crop_name, farmer_id)')
        .eq('technician_id', technicianId)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as (CallRequest & { ticket?: { id: string; problem_title: string; crop_name: string; farmer_id: string } })[];
    },
    enabled: !!technicianId,
  });

  // Realtime
  useEffect(() => {
    if (!technicianId) return;
    const channel = supabase
      .channel(`tech-call-reqs-${technicianId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'call_requests',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['technician-call-requests', technicianId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [technicianId, queryClient]);

  return query;
}

/** Farmer sends a call request */
export function useCreateCallRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ticketId: string;
      technicianId: string;
      farmerNote?: string;
      preferredTime?: string;
    }) => {
      const { error } = await (supabase as any)
        .from('call_requests')
        .insert({
          ticket_id: data.ticketId,
          farmer_id: user!.id,
          technician_id: data.technicianId,
          status: 'pending',
          farmer_note: data.farmerNote || null,
          preferred_time: data.preferredTime || null,
        });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['call-request', vars.ticketId] });
      toast({ title: '✅ Call request पठाइयो' });
    },
    onError: () => {
      toast({ title: 'Call request पठाउन सकिएन', variant: 'destructive' });
    },
  });
}

/** Technician updates call request status */
export function useUpdateCallRequest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      requestId: string;
      status: 'accepted' | 'rejected' | 'completed';
      technicianNote?: string;
    }) => {
      const { error } = await (supabase as any)
        .from('call_requests')
        .update({
          status: data.status,
          technician_note: data.technicianNote || null,
        })
        .eq('id', data.requestId);
      if (error) throw error;

      // Create notification for farmer on accept/reject
      if (data.status === 'accepted' || data.status === 'rejected') {
        try {
          // Load call request to get farmer_id and ticket info
          const { data: callReq } = await (supabase as any)
            .from('call_requests')
            .select('farmer_id, ticket_id, ticket:expert_tickets(problem_title)')
            .eq('id', data.requestId)
            .single();

          if (callReq) {
            const problemTitle = callReq.ticket?.problem_title || '';
            const isAccepted = data.status === 'accepted';

            await supabase.from('notifications').insert({
              user_id: callReq.farmer_id,
              title: isAccepted
                ? 'Call request स्वीकार भयो'
                : 'Call request अस्वीकार गरिएको छ',
              body: isAccepted
                ? `तपाईंको call request "${problemTitle}" मा Krishi Bigya ले स्वीकार गर्नुभयो। अब call गर्न सक्नुहुन्छ।${data.technicianNote ? ` सन्देश: "${data.technicianNote}"` : ''}`
                : `तपाईंको call request "${problemTitle}" अस्वीकार गरिएको छ।${data.technicianNote ? ` कारण: "${data.technicianNote}"` : ''}`,
              type: isAccepted ? 'call_request_accepted' : 'call_request_rejected',
              ticket_id: callReq.ticket_id,
            });
          }
        } catch (e) {
          console.error('Call request notification failed:', e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-call-requests'] });
      queryClient.invalidateQueries({ queryKey: ['call-request'] });
      toast({ title: '✅ अपडेट भयो' });
    },
    onError: () => {
      toast({ title: 'अपडेट गर्न सकिएन', variant: 'destructive' });
    },
  });
}
