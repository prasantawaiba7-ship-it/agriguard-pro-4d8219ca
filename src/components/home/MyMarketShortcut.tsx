import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, ChevronRight, TrendingUp, MapPin } from 'lucide-react';
import { useUserSelectedMarket } from '@/hooks/useUserSelectedMarket';
import { useLanguage } from '@/hooks/useLanguage';
import { motion } from 'framer-motion';

export function MyMarketShortcut() {
  const { selectedMarket, isLoading } = useUserSelectedMarket();
  const { language } = useLanguage();
  const isNepali = language === 'ne';

  if (isLoading) return null;

  // If no market selected, show a prompt to select
  if (!selectedMarket) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-all cursor-pointer group">
          <Link to="/market?tab=prices">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isNepali ? 'आजको बजार भाउ' : "Today's Market Prices"}
                    </p>
                    <h3 className="font-semibold text-foreground">
                      {isNepali ? 'आफ्नो बजार छान्नुहोस्' : 'Select Your Market'}
                    </h3>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </motion.div>
    );
  }

  // Show selected market with quick access
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:shadow-lg transition-all overflow-hidden">
        <CardContent className="p-0">
          <Link to="/market?tab=prices">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-md">
                  <Store className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {isNepali ? 'तपाईंको बजार' : 'Your Market'}
                  </p>
                  <h3 className="font-bold text-lg text-foreground">
                    {isNepali ? selectedMarket.marketNameNe : selectedMarket.marketNameEn}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isNepali ? selectedMarket.districtNameNe : selectedMarket.districtNameEn}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </Link>
          <div className="bg-primary/5 border-t border-primary/10 px-4 py-2">
            <Link to="/market?tab=prices">
              <Button variant="link" className="p-0 h-auto text-primary text-sm font-medium">
                {isNepali ? 'आजको मूल्य हेर्नुहोस्' : "View Today's Prices"} →
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
