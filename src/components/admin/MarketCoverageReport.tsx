import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  MapPin, 
  Store, 
  Calendar, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

interface DistrictCoverage {
  districtId: number;
  districtName: string;
  provinceName: string;
  isMajor: boolean;
  totalMarkets: number;
  marketsWithData: number;
  lastDataDate: string | null;
  coveragePercent: number;
}

interface MarketCoverageStats {
  totalDistricts: number;
  districtsWithData: number;
  totalMarkets: number;
  marketsWithData: number;
  totalCrops: number;
  cropsWithPrices: number;
  lastSyncDate: string | null;
}

export function MarketCoverageReport() {
  const [stats, setStats] = useState<MarketCoverageStats | null>(null);
  const [districtCoverage, setDistrictCoverage] = useState<DistrictCoverage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(7);

  const fetchCoverageData = async () => {
    setIsLoading(true);
    try {
      const startDate = format(subDays(new Date(), selectedDays), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      // Fetch all districts with province info
      const { data: districts } = await supabase
        .from('districts')
        .select(`
          id, name_ne, name_en, is_major,
          provinces!inner(name_ne, name_en)
        `)
        .order('province_id')
        .order('name_en');

      // Fetch all active markets
      const { data: markets } = await supabase
        .from('markets')
        .select('id, district_id, market_code, is_major, is_active')
        .eq('is_active', true);

      // Fetch recent price data grouped by market
      const { data: recentPrices } = await supabase
        .from('daily_market_products')
        .select('market_name, district, date')
        .gte('date', startDate)
        .lte('date', today);

      // Fetch unique crops with prices
      const { data: cropsData } = await supabase
        .from('crops')
        .select('id')
        .eq('is_active', true);

      const { data: pricesWithCrops } = await supabase
        .from('daily_market_products')
        .select('crop_id')
        .gte('date', startDate)
        .not('crop_id', 'is', null);

      // Get last sync date
      const { data: lastSync } = await supabase
        .from('daily_market_products')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);

      // Calculate district coverage
      const districtMap = new Map<number, DistrictCoverage>();
      
      (districts || []).forEach((d: any) => {
        districtMap.set(d.id, {
          districtId: d.id,
          districtName: d.name_ne || d.name_en,
          provinceName: d.provinces?.name_ne || d.provinces?.name_en || '',
          isMajor: d.is_major || false,
          totalMarkets: 0,
          marketsWithData: 0,
          lastDataDate: null,
          coveragePercent: 0,
        });
      });

      // Count markets per district
      (markets || []).forEach((m: any) => {
        if (m.district_id && districtMap.has(m.district_id)) {
          const dist = districtMap.get(m.district_id)!;
          dist.totalMarkets++;
        }
      });

      // Track which districts have price data
      const districtsWithPriceData = new Set<string>();
      const marketNamesWithData = new Set<string>();
      let latestDateByDistrict: Record<string, string> = {};

      (recentPrices || []).forEach((p: any) => {
        if (p.district) {
          districtsWithPriceData.add(p.district);
          if (!latestDateByDistrict[p.district] || p.date > latestDateByDistrict[p.district]) {
            latestDateByDistrict[p.district] = p.date;
          }
        }
        if (p.market_name) {
          marketNamesWithData.add(p.market_name);
        }
      });

      // Update coverage based on district names
      districtMap.forEach((dist) => {
        const hasData = districtsWithPriceData.has(dist.districtName);
        if (hasData) {
          dist.marketsWithData = 1; // At least one market has data
          dist.lastDataDate = latestDateByDistrict[dist.districtName] || null;
          dist.coveragePercent = dist.totalMarkets > 0 ? Math.round((1 / dist.totalMarkets) * 100) : 100;
        }
      });

      const coverageArray = Array.from(districtMap.values()).sort((a, b) => {
        // Sort by coverage (lowest first) then by major status
        if (a.coveragePercent !== b.coveragePercent) return a.coveragePercent - b.coveragePercent;
        if (a.isMajor !== b.isMajor) return a.isMajor ? -1 : 1;
        return a.districtName.localeCompare(b.districtName);
      });

      setDistrictCoverage(coverageArray);

      // Calculate overall stats
      const uniqueCropsWithPrices = new Set((pricesWithCrops || []).map(p => p.crop_id));
      
      setStats({
        totalDistricts: districts?.length || 0,
        districtsWithData: districtsWithPriceData.size,
        totalMarkets: markets?.length || 0,
        marketsWithData: marketNamesWithData.size,
        totalCrops: cropsData?.length || 0,
        cropsWithPrices: uniqueCropsWithPrices.size,
        lastSyncDate: lastSync?.[0]?.updated_at || null,
      });

    } catch (error) {
      console.error('Error fetching coverage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoverageData();
  }, [selectedDays]);

  const getCoverageColor = (percent: number) => {
    if (percent === 0) return 'text-destructive';
    if (percent < 50) return 'text-warning';
    return 'text-success';
  };

  const getCoverageBadge = (percent: number) => {
    if (percent === 0) return <Badge variant="destructive">डाटा छैन</Badge>;
    if (percent < 50) return <Badge className="bg-warning/20 text-warning border-warning/30">आंशिक</Badge>;
    return <Badge className="bg-success/20 text-success border-success/30">पूर्ण</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            मूल्य डाटा कभरेज रिपोर्ट
          </h2>
          <p className="text-sm text-muted-foreground">
            {selectedDays} दिनको डाटा कभरेज विश्लेषण
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="px-3 py-1.5 rounded-md border bg-card text-sm"
          >
            <option value={1}>आज</option>
            <option value={7}>गत ७ दिन</option>
            <option value={30}>गत ३० दिन</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchCoverageData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            रिफ्रेस
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">जिल्ला</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{stats.districtsWithData}</span>
                <span className="text-muted-foreground">/ {stats.totalDistricts}</span>
              </div>
              <Progress 
                value={(stats.districtsWithData / stats.totalDistricts) * 100} 
                className="h-1.5 mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Store className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">बजार</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{stats.marketsWithData}</span>
                <span className="text-muted-foreground">/ {stats.totalMarkets}</span>
              </div>
              <Progress 
                value={(stats.marketsWithData / Math.max(stats.totalMarkets, 1)) * 100} 
                className="h-1.5 mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">बालीहरू</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{stats.cropsWithPrices}</span>
                <span className="text-muted-foreground">/ {stats.totalCrops}</span>
              </div>
              <Progress 
                value={(stats.cropsWithPrices / Math.max(stats.totalCrops, 1)) * 100} 
                className="h-1.5 mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">अन्तिम Sync</span>
              </div>
              <p className="text-sm font-medium">
                {stats.lastSyncDate 
                  ? format(new Date(stats.lastSyncDate), 'MMM d, h:mm a')
                  : 'कहिल्यै sync भएको छैन'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Missing Coverage Alert */}
      {stats && stats.districtsWithData < stats.totalDistricts && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-warning">आंशिक कभरेज</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.totalDistricts - stats.districtsWithData} जिल्लामा अझै मूल्य डाटा उपलब्ध छैन। 
                  AMPIS/कालीमाटी API जडान भएपछि स्वचालित रूपमा अपडेट हुनेछ, वा म्यानुअल एन्ट्री गर्न सकिन्छ।
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* District Coverage Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">जिल्लागत कभरेज</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b">
                  <th className="text-left py-2 px-2">जिल्ला</th>
                  <th className="text-left py-2 px-2">प्रदेश</th>
                  <th className="text-center py-2 px-2">बजार</th>
                  <th className="text-center py-2 px-2">स्थिति</th>
                  <th className="text-right py-2 px-2">अन्तिम डाटा</th>
                </tr>
              </thead>
              <tbody>
                {districtCoverage.map((dist) => (
                  <tr key={dist.districtId} className="border-b hover:bg-muted/30">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        {dist.coveragePercent > 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className={dist.isMajor ? 'font-medium' : ''}>
                          {dist.districtName}
                        </span>
                        {dist.isMajor && (
                          <Badge variant="outline" className="text-xs">प्रमुख</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-muted-foreground">
                      {dist.provinceName}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {dist.marketsWithData}/{dist.totalMarkets}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {getCoverageBadge(dist.coveragePercent)}
                    </td>
                    <td className="py-2 px-2 text-right text-muted-foreground">
                      {dist.lastDataDate 
                        ? format(new Date(dist.lastDataDate), 'MMM d')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
