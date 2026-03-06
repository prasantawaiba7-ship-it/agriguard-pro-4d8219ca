import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
/**
 * Global listener that subscribes to:
 * 1. farmer_notifications via realtime
 * 2. expert_tickets changes (has_unread_farmer) for call request updates
 * Shows a toast when an expert replies or updates call status.
 */
export function ExpertReplyListener() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    let farmerProfileId: string | null = null;

    const setup = async () => {
      const { data } = await supabase
        .from('farmer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!data) return;
      farmerProfileId = data.id;

      const channel = supabase
        .channel(`farmer-notifications-${farmerProfileId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'farmer_notifications',
            filter: `farmer_id=eq.${farmerProfileId}`,
          },
          (payload: any) => {
            const notif = payload.new;
            const caseId = notif?.data?.case_id;
            toast({
              title: '🔔 ' + (notif?.title || 'कृषि विज्ञबाट अपडेट आयो'),
              description: notif?.message || 'मेरा प्रश्नहरू पृष्ठमा गएर हेर्नुहोस्।',
              duration: 8000,
            });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['my-expert-cases'] });
            queryClient.invalidateQueries({ queryKey: ['my-expert-tickets'] });
            if (caseId) {
              queryClient.invalidateQueries({ queryKey: ['ticket-messages', caseId] });
            }
          }
        )
        .subscribe();

      // Listen for expert_tickets updates (fallback)
      const ticketChannel = supabase
        .channel(`farmer-ticket-updates-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'expert_tickets',
            filter: `farmer_id=eq.${user.id}`,
          },
          (payload: any) => {
            const newRow = payload.new;
            if (newRow?.has_unread_farmer === true) {
              toast({
                title: '🔔 कृषि विज्ञबाट अपडेट आयो',
                description: 'मेरा प्रश्नहरू मा गएर हेर्नुहोस्।',
                duration: 6000,
              });
              queryClient.invalidateQueries({ queryKey: ['my-expert-tickets'] });
              queryClient.invalidateQueries({ queryKey: ['call-request'] });
              queryClient.invalidateQueries({ queryKey: ['expert-ticket-messages'] });
            }
          }
        )
        .subscribe();

      // Listen directly for call status updates for this farmer
      const callChannel = supabase
        .channel(`farmer-call-updates-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'call_requests',
            filter: `farmer_id=eq.${user.id}`,
          },
          (payload: any) => {
            const nextStatus = payload?.new?.status;
            const prevStatus = payload?.old?.status;
            if (!nextStatus || nextStatus === prevStatus) return;

            if (['accepted', 'declined', 'in_progress', 'completed'].includes(nextStatus)) {
              toast({
                title: '📞 Call update',
                description:
                  nextStatus === 'accepted'
                    ? 'कृषि विज्ञले call स्वीकार गर्नुभयो।'
                    : nextStatus === 'declined'
                    ? 'कृषि विज्ञले call अस्वीकार गर्नुभयो।'
                    : nextStatus === 'in_progress'
                    ? 'कृषि विज्ञले अहिले call गर्दै हुनुहुन्छ।'
                    : 'Call सम्पन्न भयो।',
                duration: 7000,
              });
              queryClient.invalidateQueries({ queryKey: ['my-expert-tickets'] });
              queryClient.invalidateQueries({ queryKey: ['call-request'] });
              queryClient.invalidateQueries({ queryKey: ['expert-ticket-messages'] });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(ticketChannel);
        supabase.removeChannel(callChannel);
      };
    };

    let cleanup: (() => void) | undefined;
    setup().then((fn) => {
      cleanup = fn;
    });

    return () => {
      cleanup?.();
    };
  }, [user, toast, queryClient]);

  return null;
}
