import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CloudRain, 
  Sun, 
  Thermometer, 
  Droplets, 
  Wind, 
  AlertTriangle,
  CheckCircle2,
  Sprout,
  Loader2,
  MapPin,
  RefreshCw,
  Calendar,
  CloudSun,
  Snowflake
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  condition: string;
  forecast: ForecastDay[];
}

interface ForecastDay {
  date: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  condition: string;
}

interface PlantingAlert {
  crop: string;
  crop_ne: string;
  icon: string;
  status: "ideal" | "good" | "caution" | "avoid";
  message_ne: string;
  reason: string;
  conditions: string[];
}

// Crop planting conditions
const cropConditions = [
  {
    id: "rice",
    name: "Rice",
    name_ne: "धान",
    icon: "🌾",
    idealTemp: { min: 25, max: 35 },
    idealHumidity: { min: 70, max: 90 },
    needsRain: true,
    avoidWind: true,
    season: [6, 7] // June-July
  },
  {
    id: "wheat",
    name: "Wheat",
    name_ne: "गहुँ",
    icon: "🌾",
    idealTemp: { min: 15, max: 25 },
    idealHumidity: { min: 50, max: 70 },
    needsRain: false,
    avoidWind: false,
    season: [11, 12] // Nov-Dec
  },
  {
    id: "maize",
    name: "Maize",
    name_ne: "मकै",
    icon: "🌽",
    idealTemp: { min: 20, max: 30 },
    idealHumidity: { min: 60, max: 80 },
    needsRain: true,
    avoidWind: true,
    season: [3, 4] // Mar-Apr
  },
  {
    id: "potato",
    name: "Potato",
    name_ne: "आलु",
    icon: "🥔",
    idealTemp: { min: 15, max: 22 },
    idealHumidity: { min: 60, max: 80 },
    needsRain: false,
    avoidWind: false,
    season: [10, 11] // Oct-Nov
  },
  {
    id: "tomato",
    name: "Tomato",
    name_ne: "गोलभेडा",
    icon: "🍅",
    idealTemp: { min: 18, max: 27 },
    idealHumidity: { min: 50, max: 70 },
    needsRain: false,
    avoidWind: true,
    season: [9, 10] // Sep-Oct
  },
  {
    id: "cauliflower",
    name: "Cauliflower",
    name_ne: "काउली",
    icon: "🥬",
    idealTemp: { min: 15, max: 22 },
    idealHumidity: { min: 60, max: 80 },
    needsRain: false,
    avoidWind: false,
    season: [8, 9] // Aug-Sep
  },
  {
    id: "mustard",
    name: "Mustard",
    name_ne: "तोरी",
    icon: "🌻",
    idealTemp: { min: 15, max: 25 },
    idealHumidity: { min: 50, max: 70 },
    needsRain: false,
    avoidWind: true,
    season: [10, 11] // Oct-Nov
  },
  {
    id: "chilli",
    name: "Chilli",
    name_ne: "खुर्सानी",
    icon: "🌶️",
    idealTemp: { min: 20, max: 30 },
    idealHumidity: { min: 60, max: 80 },
    needsRain: true,
    avoidWind: true,
    season: [2, 3] // Feb-Mar
  }
];

const WeatherPlantingAlerts = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [alerts, setAlerts] = useState<PlantingAlert[]>([]);

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-weather', {
        body: { latitude: lat, longitude: lon }
      });

      if (error) throw error;

      // Mock weather data if API fails
      const weatherData: WeatherData = data || {
        temperature: 25,
        humidity: 65,
        rainfall: 0,
        windSpeed: 12,
        condition: "Partly Cloudy",
        forecast: [
          { date: "Tomorrow", temperature: 26, humidity: 70, rainfall: 5, condition: "Light Rain" },
          { date: "Day 2", temperature: 24, humidity: 75, rainfall: 15, condition: "Rain" },
          { date: "Day 3", temperature: 27, humidity: 60, rainfall: 0, condition: "Sunny" },
        ]
      };

      setWeather(weatherData);
      generateAlerts(weatherData);
    } catch (error) {
      console.error('Error fetching weather:', error);
      // Use mock data on error
      const mockWeather: WeatherData = {
        temperature: 22,
        humidity: 68,
        rainfall: 0,
        windSpeed: 8,
        condition: "Sunny",
        forecast: [
          { date: "भोलि", temperature: 24, humidity: 65, rainfall: 0, condition: "Sunny" },
          { date: "२ दिन", temperature: 23, humidity: 70, rainfall: 10, condition: "Light Rain" },
          { date: "३ दिन", temperature: 25, humidity: 60, rainfall: 0, condition: "Sunny" },
        ]
      };
      setWeather(mockWeather);
      generateAlerts(mockWeather);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (weatherData: WeatherData) => {
    const currentMonth = new Date().getMonth() + 1;
    const newAlerts: PlantingAlert[] = [];

    cropConditions.forEach(crop => {
      const isInSeason = crop.season.includes(currentMonth) || 
        crop.season.includes(currentMonth - 1) || 
        crop.season.includes(currentMonth + 1);

      if (!isInSeason) return;

      const conditions: string[] = [];
      let score = 0;
      const maxScore = 4;

      // Temperature check
      if (weatherData.temperature >= crop.idealTemp.min && weatherData.temperature <= crop.idealTemp.max) {
        score += 1;
        conditions.push(`✓ तापक्रम उपयुक्त (${weatherData.temperature}°C)`);
      } else if (weatherData.temperature < crop.idealTemp.min) {
        conditions.push(`⚠ तापक्रम कम (${weatherData.temperature}°C < ${crop.idealTemp.min}°C)`);
      } else {
        conditions.push(`⚠ तापक्रम बढी (${weatherData.temperature}°C > ${crop.idealTemp.max}°C)`);
      }

      // Humidity check
      if (weatherData.humidity >= crop.idealHumidity.min && weatherData.humidity <= crop.idealHumidity.max) {
        score += 1;
        conditions.push(`✓ आर्द्रता उपयुक्त (${weatherData.humidity}%)`);
      } else {
        conditions.push(`⚠ आर्द्रता ${weatherData.humidity < crop.idealHumidity.min ? 'कम' : 'बढी'} (${weatherData.humidity}%)`);
      }

      // Rain check
      if (crop.needsRain) {
        if (weatherData.rainfall > 0 || weatherData.forecast.some(f => f.rainfall > 0)) {
          score += 1;
          conditions.push(`✓ पानी पर्ने सम्भावना छ`);
        } else {
          conditions.push(`⚠ पानीको कमी - सिँचाइ आवश्यक`);
        }
      } else {
        if (weatherData.rainfall === 0 && !weatherData.forecast.slice(0, 2).some(f => f.rainfall > 10)) {
          score += 1;
          conditions.push(`✓ सुक्खा मौसम`);
        } else {
          conditions.push(`⚠ पानी पर्ने सम्भावना - केही दिन पर्खनुहोस्`);
        }
      }

      // Wind check
      if (crop.avoidWind && weatherData.windSpeed > 20) {
        conditions.push(`⚠ हावा तेज (${weatherData.windSpeed} km/h)`);
      } else {
        score += 1;
        conditions.push(`✓ हावा सामान्य`);
      }

      // Determine status
      let status: "ideal" | "good" | "caution" | "avoid";
      let message_ne: string;
      let reason: string;

      if (score >= 4) {
        status = "ideal";
        message_ne = "रोप्नको लागि उत्तम समय!";
        reason = "All conditions are optimal";
      } else if (score >= 3) {
        status = "good";
        message_ne = "रोप्न सकिन्छ";
        reason = "Most conditions are favorable";
      } else if (score >= 2) {
        status = "caution";
        message_ne = "सावधानी अपनाउनुहोस्";
        reason = "Some conditions are not ideal";
      } else {
        status = "avoid";
        message_ne = "अहिले नरोप्नुहोस्";
        reason = "Conditions are unfavorable";
      }

      newAlerts.push({
        crop: crop.name,
        crop_ne: crop.name_ne,
        icon: crop.icon,
        status,
        message_ne,
        reason,
        conditions
      });
    });

    // Sort by status priority
    const statusOrder = { ideal: 0, good: 1, caution: 2, avoid: 3 };
    newAlerts.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    setAlerts(newAlerts);
  };

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lon: longitude });
          fetchWeather(latitude, longitude);
        },
        () => {
          // Default to Kathmandu if location denied
          setLocation({ lat: 27.7172, lon: 85.324 });
          fetchWeather(27.7172, 85.324);
        }
      );
    } else {
      setLocation({ lat: 27.7172, lon: 85.324 });
      fetchWeather(27.7172, 85.324);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ideal": return "bg-green-500";
      case "good": return "bg-blue-500";
      case "caution": return "bg-amber-500";
      case "avoid": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ideal": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "good": return <Sprout className="w-5 h-5 text-blue-500" />;
      case "caution": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "avoid": return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('rain')) return <CloudRain className="w-8 h-8 text-blue-500" />;
    if (lowerCondition.includes('cloud')) return <CloudSun className="w-8 h-8 text-gray-500" />;
    if (lowerCondition.includes('snow')) return <Snowflake className="w-8 h-8 text-cyan-500" />;
    return <Sun className="w-8 h-8 text-amber-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">मौसम डाटा लोड हुँदैछ...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Weather Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-primary" />
                हालको मौसम
              </CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {location ? `${location.lat.toFixed(2)}°N, ${location.lon.toFixed(2)}°E` : "Nepal"}
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => location && fetchWeather(location.lat, location.lon)}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {weather && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="col-span-2 md:col-span-1 flex items-center gap-3 p-3 rounded-lg bg-background/50">
                {getWeatherIcon(weather.condition)}
                <div>
                  <p className="text-2xl font-bold">{weather.temperature}°C</p>
                  <p className="text-xs text-muted-foreground">{weather.condition}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                <Droplets className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">{weather.humidity}%</p>
                  <p className="text-xs text-muted-foreground">आर्द्रता</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                <CloudRain className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="font-medium">{weather.rainfall} mm</p>
                  <p className="text-xs text-muted-foreground">वर्षा</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                <Wind className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">{weather.windSpeed} km/h</p>
                  <p className="text-xs text-muted-foreground">हावा</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{new Date().toLocaleDateString('ne-NP', { month: 'short', day: 'numeric' })}</p>
                  <p className="text-xs text-muted-foreground">आज</p>
                </div>
              </div>
            </div>
          )}

          {/* 3-Day Forecast */}
          {weather?.forecast && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-3">आगामी दिनहरू</p>
              <div className="grid grid-cols-3 gap-3">
                {weather.forecast.map((day, idx) => (
                  <div key={idx} className="text-center p-2 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">{day.date}</p>
                    <p className="font-medium">{day.temperature}°C</p>
                    {day.rainfall > 0 && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        <CloudRain className="w-3 h-3 mr-1" />
                        {day.rainfall}mm
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Planting Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-primary" />
            मौसम अनुसार रोप्ने सुझाव
          </CardTitle>
          <CardDescription>
            हालको मौसम अनुसार कुन बाली रोप्न उपयुक्त छ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className="space-y-4">
              {/* Ideal crops highlight */}
              {alerts.filter(a => a.status === "ideal").length > 0 && (
                <Alert className="border-green-500/30 bg-green-500/5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <AlertTitle className="text-green-700">रोप्नको लागि उत्तम समय!</AlertTitle>
                  <AlertDescription>
                    {alerts.filter(a => a.status === "ideal").map(a => a.crop_ne).join(", ")} रोप्न सक्नुहुन्छ
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                {alerts.map((alert, idx) => (
                  <motion.div
                    key={alert.crop}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={`border-l-4 ${
                      alert.status === 'ideal' ? 'border-l-green-500' :
                      alert.status === 'good' ? 'border-l-blue-500' :
                      alert.status === 'caution' ? 'border-l-amber-500' :
                      'border-l-red-500'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{alert.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{alert.crop_ne}</span>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs text-white ${getStatusColor(alert.status)}`}
                              >
                                {alert.message_ne}
                              </Badge>
                            </div>
                            <div className="space-y-1 mt-2">
                              {alert.conditions.map((condition, i) => (
                                <p key={i} className="text-xs text-muted-foreground">
                                  {condition}
                                </p>
                              ))}
                            </div>
                          </div>
                          {getStatusIcon(alert.status)}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>यो समयमा कुनै बाली रोप्ने मौसम छैन</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle>🌱 मौसम सुझावहरू</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {weather && weather.temperature > 30 && (
              <Alert>
                <Thermometer className="w-4 h-4" />
                <AlertTitle>गर्मी बढी छ</AlertTitle>
                <AlertDescription>
                  बिहान वा साँझ रोप्नुहोस्। सिँचाइ बढाउनुहोस्।
                </AlertDescription>
              </Alert>
            )}
            {weather && weather.humidity > 85 && (
              <Alert>
                <Droplets className="w-4 h-4" />
                <AlertTitle>आर्द्रता बढी छ</AlertTitle>
                <AlertDescription>
                  ढुसी रोग लाग्न सक्छ। बालीमा हावा लाग्ने बनाउनुहोस्।
                </AlertDescription>
              </Alert>
            )}
            {weather && weather.rainfall > 20 && (
              <Alert>
                <CloudRain className="w-4 h-4" />
                <AlertTitle>भारी वर्षा</AlertTitle>
                <AlertDescription>
                  पानी जम्न नदिनुहोस्। नाली बनाउनुहोस्।
                </AlertDescription>
              </Alert>
            )}
            {weather && weather.windSpeed > 25 && (
              <Alert>
                <Wind className="w-4 h-4" />
                <AlertTitle>तेज हावा</AlertTitle>
                <AlertDescription>
                  बिरुवाहरूलाई सहारा दिनुहोस्। छर्ने काम नगर्नुहोस्।
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherPlantingAlerts;