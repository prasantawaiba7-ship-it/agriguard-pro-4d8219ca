import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, Calendar, Leaf, Bug, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import { useLanguage } from '@/hooks/useLanguage';
import { format } from 'date-fns';

export function OfflineDataViewer() {
  const { language } = useLanguage();
  const {
    cropRecommendations,
    diseaseDetections,
    lastSync,
    isOnline,
    isSyncing,
    refreshCache,
    hasOfflineData,
  } = useOfflineCache();

  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [expandedDet, setExpandedDet] = useState<string | null>(null);

  const isNepali = language === 'ne';

  // Auto-sync when component mounts and online
  useEffect(() => {
    if (isOnline && !hasOfflineData) {
      refreshCache();
    }
  }, [isOnline]);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'PPp');
    } catch {
      return dateStr;
    }
  };

  const getSeverityColor = (severity: string | null) => {
    switch (severity?.toLowerCase()) {
      case 'low': return 'bg-success/20 text-success';
      case 'medium': return 'bg-warning/20 text-warning';
      case 'high': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-success" />
          ) : (
            <WifiOff className="h-5 w-5 text-destructive" />
          )}
          <div>
            <p className="font-medium text-foreground">
              {isOnline 
                ? (isNepali ? 'अनलाइन' : 'Online')
                : (isNepali ? 'अफलाइन मोड' : 'Offline Mode')
              }
            </p>
            {lastSync && (
              <p className="text-xs text-muted-foreground">
                {isNepali ? 'अन्तिम सिंक:' : 'Last synced:'} {formatDate(lastSync.toISOString())}
              </p>
            )}
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshCache}
          disabled={!isOnline || isSyncing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isNepali ? 'सिंक गर्नुहोस्' : 'Sync Now'}
        </Button>
      </div>

      {/* Offline Notice */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <p className="font-medium text-warning">
              {isNepali ? 'तपाईं अफलाइन हुनुहुन्छ' : "You're offline"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isNepali 
                ? 'तल भएको डाटा तपाईंको अन्तिम सिंकबाट क्यास गरिएको छ।'
                : 'The data below is cached from your last sync.'
              }
            </p>
          </div>
        </motion.div>
      )}

      {/* Crop Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Leaf className="h-5 w-5 text-success" />
            {isNepali ? 'बाली सिफारिसहरू' : 'Crop Recommendations'}
          </CardTitle>
          <CardDescription>
            {isNepali 
              ? `${cropRecommendations.length} सिफारिसहरू क्यास गरिएको`
              : `${cropRecommendations.length} recommendations cached`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {cropRecommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isNepali 
                ? 'कुनै क्यास गरिएको सिफारिस छैन'
                : 'No cached recommendations'
              }
            </p>
          ) : (
            cropRecommendations.map((rec) => (
              <Collapsible 
                key={rec.id}
                open={expandedRec === rec.id}
                onOpenChange={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🌾</span>
                      <div>
                        <p className="font-medium text-foreground">{rec.plot_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(rec.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {rec.sustainability_score && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(rec.sustainability_score)}% {isNepali ? 'दिगो' : 'Sustainable'}
                        </Badge>
                      )}
                      {expandedRec === rec.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 border border-t-0 rounded-b-lg space-y-3">
                    {rec.recommended_crops && (
                      <div>
                        <p className="text-sm font-medium mb-2">
                          {isNepali ? 'सिफारिस गरिएका बालीहरू:' : 'Recommended Crops:'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(rec.recommended_crops) ? rec.recommended_crops : [rec.recommended_crops]).map((crop: any, i: number) => (
                            <Badge key={i} className="bg-primary/20 text-primary">
                              {typeof crop === 'object' ? crop.name || crop.crop : crop}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {rec.reasoning && (
                      <div>
                        <p className="text-sm font-medium mb-1">
                          {isNepali ? 'कारण:' : 'Reasoning:'}
                        </p>
                        <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </CardContent>
      </Card>

      {/* Disease Detections */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bug className="h-5 w-5 text-warning" />
            {isNepali ? 'रोग पत्ता लगाउने' : 'Disease Detections'}
          </CardTitle>
          <CardDescription>
            {isNepali 
              ? `${diseaseDetections.length} विश्लेषणहरू क्यास गरिएको`
              : `${diseaseDetections.length} analyses cached`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {diseaseDetections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isNepali 
                ? 'कुनै क्यास गरिएको विश्लेषण छैन'
                : 'No cached analyses'
              }
            </p>
          ) : (
            diseaseDetections.map((det) => (
              <Collapsible 
                key={det.id}
                open={expandedDet === det.id}
                onOpenChange={() => setExpandedDet(expandedDet === det.id ? null : det.id)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden">
                        <img 
                          src={det.image_url} 
                          alt="Crop"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {det.detected_disease || (isNepali ? 'स्वस्थ' : 'Healthy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(det.analyzed_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {det.severity && (
                        <Badge className={getSeverityColor(det.severity)}>
                          {det.severity}
                        </Badge>
                      )}
                      {expandedDet === det.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 border border-t-0 rounded-b-lg space-y-3">
                    {det.confidence_score && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {isNepali ? 'विश्वास:' : 'Confidence:'}
                        </span>
                        <Badge variant="outline">
                          {Math.round(det.confidence_score * 100)}%
                        </Badge>
                      </div>
                    )}
                    {det.treatment_recommendations && (
                      <div>
                        <p className="text-sm font-medium mb-1">
                          {isNepali ? 'उपचार:' : 'Treatment:'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {typeof det.treatment_recommendations === 'string' 
                            ? det.treatment_recommendations 
                            : JSON.stringify(det.treatment_recommendations)
                          }
                        </p>
                      </div>
                    )}
                    {det.prevention_tips && det.prevention_tips.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">
                          {isNepali ? 'रोकथाम सुझावहरू:' : 'Prevention Tips:'}
                        </p>
                        <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                          {det.prevention_tips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
