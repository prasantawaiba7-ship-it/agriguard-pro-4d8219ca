// =============================================
// Auto-link technician by email on login
// Replaces manual "Link User" flow
// =============================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CurrentTechnician {
  id: string;
  name: string;
  office_id: string;
  is_expert: boolean;
  is_active: boolean;
  email: string | null;
  role_title: string;
  specialization: string | null;
  phone: string | null;
}

/**
 * Returns the current user's technician record (if any).
 * On first call, auto-links the auth user to a technician by email match
 * via the `auto_link_technician_by_email` DB function (security definer).
 */
export function useCurrentTechnician() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['current-technician', user?.id],
    queryFn: async (): Promise<CurrentTechnician | null> => {
      if (!user?.email) return null;

      const { data, error } = await supabase.rpc('auto_link_technician_by_email', {
        p_user_id: user.id,
        p_email: user.email,
      });

      if (error) {
        console.error('auto_link_technician_by_email error:', error);
        return null;
      }

      if (!data) return null;

      return data as unknown as CurrentTechnician;
    },
    enabled: !!user?.id && !!user?.email,
    staleTime: 5 * 60 * 1000,
  });
}
