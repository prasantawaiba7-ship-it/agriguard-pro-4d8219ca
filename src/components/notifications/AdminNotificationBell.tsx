import { useState } from 'react';
import { Bell, CheckCheck, AlertTriangle, MessageSquare, Star, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminNotifications, AdminNotification } from '@/hooks/useAdminNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function getNotifIcon(type: string) {
  switch (type) {
    case 'ticket_new': return <Ticket className="w-4 h-4 text-primary" />;
    case 'rating_low': return <AlertTriangle className="w-4 h-4 text-destructive" />;
    case 'feedback_new': return <Star className="w-4 h-4 text-yellow-500" />;
    default: return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
  }
}

function NotificationItem({ notif, onRead }: { notif: AdminNotification; onRead: () => void }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notif.is_read) onRead();
    // Navigate based on type
    if (notif.type === 'ticket_new' && notif.data?.ticket_id) {
      navigate('/admin?tab=expert-tickets');
    } else {
      navigate('/admin?tab=feedback');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/80 flex gap-3 items-start ${
        !notif.is_read ? 'bg-primary/5 border-l-2 border-primary' : ''
      }`}
    >
      <div className="mt-0.5 shrink-0">{getNotifIcon(notif.type)}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-tight ${!notif.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
          {notif.title}
        </p>
        {notif.body && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.body}</p>
        )}
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
        </p>
      </div>
      {notif.priority === 'high' && (
        <Badge variant="destructive" className="text-[9px] px-1.5 py-0 shrink-0">
          High
        </Badge>
      )}
    </button>
  );
}

// Force remount after hook refactor
export function AdminNotificationBell() {
  const { notifications, unreadCount, isAdmin, markAsRead, markAllAsRead } = useAdminNotifications();
  const [open, setOpen] = useState(false);

  if (!isAdmin) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative rounded-full h-9 w-9 p-0">
          <Bell className="w-4.5 h-4.5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h4 className="font-semibold text-sm">Admin Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1 text-muted-foreground"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[380px]">
          <div className="p-2 space-y-1">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notif={n}
                  onRead={() => markAsRead(n.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
