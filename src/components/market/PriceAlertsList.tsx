import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { usePriceAlerts, PriceAlert } from '@/hooks/usePriceAlerts';
import { PriceAlertForm } from './PriceAlertForm';
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, Repeat, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

export function PriceAlertsList() {
  const { user } = useAuth();
  const { alerts, isLoading, error, toggleActive, deleteAlert } = usePriceAlerts();
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getConditionLabel = (alert: PriceAlert): string => {
    const value = alert.threshold_value;
    switch (alert.condition_type) {
      case 'greater_equal':
        return `मूल्य ≥ रु. ${value}`;
      case 'less_equal':
        return `मूल्य ≤ रु. ${value}`;
      case 'percent_increase':
        return `${value}% बढ्यो (${alert.percent_reference_days} दिनमा)`;
      case 'percent_decrease':
        return `${value}% घट्यो (${alert.percent_reference_days} दिनमा)`;
      default:
        return '';
    }
  };

  const getConditionIcon = (conditionType: string) => {
    if (conditionType.includes('increase') || conditionType === 'greater_equal') {
      return <TrendingUp className="h-4 w-4 text-success" />;
    }
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('के तपाईं यो अलर्ट हटाउन चाहनुहुन्छ?')) return;
    setDeletingId(id);
    await deleteAlert(id);
    setDeletingId(null);
  };

  if (!user) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          मूल्य अलर्ट सेट गर्न कृपया लगइन गर्नुहोस्।
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          मेरा मूल्य अलर्टहरू
        </h3>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            नयाँ अलर्ट
          </Button>
        )}
      </div>

      {/* Alert Form */}
      {showForm && (
        <PriceAlertForm onClose={() => setShowForm(false)} />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && alerts.length === 0 && !showForm && (
        <Card className="border-border/60">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <BellOff className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <h4 className="font-semibold mb-2">कुनै अलर्ट छैन</h4>
            <p className="text-sm text-muted-foreground mb-4">
              मूल्य बढ्दा/घट्दा notification पाउन अलर्ट सेट गर्नुहोस्
            </p>
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              पहिलो अलर्ट सेट गर्नुहोस्
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      {!isLoading && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`border-border/60 transition-all ${
                alert.is_active ? 'hover:border-primary/30' : 'opacity-60'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.is_active ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {getConditionIcon(alert.condition_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold">
                        {alert.crop?.name_ne || 'Unknown Crop'}
                      </span>
                      {alert.market?.name_ne && (
                        <Badge variant="secondary" className="text-xs">
                          {alert.market.name_ne}
                        </Badge>
                      )}
                      {alert.is_recurring && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Repeat className="h-3 w-3" />
                          दोहोर्याउने
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {getConditionLabel(alert)}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>सेट: {format(new Date(alert.created_at), 'yyyy-MM-dd')}</span>
                      {alert.last_triggered_at && (
                        <span className="text-success">
                          अन्तिम trigger: {format(new Date(alert.last_triggered_at), 'yyyy-MM-dd')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={alert.is_active}
                      onCheckedChange={(checked) => toggleActive(alert.id, checked)}
                      aria-label={alert.is_active ? 'Disable alert' : 'Enable alert'}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(alert.id)}
                      disabled={deletingId === alert.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
