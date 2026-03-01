// =============================================
// Notification system – technician unread count
// To disable: remove this hook and <TechnicianNotificationBell />
// =============================================

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Returns the current technician's DB id (from `technicians` table)
 * mapped via `user_id = auth.uid()`.
 */
export function useCurrentTechnicianId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['current-technician-id', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await (supabase as any)
        .from('technicians')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      return (data?.id as string) ?? null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Returns the count of tickets where `has_unread_technician = true`
 * for the current technician, plus a realtime subscription that
 * auto-refreshes on INSERT/UPDATE.
 */
export function useTechnicianNotificationCount() {
  const { data: technicianId } = useCurrentTechnicianId();
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
    refetchInterval: 30_000, // fallback polling every 30s
  });

  // Notification system start – realtime subscription
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
          // Refresh both unread count and ticket list
          queryClient.invalidateQueries({ queryKey: ['technician-unread-count', technicianId] });
          queryClient.invalidateQueries({ queryKey: ['technician-tickets'] });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [technicianId, queryClient]);
  // Notification system end

  return {
    count: countQuery.data ?? 0,
    isLoading: countQuery.isLoading,
    isTechnician: !!technicianId,
    technicianId,
  };
}
