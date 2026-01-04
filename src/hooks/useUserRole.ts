import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AppRole = 'admin' | 'farmer' | 'field_official' | 'authority' | 'insurer';

export function useUserRole() {
  const { user, isLoading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      if (!user) {
        setRoles([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          setRoles([]);
        } else {
          setRoles(data?.map(r => r.role as AppRole) || []);
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      fetchRoles();
    }
  }, [user, authLoading]);

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  const isAuthority = (): boolean => {
    return hasRole('authority') || hasRole('admin');
  };

  const isFarmer = (): boolean => {
    return hasRole('farmer');
  };

  return {
    roles,
    isLoading: authLoading || isLoading,
    hasRole,
    isAdmin,
    isAuthority,
    isFarmer,
  };
}
