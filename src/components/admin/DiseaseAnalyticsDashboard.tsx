import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { 
  Bug, TrendingUp, AlertTriangle, MapPin, Calendar, 
  Download, RefreshCw, Loader2, Users, Image
} from 'lucide-react';
import { NepalDiseaseMap } from './NepalDiseaseMap';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const SEVERITY_COLORS: Record<string, string> = {
  high: 'hsl(var(--destructive))',
  medium: 'hsl(var(--warning))',
  low: 'hsl(var(--success))',
};

interface DiseaseDetection {
  id: string;
  farmer_id: string;
  image_url: string;
  detected_disease: string | null;
  severity: string | null;
  confidence_score: number | null;
  analyzed_at: string;
  created_at: string;
}

export function DiseaseAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        now.setDate(now.getDate() - 7);
        break;
      case '30d':
        now.setDate(now.getDate() - 30);
        break;
      case '90d':
        now.setDate(now.getDate() - 90);
        break;
      default:
        return null;
    }
    return now.toISOString();
  };

  // Fetch all disease detections
  const { data: allDetections, isLoading, refetch } = useQuery({
    queryKey: ['admin-disease-detections', timeRange],
    queryFn: async () => {
      let query = supabase
        .from('disease_detections')
        .select('*')
        .order('analyzed_at', { ascending: false });

      const dateFrom = getDateRange();
      if (dateFrom) {
        query = query.gte('analyzed_at', dateFrom);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DiseaseDetection[];
    },
  });

  // Fetch farmer profiles for location data
  const { data: farmerProfiles } = useQuery({
    queryKey: ['admin-farmer-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farmer_profiles')
        .select('id, full_name, district, state');
      if (error) throw error;
      return data;
    },
  });

  // Fetch outbreak alerts
  const { data: outbreakAlerts } = useQuery({
    queryKey: ['admin-outbreak-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disease_outbreak_alerts')
        .select('*')
        .order('detection_count', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Calculate statistics
  const stats = {
    totalDetections: allDetections?.length || 0,
    highSeverity: allDetections?.filter(d => d.severity === 'high').length || 0,
    mediumSeverity: allDetections?.filter(d => d.severity === 'medium').length || 0,
    lowSeverity: allDetections?.filter(d => d.severity === 'low').length || 0,
    activeOutbreaks: outbreakAlerts?.filter(a => a.is_active).length || 0,
    uniqueFarmers: new Set(allDetections?.map(d => d.farmer_id)).size,
  };

  // Disease frequency data
  const diseaseFrequency = allDetections?.reduce((acc, d) => {
    const disease = d.detected_disease || 'Unknown';
    acc[disease] = (acc[disease] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const diseaseChartData = Object.entries(diseaseFrequency || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name: name.substring(0, 20), value }));

  // Severity distribution
  const severityData = [
    { name: 'गम्भीर', value: stats.highSeverity, color: SEVERITY_COLORS.high },
    { name: 'मध्यम', value: stats.mediumSeverity, color: SEVERITY_COLORS.medium },
    { name: 'सामान्य', value: stats.lowSeverity, color: SEVERITY_COLORS.low },
  ].filter(d => d.value > 0);

  // Time series data
  const timeSeriesData = allDetections?.reduce((acc, d) => {
    const date = new Date(d.analyzed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.count++;
      if (d.severity === 'high') existing.high++;
      if (d.severity === 'medium') existing.medium++;
      if (d.severity === 'low') existing.low++;
    } else {
      acc.push({
        date,
        count: 1,
        high: d.severity === 'high' ? 1 : 0,
        medium: d.severity === 'medium' ? 1 : 0,
        low: d.severity === 'low' ? 1 : 0,
      });
    }
    return acc;
  }, [] as { date: string; count: number; high: number; medium: number; low: number }[]) || [];

  // District distribution
  const farmerMap = new Map(farmerProfiles?.map(f => [f.id, f]));
  const districtData = allDetections?.reduce((acc, d) => {
    const farmer = farmerMap.get(d.farmer_id);
    const district = farmer?.district || 'Unknown';
    acc[district] = (acc[district] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const districtChartData = Object.entries(districtData || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // Recent detections with images
  const recentDetections = allDetections?.slice(0, 20).map(d => {
    const farmer = farmerMap.get(d.farmer_id);
    return {
      ...d,
      farmerName: farmer?.full_name || 'Unknown',
      district: farmer?.district || 'Unknown',
    };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bug className="h-6 w-6" />
            रोग विश्लेषण ड्यासबोर्ड
          </h2>
          <p className="text-muted-foreground">Disease Analytics Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">७ दिन</SelectItem>
              <SelectItem value="30d">३० दिन</SelectItem>
              <SelectItem value="90d">९० दिन</SelectItem>
              <SelectItem value="all">सबै</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bug className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDetections}</p>
                <p className="text-xs text-muted-foreground">कुल रिपोर्ट</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.highSeverity}</p>
                <p className="text-xs text-muted-foreground">गम्भीर</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.mediumSeverity}</p>
                <p className="text-xs text-muted-foreground">मध्यम</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.lowSeverity}</p>
                <p className="text-xs text-muted-foreground">सामान्य</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeOutbreaks}</p>
                <p className="text-xs text-muted-foreground">प्रकोप</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniqueFarmers}</p>
                <p className="text-xs text-muted-foreground">किसान</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="reports">All Reports</TabsTrigger>
          <TabsTrigger value="gallery">Image Gallery</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Disease frequency chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top 10 Detected Diseases</CardTitle>
                <CardDescription>सबैभन्दा बढी पहिचान भएका रोगहरू</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={diseaseChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Severity distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Severity Distribution</CardTitle>
                <CardDescription>गम्भीरता अनुसार वितरण</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Time series and district charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Detection trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detection Trend</CardTitle>
                <CardDescription>समय अनुसार रिपोर्ट ट्रेन्ड</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={timeSeriesData.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="high" stackId="1" stroke={SEVERITY_COLORS.high} fill={SEVERITY_COLORS.high} name="गम्भीर" />
                    <Area type="monotone" dataKey="medium" stackId="1" stroke={SEVERITY_COLORS.medium} fill={SEVERITY_COLORS.medium} name="मध्यम" />
                    <Area type="monotone" dataKey="low" stackId="1" stroke={SEVERITY_COLORS.low} fill={SEVERITY_COLORS.low} name="सामान्य" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* District distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Districts</CardTitle>
                <CardDescription>जिल्ला अनुसार रिपोर्ट</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={districtChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map">
          <NepalDiseaseMap />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>All Disease Reports</CardTitle>
              <CardDescription>सबै रोग रिपोर्टहरू</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>मिति</TableHead>
                      <TableHead>किसान</TableHead>
                      <TableHead>जिल्ला</TableHead>
                      <TableHead>रोग</TableHead>
                      <TableHead>गम्भीरता</TableHead>
                      <TableHead>विश्वास</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDetections?.map(detection => (
                      <TableRow key={detection.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(detection.analyzed_at).toLocaleDateString('ne-NP')}
                        </TableCell>
                        <TableCell>{detection.farmerName}</TableCell>
                        <TableCell>{detection.district}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {detection.detected_disease || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {detection.severity && (
                            <Badge 
                              variant={detection.severity === 'high' ? 'destructive' : 
                                       detection.severity === 'medium' ? 'secondary' : 'outline'}
                            >
                              {detection.severity === 'high' ? 'गम्भीर' :
                               detection.severity === 'medium' ? 'मध्यम' : 'सामान्य'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {detection.confidence_score 
                            ? `${Math.round(detection.confidence_score * 100)}%` 
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Disease Image Gallery
              </CardTitle>
              <CardDescription>रोग छविहरूको ग्यालेरी</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {recentDetections?.filter(d => d.image_url?.startsWith('http')).map(detection => (
                  <motion.div
                    key={detection.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-muted"
                  >
                    <img
                      src={detection.image_url}
                      alt={detection.detected_disease || 'Disease detection'}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-xs truncate font-medium">
                          {detection.detected_disease || 'Unknown'}
                        </p>
                        <p className="text-white/70 text-[10px]">
                          {detection.district}
                        </p>
                      </div>
                    </div>
                    {detection.severity && (
                      <div className="absolute top-1 right-1">
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            detection.severity === 'high' ? 'bg-destructive' :
                            detection.severity === 'medium' ? 'bg-warning' : 'bg-success'
                          }`}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              {recentDetections?.filter(d => d.image_url?.startsWith('http')).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>कुनै छवि उपलब्ध छैन</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
