import { motion } from 'framer-motion';
import { 
  Bell, BellRing, Mail, MessageSquare, 
  AlertTriangle, CloudSun, Stethoscope, Loader2,
  Smartphone
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useTreatmentNotifications } from '@/hooks/useTreatmentNotifications';
import { useLanguage } from '@/hooks/useLanguage';

export function NotificationPreferencesCard() {
  const { language } = useLanguage();
  const { 
    preferences, 
    isLoading, 
    updatePreferences, 
    isUpdating 
  } = useNotificationPreferences();
  const { 
    enableNotifications, 
    isPushSupported, 
    notificationPermission 
  } = useTreatmentNotifications();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const handleToggle = (key: string, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  const isNepali = language === 'ne';

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {isNepali ? 'सूचना सेटिङहरू' : 'Notification Settings'}
            </CardTitle>
            <CardDescription className="text-sm">
              {isNepali 
                ? 'कुन अलर्टहरू प्राप्त गर्ने छनौट गर्नुहोस्' 
                : 'Choose which alerts you want to receive'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Push Notification Enable */}
        {isPushSupported && notificationPermission !== 'granted' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-primary/5 border border-primary/20"
          >
            <div className="flex items-center gap-3">
              <BellRing className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <h4 className="font-medium text-foreground">
                  {isNepali ? 'ब्राउजर सूचना सक्षम गर्नुहोस्' : 'Enable Browser Notifications'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {isNepali 
                    ? 'रिमाइन्डरहरू समयमा प्राप्त गर्न' 
                    : 'To receive reminders on time'}
                </p>
              </div>
              <Button onClick={enableNotifications} size="sm">
                {isNepali ? 'सक्षम' : 'Enable'}
              </Button>
            </div>
          </motion.div>
        )}

        {notificationPermission === 'granted' && (
          <div className="flex items-center gap-2 text-sm text-success">
            <Bell className="w-4 h-4" />
            {isNepali ? 'ब्राउजर सूचना सक्षम छ' : 'Browser notifications enabled'}
          </div>
        )}

        <Separator />

        {/* Notification Channels */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            {isNepali ? 'सूचना च्यानलहरू' : 'Notification Channels'}
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">
                    {isNepali ? 'पुश सूचना' : 'Push Notifications'}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isNepali ? 'ब्राउजरमा सूचना' : 'Notifications in browser'}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.push_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('push_enabled', checked)}
                disabled={isUpdating}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">
                    {isNepali ? 'इमेल सूचना' : 'Email Notifications'}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isNepali ? 'इमेलमा अलर्टहरू' : 'Alerts via email'}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.email_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
                disabled={isUpdating}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">
                    {isNepali ? 'SMS सूचना' : 'SMS Notifications'}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isNepali ? 'फोनमा SMS' : 'Text messages to phone'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {isNepali ? 'चाँडै आउँदैछ' : 'Coming Soon'}
                </Badge>
                <Switch
                  checked={preferences?.sms_enabled ?? false}
                  onCheckedChange={(checked) => handleToggle('sms_enabled', checked)}
                  disabled={true}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Alert Types */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {isNepali ? 'अलर्ट प्रकारहरू' : 'Alert Types'}
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {isNepali ? 'रोग प्रकोप अलर्ट' : 'Disease Outbreak Alerts'}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isNepali 
                      ? 'तपाईंको क्षेत्रमा रोग प्रकोपको सूचना' 
                      : 'Alerts when diseases spread in your area'}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.outbreak_alerts ?? true}
                onCheckedChange={(checked) => handleToggle('outbreak_alerts', checked)}
                disabled={isUpdating}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {isNepali ? 'उपचार रिमाइन्डर' : 'Treatment Reminders'}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isNepali 
                      ? 'उपचार गर्ने समयको सम्झना' 
                      : 'Reminders when treatments are due'}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.push_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('push_enabled', checked)}
                disabled={isUpdating}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                  <CloudSun className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {isNepali ? 'मौसम अलर्ट' : 'Weather Alerts'}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isNepali 
                      ? 'खराब मौसमको पूर्व सूचना' 
                      : 'Advance warning for bad weather'}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.weather_alerts ?? true}
                onCheckedChange={(checked) => handleToggle('weather_alerts', checked)}
                disabled={isUpdating}
              />
            </div>
          </div>
        </div>

        {isUpdating && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {isNepali ? 'सुरक्षित गर्दै...' : 'Saving...'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
