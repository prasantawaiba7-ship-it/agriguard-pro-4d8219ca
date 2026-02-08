import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useIndiaMandi, indianStates } from '@/hooks/useIndiaMandi';
import { formatPrice } from '@/hooks/useCountry';
import { RefreshCw, Search, MapPin, TrendingUp, TrendingDown } from 'lucide-react';

export function IndiaMandiPrices() {
  const { prices, isLoading, error, fetchPrices } = useIndiaMandi();
  const [selectedState, setSelectedState] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch initial data
    fetchPrices({ limit: 100 });
  }, []);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    if (state) {
      fetchPrices({ state, limit: 100 });
    }
  };

  const handleRefresh = () => {
    fetchPrices({ state: selectedState || undefined, limit: 100 });
  };

  // Filter prices by search query
  const filteredPrices = prices.filter(price => 
    price.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
    price.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
    price.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by commodity for better display
  const groupedByCommodity = filteredPrices.reduce((acc, price) => {
    if (!acc[price.commodity]) {
      acc[price.commodity] = [];
    }
    acc[price.commodity].push(price);
    return acc;
  }, {} as Record<string, typeof prices>);

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">{error}</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-4 mx-auto block">
            पुनः प्रयास करें
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            भारतीय मंडी भाव
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedState} onValueChange={handleStateChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="राज्य चुनें" />
              </SelectTrigger>
              <SelectContent>
                {indianStates.map(state => (
                  <SelectItem key={state.name} value={state.name}>
                    {state.nameHi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="फसल या मंडी खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Button onClick={handleRefresh} variant="outline" size="icon" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Prices Grid */}
      {!isLoading && Object.keys(groupedByCommodity).length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedByCommodity).slice(0, 10).map(([commodity, items]) => (
            <Card key={commodity}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">{commodity}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {items.slice(0, 5).map((price, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{price.market}</p>
                        <p className="text-xs text-muted-foreground">
                          {price.district}, {price.state}
                        </p>
                        {price.variety && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {price.variety}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {formatPrice(price.modal_price, 'india')}/{price.unit}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <TrendingDown className="h-3 w-3 text-primary/70" />
                            {formatPrice(price.min_price, 'india')}
                          </span>
                          <span>-</span>
                          <span className="flex items-center gap-0.5">
                            <TrendingUp className="h-3 w-3 text-destructive" />
                            {formatPrice(price.max_price, 'india')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredPrices.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>कोई मंडी भाव उपलब्ध नहीं</p>
            <p className="text-sm mt-1">राज्य चुनें या खोज करें</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
