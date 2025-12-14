import { motion } from 'framer-motion';
import { Cloud, Thermometer, Droplets, Wind, Sun, CloudRain, Umbrella } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWeatherData } from '@/hooks/useFarmerData';
import { Skeleton } from '@/components/ui/skeleton';

interface WeatherWidgetProps {
  latitude?: number;
  longitude?: number;
}

export function WeatherWidget({ latitude, longitude }: WeatherWidgetProps) {
  const { data: weather, isLoading, error } = useWeatherData(latitude, longitude);

  if (!latitude || !longitude) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Cloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Add a plot with location to see weather</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !weather?.success) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Cloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Unable to load weather data</p>
        </CardContent>
      </Card>
    );
  }

  const { current, summary, farmingAdvisory } = weather;

  const getWeatherIcon = (code: number) => {
    if (code >= 61 && code <= 99) return <CloudRain className="w-8 h-8 text-blue-500" />;
    if (code >= 45 && code <= 48) return <Cloud className="w-8 h-8 text-gray-500" />;
    if (code >= 1 && code <= 3) return <Sun className="w-8 h-8 text-yellow-500" />;
    return <Sun className="w-8 h-8 text-yellow-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-500" />
              Weather
            </span>
            {getWeatherIcon(current?.weatherCode || 0)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Current Weather */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{Math.round(current?.temperature || 0)}°C</div>
              <div className="text-sm text-muted-foreground">{current?.description}</div>
            </div>
            <div className="text-right text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Droplets className="w-4 h-4" />
                {current?.humidity}%
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Wind className="w-4 h-4" />
                {current?.windSpeed} km/h
              </div>
            </div>
          </div>

          {/* 7-Day Summary */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <Thermometer className="w-4 h-4 mx-auto text-orange-500" />
              <div className="text-sm font-medium">{summary?.averageTemperature}°C</div>
              <div className="text-xs text-muted-foreground">Avg Temp</div>
            </div>
            <div className="text-center">
              <Umbrella className="w-4 h-4 mx-auto text-blue-500" />
              <div className="text-sm font-medium">{summary?.totalExpectedRainfall}mm</div>
              <div className="text-xs text-muted-foreground">Rainfall</div>
            </div>
            <div className="text-center">
              <CloudRain className="w-4 h-4 mx-auto text-gray-500" />
              <div className="text-sm font-medium">{summary?.rainyDays} days</div>
              <div className="text-xs text-muted-foreground">Rainy</div>
            </div>
          </div>

          {/* Farming Advisory */}
          {farmingAdvisory && farmingAdvisory.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">🌾 Farming Advisory</div>
              {farmingAdvisory.map((advice: string, i: number) => (
                <div key={i} className="text-xs p-2 bg-primary/5 rounded-lg text-muted-foreground">
                  {advice}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
