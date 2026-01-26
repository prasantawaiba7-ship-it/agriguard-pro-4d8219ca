import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Store, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useCrops } from '@/hooks/useCrops';

interface MarketPriceSummaryCardProps {
  cropName: string;
  districtId?: number | null;
  language?: string;
}

interface PriceSummary {
  crop_name_ne: string | null;
  price_avg: number | null;
  price_min: number | null;
  price_max: number | null;
  unit: string;
  market_name_ne: string | null;
  date: string;
  district: string | null;
}

export function MarketPriceSummaryCard({ cropName, districtId, language = 'ne' }: MarketPriceSummaryCardProps) {
  const [priceSummary, setPriceSummary] = useState<PriceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeCrops } = useCrops();

  useEffect(() => {
    fetchPriceSummary();
  }, [cropName, districtId]);

  const fetchPriceSummary = async () => {
    setIsLoading(true);
    try {
      // First, find the crop_id from crop name
      const crop = activeCrops.find(
        c => c.name_ne === cropName || c.name_en.toLowerCase() === cropName.toLowerCase()
      );

      // Build query for latest price
      let query = supabase
        .from('daily_market_products')
        .select('crop_name_ne, price_avg, price_min, price_max, unit, market_name_ne, date, district')
        .order('date', { ascending: false })
        .limit(1);

      // Filter by crop
      if (crop) {
        query = query.eq('crop_id', crop.id);
      } else {
        query = query.or(`crop_name.ilike.%${cropName}%,crop_name_ne.ilike.%${cropName}%`);
      }

      // Optionally filter by district
      if (districtId) {
        query = query.eq('district_id_fk', districtId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      setPriceSummary(data);
    } catch (err) {
      console.error('Error fetching price summary:', err);
      setPriceSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!priceSummary || !priceSummary.price_avg) {
    return null; // Don't show card if no price data
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h4 className="font-semibold text-sm text-primary mb-1.5">
              {language === 'ne' ? 'आजको स्थानीय बजार मूल्य' : 'Today\'s Local Market Price'}
            </h4>

            {/* Price */}
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-xl sm:text-2xl font-bold text-primary">
                रु. {priceSummary.price_avg.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                / {priceSummary.unit}
              </span>
            </div>

            {/* Price Range */}
            {(priceSummary.price_min || priceSummary.price_max) && (
              <p className="text-xs text-muted-foreground mb-2">
                {language === 'ne' ? 'मूल्य दायरा:' : 'Range:'} रु. {priceSummary.price_min?.toLocaleString() || '?'} – {priceSummary.price_max?.toLocaleString() || '?'}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-2">
              {priceSummary.market_name_ne && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Store className="h-3 w-3" />
                  {priceSummary.market_name_ne}
                </Badge>
              )}
              {priceSummary.district && (
                <Badge variant="outline" className="text-xs gap-1">
                  <MapPin className="h-3 w-3" />
                  {priceSummary.district}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(priceSummary.date), 'yyyy-MM-dd')}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
