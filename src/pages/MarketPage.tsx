import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ProduceListingsManager } from '@/components/market/ProduceListingsManager';
import { ShoppingCart } from 'lucide-react';

const MarketPage = () => {
  return (
    <>
      <Helmet>
        <title>बेच्ने - Sell Produce | Farmer Gpt</title>
        <meta name="description" content="List your produce for sale and connect with buyers directly." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-primary" />
                उब्जनी बेच्नुहोस्
              </h1>
              <p className="text-muted-foreground">
                आफ्नो उब्जनी यहाँ list गर्नुहोस् र सिधै किनमेल गर्नेसँग सम्पर्क गर्नुहोस्
              </p>
            </div>

            {/* Produce Listings */}
            <ProduceListingsManager />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default MarketPage;
