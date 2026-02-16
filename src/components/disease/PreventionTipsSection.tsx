import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Loader2, Leaf } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';

interface PreventionTip {
  id: string;
  crop: string | null;
  season: string | null;
  short_tip: string;
  detailed_tip: string | null;
}

interface PreventionResponse {
  crop: string | null;
  season: string;
  tips: PreventionTip[];
}

export function PreventionTipsSection() {
  const { t } = useLanguage();
  const { profile } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['prevention-tips', profile?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (profile?.id) params.set('farmer_id', profile.id);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-prevention-tips?${params}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      if (!res.ok) throw new Error('Failed to fetch prevention tips');
      return (await res.json()) as PreventionResponse;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          <p>Prevention tips unavailable right now.</p>
        </CardContent>
      </Card>
    );
  }

  const tips = data?.tips || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{t('preventionTips') || 'रोकथाम सुझावहरू'}</h3>
        {data?.season && (
          <Badge variant="outline" className="ml-2">{data.season}</Badge>
        )}
        {data?.crop && (
          <Badge variant="secondary" className="ml-1">{data.crop}</Badge>
        )}
      </div>

      {tips.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <Leaf className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>{t('noPreventionTips') || 'अहिलेसम्म कुनै सुझाव उपलब्ध छैन।'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tips.map((tip) => (
            <Card key={tip.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="text-primary">🛡️</span>
                  {tip.short_tip}
                </CardTitle>
              </CardHeader>
              {tip.detailed_tip && (
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">{tip.detailed_tip}</p>
                  <div className="flex gap-2 mt-2">
                    {tip.crop && <Badge variant="outline" className="text-[10px]">{tip.crop}</Badge>}
                    {tip.season && <Badge variant="outline" className="text-[10px]">{tip.season}</Badge>}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
