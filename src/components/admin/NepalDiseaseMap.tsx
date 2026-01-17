import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, MapPin, Bug } from 'lucide-react';

// Nepal districts with approximate positions (simplified SVG coordinates)
const NEPAL_DISTRICTS = [
  // Province 1 (Koshi)
  { name: 'Jhapa', x: 88, y: 45, province: 1 },
  { name: 'Ilam', x: 83, y: 35, province: 1 },
  { name: 'Morang', x: 80, y: 48, province: 1 },
  { name: 'Sunsari', x: 75, y: 50, province: 1 },
  { name: 'Dhankuta', x: 70, y: 38, province: 1 },
  { name: 'Panchthar', x: 85, y: 30, province: 1 },
  // Province 2 (Madhesh)
  { name: 'Saptari', x: 68, y: 55, province: 2 },
  { name: 'Siraha', x: 62, y: 58, province: 2 },
  { name: 'Dhanusha', x: 55, y: 60, province: 2 },
  { name: 'Mahottari', x: 50, y: 62, province: 2 },
  { name: 'Sarlahi', x: 45, y: 58, province: 2 },
  { name: 'Rautahat', x: 40, y: 60, province: 2 },
  { name: 'Bara', x: 35, y: 62, province: 2 },
  { name: 'Parsa', x: 30, y: 65, province: 2 },
  // Province 3 (Bagmati)
  { name: 'Kathmandu', x: 38, y: 42, province: 3 },
  { name: 'Lalitpur', x: 40, y: 45, province: 3 },
  { name: 'Bhaktapur', x: 42, y: 40, province: 3 },
  { name: 'Kavrepalanchok', x: 48, y: 38, province: 3 },
  { name: 'Sindhupalchok', x: 45, y: 28, province: 3 },
  { name: 'Rasuwa', x: 38, y: 22, province: 3 },
  { name: 'Nuwakot', x: 35, y: 32, province: 3 },
  { name: 'Dhading', x: 30, y: 38, province: 3 },
  { name: 'Makwanpur', x: 35, y: 52, province: 3 },
  { name: 'Chitwan', x: 28, y: 55, province: 3 },
  // Province 4 (Gandaki)
  { name: 'Kaski', x: 22, y: 38, province: 4 },
  { name: 'Lamjung', x: 28, y: 32, province: 4 },
  { name: 'Tanahun', x: 25, y: 45, province: 4 },
  { name: 'Gorkha', x: 32, y: 28, province: 4 },
  { name: 'Syangja', x: 18, y: 45, province: 4 },
  { name: 'Nawalparasi East', x: 22, y: 52, province: 4 },
  // Province 5 (Lumbini)
  { name: 'Rupandehi', x: 15, y: 55, province: 5 },
  { name: 'Kapilvastu', x: 12, y: 60, province: 5 },
  { name: 'Nawalparasi West', x: 18, y: 58, province: 5 },
  { name: 'Palpa', x: 15, y: 48, province: 5 },
  { name: 'Gulmi', x: 12, y: 42, province: 5 },
  { name: 'Arghakhanchi', x: 10, y: 48, province: 5 },
  // Province 6 (Karnali)
  { name: 'Surkhet', x: 8, y: 35, province: 6 },
  { name: 'Dailekh', x: 10, y: 28, province: 6 },
  { name: 'Jumla', x: 8, y: 20, province: 6 },
  { name: 'Dolpa', x: 12, y: 15, province: 6 },
  { name: 'Mugu', x: 8, y: 12, province: 6 },
  { name: 'Humla', x: 5, y: 8, province: 6 },
  // Province 7 (Sudurpashchim)
  { name: 'Kailali', x: 5, y: 48, province: 7 },
  { name: 'Kanchanpur', x: 2, y: 55, province: 7 },
  { name: 'Doti', x: 5, y: 35, province: 7 },
  { name: 'Dadeldhura', x: 3, y: 42, province: 7 },
  { name: 'Baitadi', x: 2, y: 32, province: 7 },
  { name: 'Darchula', x: 2, y: 22, province: 7 },
];

const PROVINCE_COLORS: Record<number, string> = {
  1: 'hsl(var(--chart-1))',
  2: 'hsl(var(--chart-2))',
  3: 'hsl(var(--chart-3))',
  4: 'hsl(var(--chart-4))',
  5: 'hsl(var(--chart-5))',
  6: 'hsl(210, 70%, 50%)',
  7: 'hsl(280, 70%, 50%)',
};

interface OutbreakData {
  district: string;
  disease_name: string;
  detection_count: number;
  severity: string;
  is_active: boolean;
}

export function NepalDiseaseMap() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Fetch outbreak alerts
  const { data: outbreakAlerts, isLoading } = useQuery({
    queryKey: ['all-outbreak-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disease_outbreak_alerts')
        .select('*')
        .eq('is_active', true)
        .order('detection_count', { ascending: false });

      if (error) throw error;
      return data as OutbreakData[];
    },
  });

  // Fetch disease detections grouped by district
  const { data: districtStats } = useQuery({
    queryKey: ['district-disease-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disease_detections')
        .select(`
          id,
          detected_disease,
          severity,
          farmer_id
        `)
        .not('detected_disease', 'is', null);

      if (error) throw error;

      // Get farmer locations
      const farmerIds = [...new Set(data?.map(d => d.farmer_id) || [])];
      const { data: farmers } = await supabase
        .from('farmer_profiles')
        .select('id, district, state')
        .in('id', farmerIds);

      const farmerMap = new Map(farmers?.map(f => [f.id, f]));

      // Group by district
      const districtData: Record<string, { count: number; diseases: Set<string>; severities: string[] }> = {};
      
      data?.forEach(detection => {
        const farmer = farmerMap.get(detection.farmer_id);
        if (farmer?.district) {
          if (!districtData[farmer.district]) {
            districtData[farmer.district] = { count: 0, diseases: new Set(), severities: [] };
          }
          districtData[farmer.district].count++;
          if (detection.detected_disease) {
            districtData[farmer.district].diseases.add(detection.detected_disease);
          }
          if (detection.severity) {
            districtData[farmer.district].severities.push(detection.severity);
          }
        }
      });

      return districtData;
    },
  });

  // Calculate map data with outbreak info
  const mapData = useMemo(() => {
    return NEPAL_DISTRICTS.map(district => {
      const outbreak = outbreakAlerts?.find(
        a => a.district.toLowerCase() === district.name.toLowerCase()
      );
      const stats = districtStats?.[district.name];
      
      return {
        ...district,
        hasOutbreak: !!outbreak,
        outbreakData: outbreak,
        detectionCount: stats?.count || 0,
        diseases: stats?.diseases ? Array.from(stats.diseases) : [],
        severity: outbreak?.severity || (stats?.severities?.[0]) || null,
      };
    });
  }, [outbreakAlerts, districtStats]);

  const filteredMapData = mapData.filter(d => {
    if (filterSeverity === 'all') return true;
    return d.severity === filterSeverity;
  });

  const selectedDistrictData = selectedDistrict 
    ? mapData.find(d => d.name === selectedDistrict)
    : null;

  const getSeverityColor = (severity: string | null, hasOutbreak: boolean) => {
    if (hasOutbreak) {
      if (severity === 'high') return 'fill-destructive';
      if (severity === 'medium') return 'fill-warning';
      return 'fill-amber-400';
    }
    return 'fill-muted';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            नेपाल रोग प्रकोप नक्सा
          </CardTitle>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">सबै</SelectItem>
              <SelectItem value="high">गम्भीर</SelectItem>
              <SelectItem value="medium">मध्यम</SelectItem>
              <SelectItem value="low">सामान्य</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Map SVG Container */}
          <svg
            viewBox="0 0 100 75"
            className="w-full h-auto"
            style={{ minHeight: '300px' }}
          >
            {/* Background */}
            <rect x="0" y="0" width="100" height="75" fill="hsl(var(--muted))" rx="2" />
            
            {/* Nepal outline (simplified) */}
            <path
              d="M2,55 Q5,65 30,65 Q50,68 70,55 Q90,45 88,30 Q85,20 45,15 Q20,12 5,25 Q2,35 2,55 Z"
              fill="hsl(var(--card))"
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
            />

            {/* District markers */}
            {filteredMapData.map((district, index) => (
              <g key={district.name}>
                <motion.circle
                  cx={district.x}
                  cy={district.y}
                  r={district.hasOutbreak ? 3 + (district.outbreakData?.detection_count || 1) * 0.5 : 2}
                  className={`cursor-pointer transition-colors ${getSeverityColor(district.severity, district.hasOutbreak)}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => setSelectedDistrict(district.name)}
                  stroke={selectedDistrict === district.name ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                  strokeWidth={selectedDistrict === district.name ? 1 : 0.3}
                />
                {district.hasOutbreak && (
                  <motion.circle
                    cx={district.x}
                    cy={district.y}
                    r={4 + (district.outbreakData?.detection_count || 1) * 0.5}
                    fill="none"
                    stroke="hsl(var(--destructive))"
                    strokeWidth="0.3"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span>गम्भीर प्रकोप</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span>मध्यम प्रकोप</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span>सामान्य प्रकोप</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
              <span>कुनै प्रकोप छैन</span>
            </div>
          </div>

          {/* Selected district info */}
          {selectedDistrictData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-muted/50 rounded-lg border"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {selectedDistrictData.name}
                </h4>
                {selectedDistrictData.hasOutbreak && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    प्रकोप
                  </Badge>
                )}
              </div>
              
              {selectedDistrictData.hasOutbreak && selectedDistrictData.outbreakData ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>रोग:</strong> {selectedDistrictData.outbreakData.disease_name}
                  </p>
                  <p>
                    <strong>रिपोर्ट संख्या:</strong> {selectedDistrictData.outbreakData.detection_count}
                  </p>
                  <p>
                    <strong>गम्भीरता:</strong>{' '}
                    <Badge variant={selectedDistrictData.severity === 'high' ? 'destructive' : 'secondary'}>
                      {selectedDistrictData.severity === 'high' ? 'गम्भीर' : 
                       selectedDistrictData.severity === 'medium' ? 'मध्यम' : 'सामान्य'}
                    </Badge>
                  </p>
                </div>
              ) : selectedDistrictData.detectionCount > 0 ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>कुल रिपोर्ट:</strong> {selectedDistrictData.detectionCount}
                  </p>
                  {selectedDistrictData.diseases.length > 0 && (
                    <p>
                      <strong>पहिचान भएका रोगहरू:</strong>{' '}
                      {selectedDistrictData.diseases.slice(0, 3).join(', ')}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  यस जिल्लामा कुनै रोग रिपोर्ट छैन।
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Active outbreaks list */}
        {outbreakAlerts && outbreakAlerts.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              सक्रिय रोग प्रकोपहरू ({outbreakAlerts.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-auto">
              {outbreakAlerts.map(alert => (
                <div
                  key={alert.district + alert.disease_name}
                  className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg text-sm cursor-pointer hover:bg-destructive/20"
                  onClick={() => setSelectedDistrict(alert.district)}
                >
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4 text-destructive" />
                    <span>{alert.disease_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{alert.district}</span>
                    <Badge variant="outline">{alert.detection_count} रिपोर्ट</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
