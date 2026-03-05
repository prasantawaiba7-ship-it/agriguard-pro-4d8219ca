import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppNotificationCount } from '@/hooks/useAppNotifications';
import { useNavigate } from 'react-router-dom';

export function NotificationBell() {
  const { data: unreadCount } = useAppNotificationCount();
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative rounded-full h-9 w-9 p-0"
      onClick={() => navigate('/notifications')}
    >
      <Bell className="w-4 h-4" />
      {!!unreadCount && unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  );
}
