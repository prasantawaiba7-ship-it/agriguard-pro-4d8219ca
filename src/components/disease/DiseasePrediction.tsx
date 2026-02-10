import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Brain, Calendar, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface DiseaseDetection {
  id: string;
  detected_disease: string | null;
  severity: string | null;
  analyzed_at: string;
  farmer_id: string;
}

interface Prediction {
  disease: string;
  currentTrend: 'rising' | 'falling' | 'stable';
  riskLevel: 'high' | 'medium' | 'low';
  confidence: number;
  predictedIncrease: number;
  reasoning: string;
}

// Linear regression for trend prediction
function linearRegression(data: number[]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0, r2: 0 };

  const xMean = (n - 1) / 2;
  const yMean = data.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (data[i] - yMean);
    denominator += (i - xMean) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Calculate R²
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept;
    ssRes += (data[i] - predicted) ** 2;
    ssTot += (data[i] - yMean) ** 2;
  }
  const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, r2 };
}

export function DiseasePrediction() {
  const [timeRange, setTimeRange] = useState<'30d' | '60d' | '90d'>('30d');
  const { t, language } = useLanguage();

  // Fetch historical disease data
  const { data: detections, isLoading } = useQuery({
    queryKey: ['disease-predictions-data', timeRange],
    queryFn: async () => {
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('disease_detections')
        .select('id, detected_disease, severity, analyzed_at, farmer_id')
        .gte('analyzed_at', startDate.toISOString())
        .order('analyzed_at', { ascending: true });

      if (error) throw error;
      return data as DiseaseDetection[];
    },
  });

  // Get unique diseases
  const diseases = useMemo(() => {
    if (!detections) return [];
    const diseaseSet = new Set(detections.map(d => d.detected_disease).filter(Boolean));
    return Array.from(diseaseSet) as string[];
  }, [detections]);

  // Process time series data
  const timeSeriesData = useMemo(() => {
    if (!detections) return [];

    // Group by date
    const dateGroups: Record<string, { total: number; byDisease: Record<string, number> }> = {};
    
    detections.forEach(d => {
      const date = new Date(d.analyzed_at).toISOString().split('T')[0];
      if (!dateGroups[date]) {
        dateGroups[date] = { total: 0, byDisease: {} };
      }
      dateGroups[date].total++;
      
      if (d.detected_disease) {
        dateGroups[date].byDisease[d.detected_disease] = 
          (dateGroups[date].byDisease[d.detected_disease] || 0) + 1;
      }
    });

    // Convert to array and sort
    return Object.entries(dateGroups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US', { month: 'short', day: 'numeric' }),
        fullDate: date,
        total: data.total,
        ...data.byDisease,
      }));
  }, [detections, language]);

  // Calculate predictions
  const predictions = useMemo(() => {
    if (!detections || detections.length < 7) return [];

    const predictionResults: Prediction[] = [];

    diseases.forEach(disease => {
      const diseaseDetections = detections.filter(d => d.detected_disease === disease);
      
      if (diseaseDetections.length < 3) return;

      // Group by week
      const weeklyData: number[] = [];
      const weeks = Math.ceil(parseInt(timeRange) / 7);
      
      for (let w = 0; w < weeks; w++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - parseInt(timeRange) + (w * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const count = diseaseDetections.filter(d => {
          const date = new Date(d.analyzed_at);
          return date >= weekStart && date < weekEnd;
        }).length;
        
        weeklyData.push(count);
      }

      if (weeklyData.length < 2) return;

      // Calculate trend using linear regression
      const { slope, r2 } = linearRegression(weeklyData);
      
      // Determine trend direction
      let trend: 'rising' | 'falling' | 'stable';
      if (slope > 0.5) trend = 'rising';
      else if (slope < -0.5) trend = 'falling';
      else trend = 'stable';

      // Calculate risk level based on recent detections and trend
      const recentCount = weeklyData.slice(-2).reduce((a, b) => a + b, 0);
      const highSeverityCount = diseaseDetections.filter(d => d.severity === 'high').length;
      
      let riskLevel: 'high' | 'medium' | 'low';
      if (trend === 'rising' && recentCount > 5) riskLevel = 'high';
      else if (trend === 'rising' || recentCount > 3) riskLevel = 'medium';
      else riskLevel = 'low';

      // Boost risk if many high severity cases
      if (highSeverityCount > diseaseDetections.length * 0.5) {
        riskLevel = riskLevel === 'low' ? 'medium' : 'high';
      }

      // Calculate predicted increase
      const predictedIncrease = Math.round(slope * 2 * 10) / 10; // Next 2 weeks

      // Generate reasoning
      // Using simple string logic for now, could be improved with t()
      let reasoning = '';
      if (trend === 'rising') {
        reasoning = language === 'ne' 
          ? `पछिल्लो ${timeRange.replace('d', '')} दिनमा बढ्दो प्रवृत्ति देखिएको छ। `
          : `Rising trend observed in last ${timeRange.replace('d', '')} days. `;
        
        if (riskLevel === 'high') {
          reasoning += language === 'ne' ? 'तत्काल सावधानी आवश्यक।' : 'Immediate attention required.';
        } else {
          reasoning += language === 'ne' ? 'नियमित निरीक्षण गर्नुहोस्।' : 'Inspect regularly.';
        }
      } else if (trend === 'falling') {
        reasoning = language === 'ne' 
          ? 'रोगको प्रभाव घट्दै गइरहेको छ। सावधानी जारी राख्नुहोस्।'
          : 'Disease impact is decreasing. Maintain caution.';
      } else {
        reasoning = language === 'ne'
          ? 'स्थिर अवस्थामा छ। नियमित बाली जाँच गर्नुहोस्।'
          : 'Stable condition. Check crops regularly.';
      }

      predictionResults.push({
        disease,
        currentTrend: trend,
        riskLevel,
        confidence: Math.min(0.95, Math.max(0.6, r2 + 0.3)),
        predictedIncrease,
        reasoning,
      });
    });

    // Sort by risk level
    return predictionResults.sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });
  }, [detections, diseases, timeRange, language]);

  // Forecast data for chart
  const forecastData = useMemo(() => {
    if (timeSeriesData.length < 7) return [];

    const recentData = timeSeriesData.slice(-14);
    const totals = recentData.map(d => d.total);
    const { slope, intercept } = linearRegression(totals);

    // Create forecast array with proper typing
    const forecast: Array<{ date: string; fullDate: string; total: number; forecast?: number }> = 
      recentData.map(d => ({
        date: d.date,
        fullDate: d.fullDate,
        total: d.total,
        forecast: undefined,
      }));

    // Add forecast points
    for (let i = 1; i <= 7; i++) {
      const predictedValue = Math.max(0, Math.round(slope * (totals.length + i - 1) + intercept));
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);
      
      forecast.push({
        date: forecastDate.toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US', { month: 'short', day: 'numeric' }),
        fullDate: forecastDate.toISOString().split('T')[0],
        total: 0,
        forecast: predictedValue,
      });
    }

    return forecast;
  }, [timeSeriesData, language]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {t('diseaseTrendPrediction')}
          </h3>
          <p className="text-sm text-muted-foreground">Disease Trend Prediction</p>
        </div>
        <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">{t('days30')}</SelectItem>
            <SelectItem value="60d">{t('days60')}</SelectItem>
            <SelectItem value="90d">{t('days90')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Predictions Grid */}
      {predictions.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictions.slice(0, 6).map((pred, index) => (
            <motion.div
              key={pred.disease}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`h-full ${
                pred.riskLevel === 'high' ? 'border-destructive/50' :
                pred.riskLevel === 'medium' ? 'border-warning/50' : ''
              }`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base truncate" title={pred.disease}>
                      {pred.disease.substring(0, 25)}
                      {pred.disease.length > 25 ? '...' : ''}
                    </CardTitle>
                    <Badge 
                      variant={pred.riskLevel === 'high' ? 'destructive' : 
                               pred.riskLevel === 'medium' ? 'secondary' : 'outline'}
                    >
                      {pred.riskLevel === 'high' ? t('highRisk') :
                       pred.riskLevel === 'medium' ? t('mediumRisk') : t('lowRisk')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    {pred.currentTrend === 'rising' ? (
                      <div className="flex items-center gap-1 text-destructive">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('rising')}</span>
                      </div>
                    ) : pred.currentTrend === 'falling' ? (
                      <div className="flex items-center gap-1 text-success">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('falling')}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">{t('stable')}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      ({Math.round(pred.confidence * 100)}% {t('confidenceLabel')})
                    </span>
                  </div>
                  
                  {pred.predictedIncrease !== 0 && (
                    <div className="text-sm mb-2">
                      <span className="text-muted-foreground">{t('predictedChange')}</span>
                      <span className={`ml-1 font-medium ${
                        pred.predictedIncrease > 0 ? 'text-destructive' : 'text-success'
                      }`}>
                        {pred.predictedIncrease > 0 ? '+' : ''}{pred.predictedIncrease} {t('casesPerWeek')}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">{pred.reasoning}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('insufficientData')}</p>
            <p className="text-xs mt-1">{t('need7DaysData')}</p>
          </CardContent>
        </Card>
      )}

      {/* Forecast Chart */}
      {forecastData.length > 7 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('forecast7Days')}
            </CardTitle>
            <CardDescription>{t('forecastSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  name={t('actual')}
                />
                <Area 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="hsl(var(--warning))" 
                  fill="hsl(var(--warning))"
                  fillOpacity={0.3}
                  strokeDasharray="5 5"
                  name={t('forecast')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* High Risk Alert */}
      {predictions.some(p => p.riskLevel === 'high' && p.currentTrend === 'rising') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive mb-1">⚠️ {t('highRiskWarning')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('highRiskText')}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {predictions
                      .filter(p => p.riskLevel === 'high' && p.currentTrend === 'rising')
                      .map(p => (
                        <Badge key={p.disease} variant="destructive">
                          {p.disease.substring(0, 20)}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}