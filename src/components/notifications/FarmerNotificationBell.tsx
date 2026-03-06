import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function FarmerNotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['farmer-notification-count', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return 0;

      const { data: farmerProfile } = await supabase
        .from('farmer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!farmerProfile?.id) return 0;

      const { count, error } = await supabase
        .from('farmer_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('farmer_id', farmerProfile.id)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 15000,
  });

  if (!user) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative rounded-full h-9 w-9 p-0"
      onClick={() => navigate('/my-questions')}
      aria-label={`Notifications ${unreadCount}`}
    >
      <Bell className="w-4.5 h-4.5 text-foreground" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
}
