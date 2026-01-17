import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MapPin, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface OutbreakAlert {
  id: string;
  district: string;
  state: string;
  disease_name: string;
  detection_count: number;
  severity: string;
  is_active: boolean;
  last_detected_at: string;
}

export function OutbreakAlertsBanner() {
  const { profile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch outbreak alerts for user's region
  const { data: outbreakAlerts, isLoading } = useQuery({
    queryKey: ['local-outbreak-alerts', profile?.district, profile?.state],
    queryFn: async () => {
      let query = supabase
        .from('disease_outbreak_alerts')
        .select('*')
        .eq('is_active', true)
        .order('detection_count', { ascending: false });

      // Prioritize user's district if set
      const { data, error } = await query;

      if (error) throw error;

      // Sort to show user's district first
      const alerts = data as OutbreakAlert[];
      if (profile?.district) {
        alerts.sort((a, b) => {
          if (a.district === profile.district) return -1;
          if (b.district === profile.district) return 1;
          return 0;
        });
      }

      return alerts;
    },
  });

  if (isLoading || !outbreakAlerts || outbreakAlerts.length === 0) {
    return null;
  }

  const userDistrictAlerts = outbreakAlerts.filter(
    a => a.district === profile?.district || a.state === profile?.state
  );

  const hasLocalAlerts = userDistrictAlerts.length > 0;

  return (
    <Card className={`mb-6 ${hasLocalAlerts ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'}`}>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${hasLocalAlerts ? 'text-destructive' : 'text-warning'}`} />
            {hasLocalAlerts ? (
              <span className="text-destructive">तपाईंको क्षेत्रमा रोग प्रकोप!</span>
            ) : (
              <span className="text-warning">नेपालमा सक्रिय रोग प्रकोपहरू</span>
            )}
            <Badge variant="outline" className="ml-2">
              {outbreakAlerts.length}
            </Badge>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-60 overflow-auto">
            {outbreakAlerts.slice(0, 10).map(alert => {
              const isLocal = alert.district === profile?.district;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isLocal ? 'bg-destructive/10 border border-destructive/30' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      alert.severity === 'high' ? 'bg-destructive/20' :
                      alert.severity === 'medium' ? 'bg-warning/20' : 'bg-amber-500/20'
                    }`}>
                      <Bug className={`h-4 w-4 ${
                        alert.severity === 'high' ? 'text-destructive' :
                        alert.severity === 'medium' ? 'text-warning' : 'text-amber-500'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2">
                        {alert.disease_name}
                        {isLocal && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            तपाईंको क्षेत्र
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {alert.district}, {alert.state}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={alert.severity === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {alert.detection_count} रिपोर्ट
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(alert.last_detected_at).toLocaleDateString('ne-NP')}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {hasLocalAlerts && (
            <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-sm font-medium text-destructive mb-1">⚠️ सावधान रहनुहोस्!</p>
              <p className="text-xs text-muted-foreground">
                तपाईंको जिल्लामा यी रोगहरू पहिचान भएका छन्। 
                आफ्नो बालीको नियमित निरीक्षण गर्नुहोस् र लक्षण देखिएमा तुरुन्त उपचार गर्नुहोस्।
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
