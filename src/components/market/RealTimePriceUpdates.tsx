import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';

interface RealTimePriceUpdatesProps {
  onNewPrices?: () => void;
  pollingInterval?: number;
}

export function RealTimePriceUpdates({ 
  onNewPrices, 
  pollingInterval = 120000
}: RealTimePriceUpdatesProps) {
  const { t } = useLanguage();
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [hasNewData, setHasNewData] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const lastKnownTimestamp = useRef<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkForUpdates = useCallback(async (showToast = false) => {
    if (!isOnline) return;
    
    setIsChecking(true);
    
    try {
      // Get the latest updated_at timestamp from daily_market_products
      const { data, error } = await supabase
        .from('daily_market_products')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data?.updated_at) {
        const serverTimestamp = data.updated_at;
        
        if (lastKnownTimestamp.current && serverTimestamp !== lastKnownTimestamp.current) {
          // New data available!
          setHasNewData(true);
          if (showToast) {
            toast.info(t('newPriceAvailable'), {
              action: {
                label: t('refreshBtn'),
                onClick: handleRefresh,
              },
            });
          }
        }
        
        lastKnownTimestamp.current = serverTimestamp;
        setLastSyncedAt(new Date(serverTimestamp));
      }
    } catch (err) {
      console.error('Error checking for price updates:', err);
    } finally {
      setIsChecking(false);
    }
  }, [isOnline, t]);

  const handleRefresh = useCallback(() => {
    setHasNewData(false);
    onNewPrices?.();
    checkForUpdates();
  }, [onNewPrices, checkForUpdates, t]);

  // Initial check
  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  // Set up polling
  useEffect(() => {
    if (!isOnline) return;

    intervalRef.current = window.setInterval(() => {
      checkForUpdates(true);
    }, pollingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pollingInterval, isOnline, checkForUpdates]);

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Online/Offline indicator */}
      <Badge 
        variant="outline" 
        className={`gap-1 text-xs ${isOnline ? 'border-success/30 text-success' : 'border-destructive/30 text-destructive'}`}
      >
        {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {isOnline ? t('online') : t('offline')}
      </Badge>

      {/* Last synced time */}
      {lastSyncedAt && (
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <Clock className="h-3 w-3" />
          <span>
            {t('updated')}: {formatDistanceToNow(lastSyncedAt, { addSuffix: true })}
          </span>
        </div>
      )}

      {/* New data indicator + Refresh button */}
      <AnimatePresence>
        {hasNewData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              className="h-7 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
            >
              <RefreshCw className="h-3 w-3" />
              {t('newPrices')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual refresh button */}
      {!hasNewData && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleRefresh()}
          disabled={isChecking || !isOnline}
          className="h-7 w-7 p-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}
