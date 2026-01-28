import { useState } from 'react';
import { useDailyMarketProducts, DailyMarketProduct } from '@/hooks/useDailyMarketProducts';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Calendar, MapPin, Store, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { LocationFilters } from './LocationFilters';
import { RealTimePriceUpdates } from './RealTimePriceUpdates';

function ProductCard({ product }: { product: DailyMarketProduct }) {
  const displayName = product.crop_name_ne || product.crop_name;
  const marketName = product.market_name_ne || product.market_name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-border/60 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group bg-card">
        <AspectRatio ratio={4/3} className="bg-muted/50">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={displayName}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/8 to-primary/3">
              <Leaf className="h-10 w-10 text-primary/40" />
            </div>
          )}
        </AspectRatio>
        <CardContent className="p-4 space-y-3">
          {/* Crop Name */}
          <h3 className="font-bold text-base sm:text-lg text-foreground line-clamp-1">
            {displayName}
          </h3>

          {/* Price Section */}
          <div className="space-y-1">
            {product.price_avg && (
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold text-primary">
                  रु. {product.price_avg.toLocaleString()}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">/ {product.unit}</span>
              </div>
            )}
            {(product.price_min || product.price_max) && (
              <p className="text-xs text-muted-foreground">
                रु. {product.price_min?.toLocaleString() || '?'} – {product.price_max?.toLocaleString() || '?'}
              </p>
            )}
          </div>

          {/* Market & Location Tags */}
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
    updateFilters({
      ...filters,
      cropId: selectedCropId,
    });
  };

  const handleCropChange = (cropId: number | null) => {
    setSelectedCropId(cropId);
    updateFilters({
      cropId,
    });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary flex items-center justify-center">
              <Store className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            आजको कृषि बजार
          </h2>
          {latestDate && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1.5 ml-11">
              <Calendar className="h-3.5 w-3.5" />
              मिति: {format(new Date(latestDate), 'yyyy-MM-dd')}
              {!isToday && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  अन्तिम उपलब्ध
                </Badge>
              )}
            </p>
          )}
        </div>
        <RealTimePriceUpdates onNewPrices={refresh} pollingInterval={120000} />
      </div>

      {/* Location Filters */}
      <LocationFilters 
        selectedCropId={selectedCropId}
        onCropChange={handleCropChange}
        onFiltersChange={handleFiltersChange}
      />

      {/* Sort Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">क्रमबद्ध:</span>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'name' | 'price-low' | 'price-high')}>
          <SelectTrigger className="w-[180px] bg-card border-border/60 rounded-lg">
            <SelectValue placeholder="क्रमबद्ध गर्नुहोस्" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border shadow-lg z-50">
            <SelectItem value="name">नाम (A-Z)</SelectItem>
            <SelectItem value="price-low">मूल्य (कम → धेरै)</SelectItem>
            <SelectItem value="price-high">मूल्य (धेरै → कम)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-6 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && products.length === 0 && (
        <Card className="bg-muted/30 border-border/60">
          <CardContent className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Store className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              बजार मूल्य उपलब्ध छैन
            </h3>
            <p className="text-sm text-muted-foreground">
              छानिएको स्थानका लागि डाटा छैन। कृपया अर्को स्थान छान्नुहोस्।
            </p>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      {!isLoading && !error && products.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {products.length} वटा उत्पादन फेला परे
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
