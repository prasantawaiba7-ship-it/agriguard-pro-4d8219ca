// =============================================
// Notification system – technician bell icon
// To disable: remove this component from Header.tsx
// =============================================

import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTechnicianNotificationCount } from '@/hooks/useTechnicianNotificationCount';

export function TechnicianNotificationBell() {
  const navigate = useNavigate();
  const { count, isTechnician } = useTechnicianNotificationCount();

  // Only render for logged-in technicians
  if (!isTechnician) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative rounded-full h-9 w-9 p-0"
      onClick={() => navigate('/technician-dashboard')}
      aria-label={`${count} नयाँ प्रश्न`}
    >
      <Bell className="w-4.5 h-4.5 text-foreground" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 animate-pulse">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Button>
  );
}
