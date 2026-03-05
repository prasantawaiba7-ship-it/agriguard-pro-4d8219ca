import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Leaf, Calendar, Trash2 } from 'lucide-react';
import { useFarmCrops, useCreateFarmCrop, useDeleteFarmCrop, FarmCrop } from '@/hooks/useFarms';
import { getCropStage } from '@/lib/cropStage';

interface FarmCropsListProps {
  farmId: string;
}

export function FarmCropsList({ farmId }: FarmCropsListProps) {
  const { data: crops, isLoading } = useFarmCrops(farmId);
  const createCrop = useCreateFarmCrop();
  const deleteCrop = useDeleteFarmCrop();
  const [open, setOpen] = useState(false);

  const [cropType, setCropType] = useState('');
  const [season, setSeason] = useState('');
  const [sowingDate, setSowingDate] = useState('');
  const [area, setArea] = useState('');

  const handleAdd = async () => {
    if (!cropType.trim()) return;
    await createCrop.mutateAsync({
      farm_id: farmId,
      crop_type: cropType.trim(),
      season: season || undefined,
      sowing_date: sowingDate || undefined,
      area: area ? parseFloat(area) : undefined,
    });
    setCropType(''); setSeason(''); setSowingDate(''); setArea('');
    setOpen(false);
  };

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Leaf className="w-4 h-4 text-primary" /> हालका बालीहरू
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="w-3 h-3 mr-1" />बाली थप्नुहोस्</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>🌱 नयाँ बाली थप्नुहोस्</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>बालीको नाम *</Label>
                <Input value={cropType} onChange={e => setCropType(e.target.value)} placeholder="जस्तै: धान, गहुँ" />
              </div>
              <div>
                <Label>सिजन</Label>
                <Input value={season} onChange={e => setSeason(e.target.value)} placeholder="जस्तै: Summer 2081" />
              </div>
              <div>
                <Label><Calendar className="w-3 h-3 inline mr-1" />रोपाई/बिउ मिति</Label>
                <Input type="date" value={sowingDate} onChange={e => setSowingDate(e.target.value)} />
              </div>
              <div>
                <Label>क्षेत्रफल</Label>
                <Input type="number" step="0.01" value={area} onChange={e => setArea(e.target.value)} />
              </div>
              <Button onClick={handleAdd} disabled={createCrop.isPending || !cropType.trim()} className="w-full">
                {createCrop.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                थप्नुहोस्
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-2">
        {(!crops || crops.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-4">कुनै बाली छैन। माथिको बटनबाट थप्नुहोस्।</p>
        ) : (
          crops.map((crop: FarmCrop) => {
            const stage = getCropStage(crop.sowing_date);
            return (
              <div key={crop.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{crop.crop_type}</span>
                    <Badge variant={crop.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                      {crop.status === 'active' ? 'सक्रिय' : 'सकियो'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-2">
                    {crop.season && <span>{crop.season}</span>}
                    {crop.area && <span>{crop.area} unit</span>}
                    {stage && (
                      <span className="text-primary font-medium">
                        {stage.stageNameNe} ({stage.daysSinceSowing} दिन)
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteCrop.mutate(crop.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
