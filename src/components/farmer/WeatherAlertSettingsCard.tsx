import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWeatherAlertSettings } from '@/hooks/useWeatherAlertSettings';
import { useAuth } from '@/hooks/useAuth';
import { CloudRain, Thermometer, Snowflake, Droplets, Bell } from 'lucide-react';

export function WeatherAlertSettingsCard() {
  const { user } = useAuth();
  const { settings, isLoading, updateSettings } = useWeatherAlertSettings();

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return null;
  }

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    await updateSettings({ [key]: value });
  };

  const handleTimeChange = async (value: string) => {
    await updateSettings({ preferred_time: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          मौसम Alert Settings
        </CardTitle>
        <CardDescription>
          कुन-कुन मौसम alert प्राप्त गर्ने छान्नुहोस्
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master toggle */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <Label className="text-base font-medium">मौसम Alerts</Label>
              <p className="text-sm text-muted-foreground">सबै मौसम सूचनाहरू</p>
            </div>
          </div>
          <Switch
            checked={settings.enable_weather_alerts}
            onCheckedChange={(checked) => handleToggle('enable_weather_alerts', checked)}
          />
        </div>

        {settings.enable_weather_alerts && (
          <>
            {/* Individual alert toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CloudRain className="h-5 w-5 text-blue-500" />
                  <div>
                    <Label className="font-medium">भारी वर्षा Alert</Label>
                    <p className="text-sm text-muted-foreground">25mm+ पानी वा 80%+ सम्भावना</p>
                  </div>
                </div>
                <Switch
                  checked={settings.enable_rain_alert}
                  onCheckedChange={(checked) => handleToggle('enable_rain_alert', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Droplets className="h-5 w-5 text-green-500" />
                  <div>
                    <Label className="font-medium">Spray Window Alert</Label>
                    <p className="text-sm text-muted-foreground">औषधि छर्न उपयुक्त समय</p>
                  </div>
                </div>
                <Switch
                  checked={settings.enable_spray_alert}
                  onCheckedChange={(checked) => handleToggle('enable_spray_alert', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Thermometer className="h-5 w-5 text-red-500" />
                  <div>
                    <Label className="font-medium">उच्च तापक्रम Alert</Label>
                    <p className="text-sm text-muted-foreground">35°C भन्दा बढी</p>
                  </div>
                </div>
                <Switch
                  checked={settings.enable_heat_alert}
                  onCheckedChange={(checked) => handleToggle('enable_heat_alert', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Snowflake className="h-5 w-5 text-cyan-500" />
                  <div>
                    <Label className="font-medium">चिसो/हिउँ Alert</Label>
                    <p className="text-sm text-muted-foreground">5°C भन्दा कम</p>
                  </div>
                </div>
                <Switch
                  checked={settings.enable_cold_alert}
                  onCheckedChange={(checked) => handleToggle('enable_cold_alert', checked)}
                />
              </div>
            </div>

            {/* Preferred time */}
            <div className="pt-4 border-t">
              <Label className="mb-2 block">Alert पठाउने समय</Label>
              <Select value={settings.preferred_time} onValueChange={handleTimeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">बिहान (5:00 AM)</SelectItem>
                  <SelectItem value="afternoon">दिउँसो (12:00 PM)</SelectItem>
                  <SelectItem value="evening">साँझ (6:00 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
