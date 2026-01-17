import { useEffect, useCallback } from 'react';
import { useTreatmentReminders } from '@/hooks/useDiseaseHistory';
import { 
  isPushSupported, 
  requestNotificationPermission, 
  showLocalNotification 
} from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const NOTIFICATION_CHECK_KEY = 'lastTreatmentNotificationCheck';
const SHOWN_NOTIFICATIONS_KEY = 'shownTreatmentNotifications';

export function useTreatmentNotifications() {
  const { user } = useAuth();
  const { data: reminders = [] } = useTreatmentReminders();
  const { toast } = useToast();

  // Get already shown notification IDs
  const getShownNotifications = useCallback((): Set<string> => {
    try {
      const stored = localStorage.getItem(SHOWN_NOTIFICATIONS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }, []);

  // Save shown notification IDs
  const saveShownNotifications = useCallback((ids: Set<string>) => {
    localStorage.setItem(SHOWN_NOTIFICATIONS_KEY, JSON.stringify([...ids]));
  }, []);

  // Check and show notifications for due treatments
  const checkAndShowNotifications = useCallback(() => {
    if (!user || reminders.length === 0) return;

    const shownIds = getShownNotifications();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check for overdue and upcoming (within 1 day) treatments
    const dueReminders = reminders.filter(r => {
      const treatmentDate = new Date(r.nextTreatmentDate);
      const isOverdue = r.isOverdue;
      const isDueSoon = r.daysRemaining <= 1;
      const notificationKey = `${r.id}-${today.toISOString().split('T')[0]}`;
      
      return (isOverdue || isDueSoon) && !shownIds.has(notificationKey);
    });

    if (dueReminders.length === 0) return;

    // Show notifications
    dueReminders.forEach(reminder => {
      const notificationKey = `${reminder.id}-${today.toISOString().split('T')[0]}`;
      
      // Show toast notification
      toast({
        title: reminder.isOverdue 
          ? `⚠️ उपचार बिलम्ब भयो!` 
          : `🔔 उपचार रिमाइन्डर`,
        description: reminder.isOverdue
          ? `${reminder.diseaseName} को उपचार ${Math.abs(reminder.daysRemaining)} दिन बिलम्ब भयो`
          : `${reminder.diseaseName} को उपचार भोलि गर्नुहोस्`,
        variant: reminder.isOverdue ? 'destructive' : 'default',
        duration: 10000,
      });

      // Show browser push notification if permitted
      if (Notification.permission === 'granted') {
        showLocalNotification(
          reminder.isOverdue ? '⚠️ उपचार बिलम्ब!' : '🔔 उपचार रिमाइन्डर',
          {
            body: reminder.isOverdue
              ? `${reminder.diseaseName} को उपचार ${Math.abs(reminder.daysRemaining)} दिन बिलम्ब भयो। कृपया तुरुन्तै उपचार गर्नुहोस्।`
              : `${reminder.diseaseName} को उपचार भोलि गर्नुहोस्।`,
            tag: `treatment-${reminder.id}`,
            requireInteraction: true,
          }
        );
      }

      shownIds.add(notificationKey);
    });

    saveShownNotifications(shownIds);
    localStorage.setItem(NOTIFICATION_CHECK_KEY, now.toISOString());
  }, [user, reminders, toast, getShownNotifications, saveShownNotifications]);

  // Enable push notifications
  const enableNotifications = useCallback(async () => {
    if (!isPushSupported()) {
      toast({
        title: 'सूचना समर्थित छैन',
        description: 'तपाईंको ब्राउजरले पुश सूचना समर्थन गर्दैन।',
        variant: 'destructive',
      });
      return false;
    }

    const permission = await requestNotificationPermission();
    
    if (permission === 'granted') {
      toast({
        title: '🔔 सूचना सक्षम भयो',
        description: 'अब तपाईंले उपचार रिमाइन्डर सूचना प्राप्त गर्नुहुनेछ।',
      });
      return true;
    } else {
      toast({
        title: 'सूचना अस्वीकृत',
        description: 'ब्राउजर सेटिङमा गएर सूचना सक्षम गर्नुहोस्।',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Check notifications on mount and when reminders change
  useEffect(() => {
    if (!user || reminders.length === 0) return;

    // Check if we should show notifications (once per hour)
    const lastCheck = localStorage.getItem(NOTIFICATION_CHECK_KEY);
    const now = new Date();
    
    if (lastCheck) {
      const lastCheckDate = new Date(lastCheck);
      const hoursSinceLastCheck = (now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastCheck < 1) return;
    }

    // Small delay to ensure page is loaded
    const timer = setTimeout(() => {
      checkAndShowNotifications();
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, reminders, checkAndShowNotifications]);

  return {
    enableNotifications,
    isPushSupported: isPushSupported(),
    notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
    overdueCount: reminders.filter(r => r.isOverdue).length,
    upcomingCount: reminders.filter(r => !r.isOverdue && r.daysRemaining <= 7).length,
  };
}
