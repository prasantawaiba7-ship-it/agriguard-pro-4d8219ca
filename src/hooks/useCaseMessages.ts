import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface CaseMessage {
  id: string;
  case_id: string;
  sender_type: string; // farmer, expert, system, ai
  sender_id: string | null;
  message_text: string;
  attachments: any[];
  is_internal_note: boolean;
  created_at: string;
}

export function useCaseMessages(caseId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['case-messages', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase
        .from('case_messages')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as CaseMessage[];
    },
    enabled: !!caseId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!caseId) return;
    const channel = supabase
      .channel(`case-messages-${caseId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'case_messages', filter: `case_id=eq.${caseId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['case-messages', caseId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [caseId, queryClient]);

  return query;
}

export function useSendCaseMessage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      caseId: string;
      message: string;
      senderType?: string;
      attachments?: any[];
      isInternalNote?: boolean;
    }) => {
      const { error } = await supabase
        .from('case_messages')
        .insert({
          case_id: data.caseId,
          sender_type: data.senderType || 'farmer',
          sender_id: user?.id || null,
          message_text: data.message,
          attachments: data.attachments || [],
          is_internal_note: data.isInternalNote || false,
        });
      if (error) throw error;

      // If expert reply, update case status
      if (data.senderType === 'expert') {
        await supabase
          .from('diagnosis_cases')
          .update({
            case_status: 'expert_answered' as any,
            first_response_at: new Date().toISOString(),
          })
          .eq('id', data.caseId)
          .is('first_response_at', null);

        await supabase
          .from('diagnosis_cases')
          .update({ case_status: 'expert_answered' as any })
          .eq('id', data.caseId);
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['case-messages', vars.caseId] });
      queryClient.invalidateQueries({ queryKey: ['my-diagnosis-cases'] });
      queryClient.invalidateQueries({ queryKey: ['admin-diagnosis-cases'] });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast({ title: 'सन्देश पठाउन सकिएन', variant: 'destructive' });
    },
  });
}
