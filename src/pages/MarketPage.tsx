import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProduceListingsManager } from '@/components/market/ProduceListingsManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, ShoppingCart, Store } from 'lucide-react';
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

const MarketPage = () => {
  const [activeTab, setActiveTab] = useState<'prices' | 'sell'>('prices');

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
      high: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return (
      <Badge className={colors[level] || colors.medium}>
        {level === 'high' ? 'उच्च माग' : level === 'low' ? 'कम माग' : 'मध्यम माग'}
      </Badge>
    );
  };

  // Group prices by crop
  const groupedPrices = prices?.reduce((acc, price) => {
    if (!acc[price.crop_type]) {
      acc[price.crop_type] = [];
    }
    acc[price.crop_type].push(price);
    return acc;
  }, {} as Record<string, MarketPrice[]>) || {};

  return (
    <>
      <Helmet>
        <title>बजार - Market Prices & Sell Produce | Farmer Gpt</title>
        <meta name="description" content="View current crop market prices and list your produce for sale." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="mb-6">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Store className="h-6 w-6" />
                बजार
              </h1>
              <p className="text-muted-foreground">बजार भाउ हेर्नुहोस् र आफ्नो उब्जनी बेच्न list गर्नुहोस्</p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'prices' | 'sell')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="prices" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  बजार भाउ
                </TabsTrigger>
                <TabsTrigger value="sell" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  बेच्ने
                </TabsTrigger>
              </TabsList>

              <TabsContent value="prices">
                {pricesLoading ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : Object.keys(groupedPrices).length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      बजार भाउ उपलब्ध छैन।
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(groupedPrices).map(([cropType, cropPrices]) => {
                      const latestPrice = cropPrices[0];
                      return (
                        <Card key={cropType} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg capitalize">{cropType}</CardTitle>
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
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(latestPrice.price_date), 'yyyy-MM-dd')}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sell">
                <ProduceListingsManager />
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
