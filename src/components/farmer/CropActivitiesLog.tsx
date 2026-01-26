import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCropActivities, CropActivity, ActivityType, ACTIVITY_LABELS, CreateActivityInput } from '@/hooks/useCropActivities';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2, Calendar, Coins } from 'lucide-react';
import { format } from 'date-fns';

interface CropActivitiesLogProps {
  plotId?: string;
  plotName?: string;
}

export function CropActivitiesLog({ plotId, plotName }: CropActivitiesLogProps) {
  const { user } = useAuth();
  const { activities, isLoading, createActivity, deleteActivity } = useCropActivities(plotId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateActivityInput>({
    plot_id: plotId,
    crop_name: '',
    activity_type: 'other',
    activity_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    cost_npr: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.crop_name || !formData.activity_type) return;

    const result = await createActivity({
      ...formData,
      plot_id: plotId,
    });
    
    if (result) {
      setIsDialogOpen(false);
      setFormData({
        plot_id: plotId,
        crop_name: '',
        activity_type: 'other',
        activity_date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
        cost_npr: undefined,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('के तपाईं यो record हटाउन चाहनुहुन्छ?')) {
      await deleteActivity(id);
    }
  };

  const getActivityBadgeColor = (type: ActivityType): string => {
    const colors: Record<ActivityType, string> = {
      sowing: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      fertilizer: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      spray: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      irrigation: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      weeding: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
      harvest: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    };
    return colors[type];
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          कृपया पहिला login गर्नुहोस्।
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">खेती गतिविधि Log</h3>
          {plotName && <p className="text-sm text-muted-foreground">{plotName}</p>}
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              गतिविधि थप्नुहोस्
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>आजको काम Record गर्नुहोस्</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="crop_name">बाली *</Label>
                <Input
                  id="crop_name"
                  value={formData.crop_name}
                  onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                  placeholder="जस्तै: धान, गहुँ, मकै"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>गतिविधि प्रकार *</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={formData.activity_type === type ? 'default' : 'outline'}
                      className="flex flex-col h-auto py-2 px-2"
                      onClick={() => setFormData({ ...formData, activity_type: type })}
                    >
                      <span className="text-lg">{ACTIVITY_LABELS[type].icon}</span>
                      <span className="text-xs">{ACTIVITY_LABELS[type].ne}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="activity_date">मिति *</Label>
                  <Input
                    id="activity_date"
                    type="date"
                    value={formData.activity_date}
                    onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_npr">खर्च (रु.)</Label>
                  <Input
                    id="cost_npr"
                    type="number"
                    min="0"
                    value={formData.cost_npr || ''}
                    onChange={(e) => setFormData({ ...formData, cost_npr: parseFloat(e.target.value) || undefined })}
                    placeholder="वैकल्पिक"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">विवरण</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="थप जानकारी..."
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Record गर्नुहोस्
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            कुनै गतिविधि record छैन। आजको काम थप्नुहोस्!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="text-2xl">
                      {ACTIVITY_LABELS[activity.activity_type as ActivityType]?.icon || '📝'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getActivityBadgeColor(activity.activity_type as ActivityType)}>
                          {ACTIVITY_LABELS[activity.activity_type as ActivityType]?.ne || activity.activity_type}
                        </Badge>
                        <span className="font-medium">{activity.crop_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(activity.activity_date), 'yyyy-MM-dd')}
                        </div>
                        {activity.cost_npr && (
                          <div className="flex items-center gap-1">
                            <Coins className="h-3 w-3" />
                            रु. {activity.cost_npr}
                          </div>
                        )}
                      </div>

                      {activity.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{activity.notes}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(activity.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
