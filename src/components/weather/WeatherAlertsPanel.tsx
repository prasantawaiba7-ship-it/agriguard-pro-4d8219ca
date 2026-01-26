import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWeatherAlerts } from '@/hooks/useWeatherAlerts';
import { 
  Bell, CloudRain, Thermometer, Wind, Droplets, 
  Check, AlertTriangle, Info, CheckCheck, Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const alertIcons: Record<string, React.ReactNode> = {
  heavy_rain: <CloudRain className="h-5 w-5 text-blue-500" />,
  spray_window: <Droplets className="h-5 w-5 text-green-500" />,
  heat_stress: <Thermometer className="h-5 w-5 text-orange-500" />,
  cold_wave: <Wind className="h-5 w-5 text-cyan-500" />,
};

const severityColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

export function WeatherAlertsPanel() {
  const { alerts, isLoading, unreadCount, markAsRead, markAllAsRead } = useWeatherAlerts();

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              मौसम अलर्टहरू
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                सबै पढेको
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>कुनै मौसम अलर्ट छैन</p>
              <p className="text-sm mt-1">
                अलर्ट सेटिङ्समा गई अलर्टहरू सक्रिय गर्नुहोस्
              </p>
            </div>
          ) : (
            alerts.slice(0, 10).map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border transition-colors ${
                  alert.is_read 
                    ? 'bg-muted/30 border-border' 
                    : 'bg-primary/5 border-primary/20'
                }`}
                onClick={() => !alert.is_read && markAsRead(alert.id)}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {alertIcons[alert.alert_type] || <AlertTriangle className="h-5 w-5 text-warning" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-medium ${alert.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {alert.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs flex-shrink-0 ${severityColors[alert.severity] || severityColors.info}`}
                      >
                        {alert.severity === 'critical' ? 'गम्भीर' : alert.severity === 'warning' ? 'सावधान' : 'जानकारी'}
                      </Badge>
                    </div>
                    <p className={`text-sm mt-1 ${alert.is_read ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                      {alert.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.date_sent), { addSuffix: true })}
                      </span>
                      {!alert.is_read && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          पढेको
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
