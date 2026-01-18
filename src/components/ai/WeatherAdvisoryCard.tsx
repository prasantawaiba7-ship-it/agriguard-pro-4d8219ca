import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Sun, Thermometer, Droplets, Wind, AlertTriangle, CloudSun, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface WeatherAdvisoryCardProps {
  language: 'ne' | 'hi' | 'en';
}

interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  condition: string;
  advisory: string[];
}

export function WeatherAdvisoryCard({ language }: WeatherAdvisoryCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Try to get user location, default to Kathmandu
        let lat = 27.7172;
        let lon = 85.324;

        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            lat = position.coords.latitude;
            lon = position.coords.longitude;
          } catch {
            // Use default Kathmandu coordinates
          }
        }

        const { data, error: fetchError } = await supabase.functions.invoke('fetch-weather', {
          body: { latitude: lat, longitude: lon, days: 3 }
        });

        if (fetchError) throw fetchError;

        if (data?.success) {
          setWeather({
            temperature: data.current?.temperature || 22,
            humidity: data.current?.humidity || 65,
            rainfall: data.summary?.totalExpectedRainfall || 0,
            condition: data.current?.description || 'Partly Cloudy',
            advisory: data.farmingAdvisory || []
          });
        } else {
          throw new Error('No weather data');
        }
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError(true);
        // Set fallback data
        setWeather({
          temperature: 22,
          humidity: 65,
          rainfall: 0,
          condition: 'Sunny',
          advisory: language === 'ne' 
            ? ['आज रोप्नको लागि राम्रो मौसम छ']
            : language === 'hi'
            ? ['आज बुआई के लिए अच्छा मौसम है']
            : ['Good weather for planting today']
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [language]);

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain')) return <CloudRain className="w-5 h-5 text-blue-500" />;
    if (lower.includes('cloud')) return <CloudSun className="w-5 h-5 text-gray-500" />;
    return <Sun className="w-5 h-5 text-amber-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 rounded-xl border border-border/50 bg-background/50">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">
          {language === 'ne' ? 'मौसम लोड हुँदैछ...' : language === 'hi' ? 'मौसम लोड हो रहा है...' : 'Loading weather...'}
        </span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border p-3 sm:p-4",
        weather.rainfall > 10 
          ? "border-blue-500/30 bg-blue-500/5" 
          : "border-primary/20 bg-primary/5"
      )}
    >
      {/* Weather Summary */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getWeatherIcon(weather.condition)}
          <span className="text-lg font-semibold">{weather.temperature}°C</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Droplets className="w-3 h-3" />
            {weather.humidity}%
          </span>
          {weather.rainfall > 0 && (
            <span className="flex items-center gap-1">
              <CloudRain className="w-3 h-3" />
              {weather.rainfall}mm
            </span>
          )}
        </div>
      </div>

      {/* Farming Advisory */}
      {weather.advisory.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <div className="flex items-start gap-2">
            {weather.rainfall > 15 ? (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <Sun className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            )}
            <p className="text-xs sm:text-sm text-foreground leading-relaxed">
              {weather.advisory[0]}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
