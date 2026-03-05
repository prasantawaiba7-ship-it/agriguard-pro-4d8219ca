import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCropStage } from '@/lib/cropStage';
import { MapPin, Leaf, Clock } from 'lucide-react';

interface FarmContextLineProps {
  farmId?: string | null;
  farmCropId?: string | null;
}

export function FarmContextLine({ farmId, farmCropId }: FarmContextLineProps) {
  const { data } = useQuery({
    queryKey: ['farm-context', farmId, farmCropId],
    queryFn: async () => {
      let farm = null;
      let crop = null;

      if (farmId) {
        const { data: f } = await (supabase as any).from('farms').select('farm_name, district').eq('id', farmId).single();
        farm = f;
      }
      if (farmCropId) {
        const { data: c } = await (supabase as any).from('farm_crops').select('crop_type, sowing_date').eq('id', farmCropId).single();
        crop = c;
      }
      return { farm, crop };
    },
    enabled: !!farmId || !!farmCropId,
    staleTime: 5 * 60 * 1000,
  });

  if (!data?.farm && !data?.crop) {
    if (!farmId && !farmCropId) return null;
    return null;
  }

  const stage = data?.crop ? getCropStage(data.crop.sowing_date) : null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs bg-muted/60 border border-border/40 rounded-lg px-3 py-2">
      {data?.farm && (
        <span className="flex items-center gap-1 text-foreground">
          <MapPin className="w-3 h-3 text-muted-foreground" />
          <strong>खेत:</strong> {data.farm.farm_name}
          {data.farm.district && <span className="text-muted-foreground">({data.farm.district})</span>}
        </span>
      )}
      {data?.crop && (
        <span className="flex items-center gap-1 text-foreground">
          <Leaf className="w-3 h-3 text-primary" />
          <strong>बाली:</strong> {data.crop.crop_type}
        </span>
      )}
      {stage && (
        <span className="flex items-center gap-1 text-primary font-medium">
          <Clock className="w-3 h-3" />
          {stage.stageNameNe} ({stage.daysSinceSowing} दिन)
        </span>
      )}
    </div>
  );
}
