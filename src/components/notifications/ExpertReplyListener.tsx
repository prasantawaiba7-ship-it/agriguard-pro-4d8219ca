import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Global listener that subscribes to farmer_notifications via realtime.
 * Shows a toast when an expert replies to the farmer's question.
 */
export function ExpertReplyListener() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !profile) return;

    // We need farmer_profiles.id to filter notifications
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
              // Invalidate notifications + my-expert-cases queries
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
              queryClient.invalidateQueries({ queryKey: ['my-expert-cases'] });
              if (caseId) {
                queryClient.invalidateQueries({ queryKey: ['ticket-messages', caseId] });
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
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
