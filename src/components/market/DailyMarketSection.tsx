import { useState } from 'react';
import { useDailyMarketProducts, DailyMarketProduct } from '@/hooks/useDailyMarketProducts';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Calendar, MapPin, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { LocationFilters } from './LocationFilters';
import { RealTimePriceUpdates } from './RealTimePriceUpdates';
import { getCropImageUrl, handleCropImageError } from '@/lib/cropPlaceholder';
import { NoDataMessage } from './NoDataMessage';
import { QuickRatingButton } from '@/components/feedback/QuickRatingButton';
import { useLanguage } from '@/hooks/useLanguage';

function ProductCard({ product, isNepali, t }: { product: DailyMarketProduct; isNepali: boolean; t: (key: string) => string }) {
  const displayName = isNepali ? (product.crop_name_ne || product.crop_name) : product.crop_name;
  const marketName = isNepali ? (product.market_name_ne || product.market_name) : product.market_name;
  const imageUrl = getCropImageUrl(product.image_url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-border/60 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group bg-card">
        <AspectRatio ratio={4/3} className="bg-muted/50">
          <img
            src={imageUrl}
            alt={displayName}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            onError={handleCropImageError}
          />
        </AspectRatio>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-bold text-base sm:text-lg text-foreground line-clamp-1">
            {displayName}
          </h3>

          <div className="space-y-1">
            {product.price_avg && (
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold text-primary">
                  {isNepali ? 'रु.' : 'Rs.'} {product.price_avg.toLocaleString()}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">/ {product.unit}</span>
              </div>
            )}
            {(product.price_min || product.price_max) && (
              <p className="text-xs text-muted-foreground">
                {isNepali ? 'रु.' : 'Rs.'} {product.price_min?.toLocaleString() || '?'} – {product.price_max?.toLocaleString() || '?'}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {marketName && (
              <Badge variant="secondary" className="text-xs font-medium">
                <Store className="h-3 w-3 mr-1" />
                {marketName}
              </Badge>
            )}
            {product.district && (
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {product.district}
              </Badge>
            )}
          </div>

          <div className="pt-1 border-t border-border/50">
            <QuickRatingButton
              feedbackType="price_accuracy"
              targetType="market_price"
              targetId={product.id}
              variant="thumbs"
              label={t('priceAccuracyQ')}
              className="justify-center"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProductSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60">
      <AspectRatio ratio={4/3}>
        <Skeleton className="w-full h-full" />
      </AspectRatio>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-7 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyMarketSection() {
  const { t, language } = useLanguage();
  const isNepali = language === 'ne';

  const {
    products,
    isLoading,
    error,
    latestDate,
    sortBy,
    setSortBy,
    updateFilters,
    refresh,
  } = useDailyMarketProducts();

  const [selectedCropId, setSelectedCropId] = useState<number | null>(null);

  const isToday = latestDate === format(new Date(), 'yyyy-MM-dd');

  const handleFiltersChange = (filters: {
    provinceId: number | null;
    districtId: number | null;
    localLevelId: number | null;
    wardNumber: number | null;
  }) => {
    updateFilters({ ...filters, cropId: selectedCropId });
  };

  const handleCropChange = (cropId: number | null) => {
    setSelectedCropId(cropId);
    updateFilters({ cropId });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary flex items-center justify-center">
              <Store className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            {t('todayAgriMarket')}
          </h2>
          {latestDate && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1.5 ml-11">
              <Calendar className="h-3.5 w-3.5" />
              {t('dateLabel')}: {format(new Date(latestDate), 'yyyy-MM-dd')}
              {!isToday && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {t('lastAvailable')}
                </Badge>
              )}
            </p>
          )}
        </div>
        <RealTimePriceUpdates onNewPrices={refresh} pollingInterval={120000} />
      </div>

      <LocationFilters 
        selectedCropId={selectedCropId}
        onCropChange={handleCropChange}
        onFiltersChange={handleFiltersChange}
      />

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{t('sortBy')}</span>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'name' | 'price-low' | 'price-high')}>
          <SelectTrigger className="w-[180px] bg-card border-border/60 rounded-lg">
            <SelectValue placeholder={t('sortLabel')} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border shadow-lg z-50">
            <SelectItem value="name">{t('nameAZ')}</SelectItem>
            <SelectItem value="price-low">{t('priceLowHigh')}</SelectItem>
            <SelectItem value="price-high">{t('priceHighLow')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-6 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <Card className="bg-muted/30 border-dashed border-muted-foreground/20">
          <CardContent className="p-10">
            <NoDataMessage variant="inline" />
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && products.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {products.length} {t('productsFound')}
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refresh} 
              className="text-xs gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              {t('refreshBtn')}
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} isNepali={isNepali} t={t} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
