import { useDailyMarketProducts, DailyMarketProduct } from '@/hooks/useDailyMarketProducts';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Calendar, MapPin, TrendingUp, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

function ProductCard({ product }: { product: DailyMarketProduct }) {
  const displayName = product.crop_name_ne || product.crop_name;
  const marketName = product.market_name_ne || product.market_name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <AspectRatio ratio={4/3} className="bg-muted">
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
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/10 to-primary/5">
              <Store className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
        </AspectRatio>
        <CardContent className="p-4 space-y-3">
          {/* Crop Name */}
          <h3 className="font-bold text-lg text-foreground line-clamp-1">
            {displayName}
          </h3>

          {/* Price Section */}
          <div className="space-y-1">
            {product.price_avg && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xl font-bold text-primary">
                  रु. {product.price_avg.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">/ {product.unit}</span>
              </div>
            )}
            {(product.price_min || product.price_max) && (
              <p className="text-sm text-muted-foreground">
                रु. {product.price_min?.toLocaleString() || '?'} – {product.price_max?.toLocaleString() || '?'} / {product.unit}
              </p>
            )}
          </div>

          {/* Market & District */}
          <div className="flex flex-wrap gap-2">
            {marketName && (
              <Badge variant="secondary" className="text-xs">
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
    <Card className="overflow-hidden">
      <AspectRatio ratio={4/3}>
        <Skeleton className="w-full h-full" />
      </AspectRatio>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
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
    districts,
    crops,
    selectedDistrict,
    setSelectedDistrict,
    selectedCrop,
    setSelectedCrop,
    sortBy,
    setSortBy,
    refresh,
  } = useDailyMarketProducts();

  const isToday = latestDate === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            आजको कृषि बजार
          </h2>
          {latestDate && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="h-4 w-4" />
              मिति: {format(new Date(latestDate), 'yyyy-MM-dd')}
              {!isToday && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  अन्तिम उपलब्ध
                </Badge>
              )}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          ताजा गर्नुहोस्
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedCrop} onValueChange={setSelectedCrop}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="बाली छान्नुहोस्" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">सबै बाली</SelectItem>
            {crops.map((crop) => (
              <SelectItem key={crop} value={crop}>{crop}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="जिल्ला छान्नुहोस्" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">सबै जिल्ला</SelectItem>
            {districts.map((district) => (
              <SelectItem key={district} value={district}>{district}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'name' | 'price-low' | 'price-high')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="क्रमबद्ध गर्नुहोस्" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">नाम (A-Z)</SelectItem>
            <SelectItem value="price-low">मूल्य (कम → धेरै)</SelectItem>
            <SelectItem value="price-high">मूल्य (धेरै → कम)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4 text-center text-destructive">
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
        <Card className="bg-muted/50">
          <CardContent className="p-8 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              आजको बजार मूल्य उपलब्ध छैन। कृपया भोलि फेरि जाँच गर्नुहोस्।
            </p>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      {!isLoading && !error && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
