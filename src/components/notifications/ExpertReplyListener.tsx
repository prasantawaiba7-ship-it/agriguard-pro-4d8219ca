import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !profile) return;

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
            if (notif?.type === 'expert_reply') {
              const caseId = notif.data?.case_id;
              toast({
                title: '🔔 ' + (notif.title || 'कृषि विज्ञको जवाफ आएको छ'),
                description: notif.message || 'मेरा प्रश्नहरू पृष्ठमा गएर हेर्नुहोस्।',
                duration: 8000,
              });
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
              queryClient.invalidateQueries({ queryKey: ['my-expert-cases'] });
              if (caseId) {
                queryClient.invalidateQueries({ queryKey: ['ticket-messages', caseId] });
              }
            }
          }
        )
        .subscribe();

      // Listen for expert_tickets updates (has_unread_farmer = true means new activity)
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
            const oldRow = payload.old;
            // Show toast when has_unread_farmer flips to true
            if (newRow?.has_unread_farmer === true && oldRow?.has_unread_farmer === false) {
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

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(ticketChannel);
      };
    };

    let cleanup: (() => void) | undefined;
    setup().then((fn) => {
      cleanup = fn;
    });

    return () => {
      cleanup?.();
    };
  }, [user, profile, toast, queryClient, navigate]);

  return null;
}
