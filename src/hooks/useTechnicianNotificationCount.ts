// =============================================
// Notification system – technician unread count
// Now uses useCurrentTechnician for auto-link by email
// =============================================

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentTechnician } from '@/hooks/useCurrentTechnician';

/**
 * Returns the count of tickets where `has_unread_technician = true`
 * for the current technician, plus a realtime subscription that
 * auto-refreshes on INSERT/UPDATE.
 */
export function useTechnicianNotificationCount() {
  const { data: currentTech } = useCurrentTechnician();
  const technicianId = currentTech?.id ?? null;
  const queryClient = useQueryClient();

  const countQuery = useQuery({
    queryKey: ['technician-unread-count', technicianId],
    queryFn: async () => {
      if (!technicianId) return 0;
      const { count, error } = await (supabase as any)
        .from('expert_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('technician_id', technicianId)
        .eq('has_unread_technician', true);
      if (error) { console.error('Unread count error:', error); return 0; }
      return count ?? 0;
    },
    enabled: !!technicianId,
    refetchInterval: 30_000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!technicianId) return;
    const channel = supabase
      .channel(`tech-notif-${technicianId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expert_tickets',
          filter: `technician_id=eq.${technicianId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['technician-unread-count', technicianId] });
          queryClient.invalidateQueries({ queryKey: ['technician-tickets'] });
          queryClient.invalidateQueries({ queryKey: ['expert-assigned-tickets'] });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [technicianId, queryClient]);

  return {
    count: countQuery.data ?? 0,
    isLoading: countQuery.isLoading,
    isTechnician: !!technicianId,
    technicianId,
  };
}
