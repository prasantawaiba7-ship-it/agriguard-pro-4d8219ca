import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, AlertTriangle, CheckCircle, Clock, 
  ChevronLeft, ChevronRight, Bug, Leaf, Bell, BellRing
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTreatmentReminders } from '@/hooks/useDiseaseHistory';
import { useTreatmentNotifications } from '@/hooks/useTreatmentNotifications';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

export function TreatmentCalendar() {
  const { language } = useLanguage();
  const { data: reminders = [], isLoading } = useTreatmentReminders();
  const { 
    enableNotifications, 
    isPushSupported, 
    notificationPermission,
    overdueCount,
    upcomingCount 
  } = useTreatmentNotifications();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getRemindersForDay = (day: Date) => {
    return reminders.filter(r => 
      isSameDay(new Date(r.nextTreatmentDate), day)
    );
  };

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const overdueReminders = reminders.filter(r => r.isOverdue);
  const upcomingReminders = reminders.filter(r => !r.isOverdue && r.daysRemaining <= 7);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-pulse text-muted-foreground">
              {language === 'ne' ? 'लोड गर्दै...' : 'Loading...'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Push Notification Enable Card */}
      {isPushSupported && notificationPermission !== 'granted' && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <BellRing className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">
                {language === 'ne' ? 'पुश सूचना सक्षम गर्नुहोस्' : 'Enable Push Notifications'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ne' 
                  ? 'उपचार रिमाइन्डरहरू समयमा प्राप्त गर्नुहोस्' 
                  : 'Get treatment reminders on time'}
              </p>
            </div>
            <Button onClick={enableNotifications} size="sm" className="shrink-0">
              <Bell className="w-4 h-4 mr-1" />
              {language === 'ne' ? 'सक्षम' : 'Enable'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notification Status Badge */}
      {notificationPermission === 'granted' && (overdueCount > 0 || upcomingCount > 0) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bell className="w-4 h-4 text-success" />
          {language === 'ne' 
            ? `सूचना सक्षम • ${overdueCount} बिलम्ब, ${upcomingCount} आगामी` 
            : `Notifications on • ${overdueCount} overdue, ${upcomingCount} upcoming`}
        </div>
      )}

      {/* Alerts Section */}
      {(overdueReminders.length > 0 || upcomingReminders.length > 0) && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-warning" />
              {language === 'ne' ? 'उपचार रिमाइन्डरहरू' : 'Treatment Reminders'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueReminders.map(reminder => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{reminder.diseaseName}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ne' 
                      ? `${Math.abs(reminder.daysRemaining)} दिन बिलम्ब भयो` 
                      : `${Math.abs(reminder.daysRemaining)} days overdue`}
                  </p>
                </div>
                <Badge variant="destructive" className="shrink-0">
                  {language === 'ne' ? 'बिलम्ब' : 'Overdue'}
                </Badge>
              </motion.div>
            ))}
            
            {upcomingReminders.map(reminder => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20"
              >
                <Clock className="w-5 h-5 text-warning shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{reminder.diseaseName}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ne' 
                      ? `${reminder.daysRemaining} दिनमा उपचार गर्नुहोस्` 
                      : `Treatment in ${reminder.daysRemaining} days`}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 border-warning text-warning">
                  {format(new Date(reminder.nextTreatmentDate), 'MMM d')}
                </Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {language === 'ne' ? 'उपचार क्यालेन्डर' : 'Treatment Calendar'}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10" />
            ))}
            
            {daysInMonth.map(day => {
              const dayReminders = getRemindersForDay(day);
              const isToday = isSameDay(day, new Date());
              const hasReminders = dayReminders.length > 0;
              const hasOverdue = dayReminders.some(r => r.isOverdue);
              
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "h-10 rounded-lg flex flex-col items-center justify-center relative",
                    isToday && "ring-2 ring-primary",
                    hasReminders && !hasOverdue && "bg-warning/20",
                    hasOverdue && "bg-destructive/20"
                  )}
                >
                  <span className={cn(
                    "text-sm",
                    isToday && "font-bold text-primary"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {hasReminders && (
                    <div className="absolute bottom-0.5 flex gap-0.5">
                      {dayReminders.slice(0, 3).map((r, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            getSeverityColor(r.severity)
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span>{language === 'ne' ? 'गम्भीर' : 'Severe'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span>{language === 'ne' ? 'मध्यम' : 'Moderate'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>{language === 'ne' ? 'सामान्य' : 'Mild'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Detections */}
      {reminders.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bug className="w-4 h-4" />
              {language === 'ne' ? 'हालैका पहिचानहरू' : 'Recent Detections'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reminders.slice(0, 5).map(reminder => (
              <div
                key={reminder.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  getSeverityColor(reminder.severity)
                )}>
                  <Bug className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{reminder.diseaseName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(reminder.detectedAt), 'MMM d, yyyy')}
                  </p>
                </div>
                {reminder.treatment && (
                  <span title={reminder.treatment}>
                    <Leaf className="w-4 h-4 text-success shrink-0" />
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {reminders.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success/50" />
              <p className="font-medium">
                {language === 'ne' ? 'कुनै उपचार रिमाइन्डर छैन' : 'No treatment reminders'}
              </p>
              <p className="text-sm mt-1">
                {language === 'ne' 
                  ? 'रोग पहिचान गर्दा रिमाइन्डर थपिनेछ' 
                  : 'Reminders will appear after disease detection'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
