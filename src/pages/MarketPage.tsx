import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyMarketSection } from '@/components/market/DailyMarketSection';
import { AllNepalPriceComparison } from '@/components/market/AllNepalPriceComparison';
import { UserMarketCardsSection } from '@/components/market/UserMarketCardsSection';
import { MarketSelectionFlow } from '@/components/market/MarketSelectionFlow';
import { NearestMarketsSection } from '@/components/market/NearestMarketsSection';
import { RealTimePriceUpdates } from '@/components/market/RealTimePriceUpdates';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  TrendingUp, Navigation, Users, Store
} from 'lucide-react';

type TabValue = 'daily' | 'compare' | 'community';

const MarketPage = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabValue) || 'daily';
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const { t } = useLanguage();

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabValue;
    if (tabParam && ['daily', 'compare', 'community'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <>
      <Helmet>
        <title>{t('marketPageTitle')} | {t('kisanSathi')}</title>
        <meta name="description" content={t('marketPageSubtitle')} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 sm:pt-24 pb-28">
          <div className="container mx-auto px-4">
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary flex items-center justify-center shadow-md">
                  <Store className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    {t('marketPageTitle')}
                  </h1>
                  <p className="text-sm text-muted-foreground">{t('marketPageSubtitle')}</p>
                </div>
              </div>
            </div>

            <RealTimePriceUpdates />

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/60 p-1 rounded-xl">
                <TabsTrigger 
                  value="daily" 
                  className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-1"
                >
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{t('dailyPrices')}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="compare" 
                  className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-1"
                >
                  <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{t('compare')}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="community" 
                  className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-1"
                >
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{t('farmerMarket')}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="daily">
                <MarketSelectionFlow />
                <DailyMarketSection />
                <NearestMarketsSection />
              </TabsContent>

              <TabsContent value="compare">
                <AllNepalPriceComparison />
              </TabsContent>

              <TabsContent value="community">
                <UserMarketCardsSection />
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