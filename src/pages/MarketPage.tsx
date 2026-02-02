import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyMarketSection } from '@/components/market/DailyMarketSection';
import { NearestMarketsSection } from '@/components/market/NearestMarketsSection';
import { MarketSelectionFlow } from '@/components/market/MarketSelectionFlow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, TrendingDown, BarChart3, Clock, Navigation, Store
} from 'lucide-react';
import { format } from 'date-fns';

interface MarketPrice {
  id: string;
  crop_type: string;
  price_per_quintal: number | null;
  price_date: string;
  state: string;
  district: string | null;
  mandi_name: string | null;
  demand_level: string | null;
}

type TabValue = 'nearest' | 'prices';

const MarketPage = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabValue) || 'prices';
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

  // Sync tab from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabValue;
    if (tabParam && ['nearest', 'prices'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const { data: prices, isLoading: pricesLoading } = useQuery({
    queryKey: ['market-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .order('price_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as MarketPrice[];
    },
  });

  const getDemandBadge = (level: string | null) => {
    if (!level) return null;
    const colors: Record<string, string> = {
      high: 'bg-success/15 text-success border-success/30',
      medium: 'bg-warning/15 text-warning border-warning/30',
      low: 'bg-destructive/15 text-destructive border-destructive/30',
    };
    return (
      <Badge variant="outline" className={colors[level] || colors.medium}>
        {level === 'high' ? 'उच्च माग' : level === 'low' ? 'कम माग' : 'मध्यम माग'}
      </Badge>
    );
  };

  const groupedPrices = useMemo(() => {
    return prices?.reduce((acc, price) => {
      if (!acc[price.crop_type]) {
        acc[price.crop_type] = [];
      }
      acc[price.crop_type].push(price);
      return acc;
    }, {} as Record<string, MarketPrice[]>) || {};
  }, [prices]);


  return (
    <>
      <Helmet>
        <title>बजार - Market | HUNCHA किसान साथी</title>
        <meta name="description" content="View market prices, list your produce for sale, and connect with buyers." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 sm:pt-24 pb-28">
          <div className="container mx-auto px-4">
            {/* Page Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary flex items-center justify-center shadow-md">
                  <Store className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    बजार
                  </h1>
                  <p className="text-sm text-muted-foreground">भाउ हेर्नुहोस्, उब्जनी बेच्नुहोस्</p>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/60 p-1 rounded-xl">
                <TabsTrigger 
                  value="prices" 
                  className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-1"
                >
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">मूल्य</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="nearest" 
                  className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-1"
                >
                  <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">नजिक</span>
                </TabsTrigger>
              </TabsList>

              {/* Prices Tab */}
              <TabsContent value="prices">
                <div className="space-y-6">
                  {/* Market Selection */}
                  <MarketSelectionFlow />
                  
                  {/* Daily Prices */}
                  <DailyMarketSection />

                  {/* Divider */}
                  <div className="section-divider" />

                  <div>
                    <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      बाली अनुसार मूल्य सूची
                    </h3>

                    {pricesLoading ? (
                      <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : Object.keys(groupedPrices).length === 0 ? (
                      <Card className="border-border/60">
                        <CardContent className="p-8 text-center text-muted-foreground">
                          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                          बजार भाउ उपलब्ध छैन।
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(groupedPrices).map(([cropType, cropPrices]) => {
                          const latestPrice = cropPrices[0];
                          const previousPrice = cropPrices[1];
                          const trend = previousPrice && latestPrice.price_per_quintal && previousPrice.price_per_quintal
                            ? latestPrice.price_per_quintal > previousPrice.price_per_quintal ? 'up' 
                            : latestPrice.price_per_quintal < previousPrice.price_per_quintal ? 'down' : 'same'
                            : null;

                          return (
                            <Card key={cropType} className="border-border/60 hover:border-primary/30 hover:shadow-lg transition-all">
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-lg capitalize flex items-center gap-2">
                                    {cropType}
                                    {trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
                                    {trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
                                  </CardTitle>
                                  {getDemandBadge(latestPrice.demand_level)}
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {latestPrice.price_per_quintal && (
                                    <div className="text-2xl font-bold text-primary">
                                      रु. {latestPrice.price_per_quintal.toLocaleString()}
                                      <span className="text-sm font-normal text-muted-foreground">/क्विन्टल</span>
                                    </div>
                                  )}
                                  <div className="text-sm text-muted-foreground">
                                    {latestPrice.mandi_name && <span>{latestPrice.mandi_name}, </span>}
                                    {latestPrice.district && <span>{latestPrice.district}</span>}
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(latestPrice.price_date), 'yyyy-MM-dd')}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Nearest Markets Tab */}
              <TabsContent value="nearest">
                <NearestMarketsSection />
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default MarketPage;
