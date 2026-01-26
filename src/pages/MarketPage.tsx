import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProduceListingsManager } from '@/components/market/ProduceListingsManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useProduceListings } from '@/hooks/useProduceListings';
import { 
  TrendingUp, TrendingDown, ShoppingCart, Store, Package, 
  BarChart3, Eye, Phone, MapPin, Clock, Edit, Trash2
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

const MarketPage = () => {
  const { user } = useAuth();
  const { myListings, updateListing, deleteListing } = useProduceListings();
  const [activeTab, setActiveTab] = useState<'browse' | 'prices' | 'my'>('browse');

  // Fetch market prices
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

  // Fetch listing stats for owner
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
      high: 'bg-success/20 text-success border-success/30',
      medium: 'bg-warning/20 text-warning border-warning/30',
      low: 'bg-destructive/20 text-destructive border-destructive/30',
    };
    return (
      <Badge variant="outline" className={colors[level] || colors.medium}>
        {level === 'high' ? 'उच्च माग' : level === 'low' ? 'कम माग' : 'मध्यम माग'}
      </Badge>
    );
  };

  // Group prices by crop
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
        <title>बजार - Market | Farmer Gpt</title>
        <meta name="description" content="View market prices, list your produce for sale, and connect with buyers." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 sm:pt-24 pb-20">
          <div className="container mx-auto px-4">
            <div className="mb-6">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Store className="h-6 w-6 text-primary" />
                बजार
              </h1>
              <p className="text-muted-foreground">बजार भाउ हेर्नुहोस्, उब्जनी बेच्न list गर्नुहोस्</p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="browse" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  बजार
                </TabsTrigger>
                <TabsTrigger value="prices" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  भाउ
                </TabsTrigger>
                {user && (
                  <TabsTrigger value="my" className="gap-2">
                    <Package className="h-4 w-4" />
                    मेरो ({myListings.length})
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Browse Tab - Product Listings */}
              <TabsContent value="browse">
                <ProduceListingsManager />
              </TabsContent>

              {/* Prices Tab - Market Price Reference */}
              <TabsContent value="prices">
                <div className="space-y-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">आजको बजार मूल्य</h3>
                      <p className="text-sm text-muted-foreground">
                        नजिकको हाट/मण्डीको अनुमानित मूल्य। वास्तविक मूल्य फरक हुन सक्छ।
                      </p>
                    </CardContent>
                  </Card>

                  {pricesLoading ? (
                    <div className="flex items-center justify-center p-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : Object.keys(groupedPrices).length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                        बजार भाउ उपलब्ध छैन।
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(groupedPrices).map(([cropType, cropPrices]) => {
                        const latestPrice = cropPrices[0];
                        const previousPrice = cropPrices[1];
                        const trend = previousPrice && latestPrice.price_per_quintal && previousPrice.price_per_quintal
                          ? latestPrice.price_per_quintal > previousPrice.price_per_quintal ? 'up' 
                          : latestPrice.price_per_quintal < previousPrice.price_per_quintal ? 'down' : 'same'
                          : null;

                        return (
                          <Card key={cropType} className="hover:shadow-md transition-shadow">
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
              </TabsContent>

              {/* My Listings Tab */}
              <TabsContent value="my">
                {!user ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      कृपया पहिला login गर्नुहोस्।
                    </CardContent>
                  </Card>
                ) : myListings.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">तपाईंको कुनै listing छैन</h3>
                      <p className="text-muted-foreground mb-4">आफ्नो उब्जनी बेच्न list गर्नुहोस्</p>
                      <Button onClick={() => setActiveTab('browse')}>
                        नयाँ उत्पादन राख्ने
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Stats summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <div className="text-2xl font-bold">{myListings.length}</div>
                          <div className="text-xs text-muted-foreground">कुल Listings</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Eye className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <div className="text-2xl font-bold">
                            {Object.values(listingStats?.views || {}).reduce((a, b) => a + b, 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">Views</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Phone className="h-6 w-6 mx-auto mb-2 text-success" />
                          <div className="text-2xl font-bold">
                            {Object.values(listingStats?.contacts || {}).reduce((a, b) => a + b, 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">Inquiries</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* My listings */}
                    <div className="space-y-3">
                      {myListings.map((listing) => (
                        <Card key={listing.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{listing.crop_name}</h3>
                                  {listing.variety && (
                                    <span className="text-sm text-muted-foreground">({listing.variety})</span>
                                  )}
                                  <Badge variant={listing.is_active ? 'default' : 'secondary'}>
                                    {listing.is_active ? 'सक्रिय' : 'निष्क्रिय'}
                                  </Badge>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                                  <span className="flex items-center gap-1">
                                    <Package className="h-4 w-4" />
                                    {listing.quantity} {listing.unit}
                                  </span>
                                  {listing.expected_price && (
                                    <span className="font-medium text-foreground">
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

                                <div className="flex gap-4 text-xs text-muted-foreground">
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

                              <div className="flex flex-col gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleToggleActive(listing.id, listing.is_active)}
                                >
                                  {listing.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-destructive"
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
