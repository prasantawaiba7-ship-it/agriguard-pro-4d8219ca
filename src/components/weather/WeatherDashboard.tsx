import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeatherWidget } from '@/components/farmer/WeatherWidget';
import { WeatherAlertsPanel } from './WeatherAlertsPanel';
import { WeatherAlertSettingsCard } from '@/components/farmer/WeatherAlertSettingsCard';
import { useAuth } from '@/hooks/useAuth';
import { usePlots } from '@/hooks/useFarmerData';
import { 
  Cloud, Bell, Settings, Thermometer, Droplets, 
  Wind, Sun, CloudRain, MapPin
} from 'lucide-react';

export function WeatherDashboard() {
  const { profile } = useAuth();
  const { data: plots } = usePlots();
  const [activeTab, setActiveTab] = useState('current');

  // Get location from profile or first plot
  const firstPlotWithLocation = plots?.find(p => p.latitude && p.longitude);
  const latitude = firstPlotWithLocation?.latitude || 27.7172; // Default: Kathmandu
  const longitude = firstPlotWithLocation?.longitude || 85.3240;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Cloud className="h-6 w-6 text-primary" />
            मौसम
          </h2>
          <p className="text-muted-foreground text-sm">
            {profile?.district || 'Nepal'} को मौसम र सुझाव
          </p>
        </div>
        {firstPlotWithLocation && (
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {firstPlotWithLocation.district || 'Location detected'}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current" className="gap-2">
            <Sun className="h-4 w-4" />
            <span className="hidden sm:inline">हालको</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">अलर्ट</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">सेटिङ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Main Weather Widget */}
            <WeatherWidget latitude={latitude} longitude={longitude} />

            {/* Weather Stats */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">मौसम विवरण</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <Thermometer className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <div className="text-sm text-muted-foreground">तापक्रम</div>
                    <div className="font-semibold">अनुकूल</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <Droplets className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-sm text-muted-foreground">आर्द्रता</div>
                    <div className="font-semibold">राम्रो</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <Wind className="h-6 w-6 mx-auto mb-2 text-cyan-500" />
                    <div className="text-sm text-muted-foreground">हावा</div>
                    <div className="font-semibold">कम</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <CloudRain className="h-6 w-6 mx-auto mb-2 text-gray-500" />
                    <div className="text-sm text-muted-foreground">वर्षा</div>
                    <div className="font-semibold">कम</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <h4 className="font-medium text-success mb-2">🌱 कृषि सुझाव</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• आज सिंचाइको लागि उपयुक्त दिन</li>
                    <li>• कीटनाशक छर्ने राम्रो मौका</li>
                    <li>• आगामी ३ दिन पानी नपर्ने</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <WeatherAlertsPanel />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <WeatherAlertSettingsCard />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
