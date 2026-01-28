import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProduceListingsManager } from '@/components/market/ProduceListingsManager';
import { DailyMarketSection } from '@/components/market/DailyMarketSection';
import { NearestMarketsSection } from '@/components/market/NearestMarketsSection';
import { PriceAlertsList } from '@/components/market/PriceAlertsList';
import { UserMarketCardsSection } from '@/components/market/UserMarketCardsSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useProduceListings } from '@/hooks/useProduceListings';
import { 
  TrendingUp, TrendingDown, ShoppingCart, Store, Package, 
  BarChart3, Eye, Phone, MapPin, Clock, Trash2, Navigation, Bell
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

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

type TabValue = 'browse' | 'nearest' | 'prices' | 'alerts' | 'cards' | 'my';

const MarketPage = () => {
  const { user } = useAuth();
  const { myListings, updateListing, deleteListing } = useProduceListings();
  const [activeTab, setActiveTab] = useState<TabValue>('prices');

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

  const { data: listingStats } = useQuery({
    queryKey: ['my-listing-stats', user?.id],
    queryFn: async () => {
      if (!myListings.length) return {};
      
      const listingIds = myListings.map(l => l.id);
      
      const [viewsResult, contactsResult] = await Promise.all([
        supabase.from('listing_views').select('listing_id').in('listing_id', listingIds),
        supabase.from('listing_contacts').select('listing_id').in('listing_id', listingIds),
      ]);

      const viewCounts: Record<string, number> = {};
      const contactCounts: Record<string, number> = {};

      viewsResult.data?.forEach(v => {
        viewCounts[v.listing_id] = (viewCounts[v.listing_id] || 0) + 1;
      });
      contactsResult.data?.forEach(c => {
        contactCounts[c.listing_id] = (contactCounts[c.listing_id] || 0) + 1;
      });

      return { views: viewCounts, contacts: contactCounts };
    },
    enabled: !!user && myListings.length > 0,
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

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await updateListing(id, { is_active: !currentStatus });
  };

  const handleDelete = async (id: string) => {
    if (confirm('के तपाईं यो listing हटाउन चाहनुहुन्छ?')) {
      await deleteListing(id);
    }
  };

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
              <TabsList className="grid w-full grid-cols-6 mb-6 bg-muted/60 p-1 rounded-xl">
                <TabsTrigger 
                  value="browse" 
                  className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-1"
                >
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">उत्पादन</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="cards" 
                  className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-1"
                >
                  <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">कार्ड</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="nearest" 
                  className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-1"
                >
                  <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">नजिक</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="prices" 
                  className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-1"
                >
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">मूल्य</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="alerts" 
                  className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-1"
                >
                  <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">अलर्ट</span>
                </TabsTrigger>
                {user && (
                  <TabsTrigger 
                    value="my" 
                    className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-1"
                  >
                    <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{myListings.length}</span>
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Browse Tab */}
              <TabsContent value="browse">
                <ProduceListingsManager />
              </TabsContent>

              {/* Nearest Markets Tab */}
              <TabsContent value="nearest">
                <NearestMarketsSection />
              </TabsContent>

              {/* User Market Cards Tab */}
              <TabsContent value="cards">
                <UserMarketCardsSection />
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts">
                <PriceAlertsList />
              </TabsContent>

              {/* Prices Tab */}
              <TabsContent value="prices">
                <div className="space-y-8">
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

              {/* My Listings Tab */}
              <TabsContent value="my">
                {!user ? (
                  <Card className="border-border/60">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      कृपया login गर्नुहोस्।
                    </CardContent>
                  </Card>
                ) : myListings.length === 0 ? (
                  <Card className="border-border/60">
                    <CardContent className="p-8 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <Package className="h-7 w-7 text-muted-foreground/50" />
                      </div>
                      <h3 className="font-semibold mb-2">कुनै listing छैन</h3>
                      <p className="text-sm text-muted-foreground mb-4">उब्जनी बेच्न list गर्नुहोस्</p>
                      <Button onClick={() => setActiveTab('browse')} size="sm" className="rounded-full">
                        नयाँ उत्पादन राख्ने
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Stats summary */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                      <Card className="border-border/60">
                        <CardContent className="p-4 text-center">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div className="text-2xl font-bold text-foreground">{myListings.length}</div>
                          <div className="text-xs text-muted-foreground">कुल Listings</div>
                        </CardContent>
                      </Card>
                      <Card className="border-border/60">
                        <CardContent className="p-4 text-center">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center mx-auto mb-2">
                            <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-2xl font-bold text-foreground">
                            {Object.values(listingStats?.views || {}).reduce((a, b) => a + b, 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">Views</div>
                        </CardContent>
                      </Card>
                      <Card className="border-border/60">
                        <CardContent className="p-4 text-center">
                          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-2">
                            <Phone className="h-5 w-5 text-success" />
                          </div>
                          <div className="text-2xl font-bold text-foreground">
                            {Object.values(listingStats?.contacts || {}).reduce((a, b) => a + b, 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">Inquiries</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* My listings */}
                    <div className="space-y-3">
                      {myListings.map((listing) => (
                        <Card key={listing.id} className="border-border/60 hover:border-primary/30 transition-all">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <h3 className="font-semibold text-foreground">{listing.crop_name}</h3>
                                  {listing.variety && (
                                    <span className="text-sm text-muted-foreground">({listing.variety})</span>
                                  )}
                                  <Badge variant={listing.is_active ? 'default' : 'secondary'} className="text-xs">
                                    {listing.is_active ? 'सक्रिय' : 'निष्क्रिय'}
                                  </Badge>
                                </div>

                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-2">
                                  <span className="flex items-center gap-1">
                                    <Package className="h-4 w-4" />
                                    {listing.quantity} {listing.unit}
                                  </span>
                                  {listing.expected_price && (
                                    <span className="font-medium text-primary">
                                      रु. {listing.expected_price}/{listing.unit}
                                    </span>
                                  )}
                                  {listing.district && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {listing.district}
                                    </span>
                                  )}
                                </div>

                                <div className="flex gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {listingStats?.views?.[listing.id] || 0} views
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {listingStats?.contacts?.[listing.id] || 0} inquiries
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-xs rounded-full"
                                  onClick={() => handleToggleActive(listing.id, listing.is_active)}
                                >
                                  {listing.is_active ? 'निष्क्रिय' : 'सक्रिय'}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(listing.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
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
