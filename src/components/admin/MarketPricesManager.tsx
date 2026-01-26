import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, TrendingUp, Upload, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MarketPrice {
  id: string;
  crop_type: string;
  price_per_quintal: number | null;
  price_date: string;
  state: string;
  district: string | null;
  mandi_name: string | null;
  demand_level: string | null;
  data_source: string | null;
}

const CROP_TYPES = ['wheat', 'rice', 'cotton', 'sugarcane', 'maize', 'soybean', 'groundnut', 'mustard', 'other'];
const DEMAND_LEVELS = ['low', 'medium', 'high'];
const DISTRICTS = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kavre', 'Chitwan', 'Morang', 'Jhapa', 'Sunsari', 'Rupandehi', 'Kaski'];

export function MarketPricesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<MarketPrice | null>(null);
  const [formData, setFormData] = useState({
    crop_type: 'rice',
    price_per_quintal: '',
    price_date: format(new Date(), 'yyyy-MM-dd'),
    state: 'Bagmati Province',
    district: '',
    mandi_name: '',
    demand_level: 'medium',
  });

  // Fetch prices
  const { data: prices, isLoading } = useQuery({
    queryKey: ['admin-market-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .order('price_date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as MarketPrice[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        crop_type: data.crop_type as any,
        price_per_quintal: parseFloat(data.price_per_quintal) || null,
        price_date: data.price_date,
        state: data.state,
        district: data.district || null,
        mandi_name: data.mandi_name || null,
        demand_level: data.demand_level || null,
        data_source: 'admin_manual',
      };

      if (editingPrice) {
        const { error } = await supabase
          .from('market_prices')
          .update(payload)
          .eq('id', editingPrice.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('market_prices')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-market-prices'] });
      toast({ title: 'सफल!', description: editingPrice ? 'मूल्य अपडेट भयो।' : 'नयाँ मूल्य थपियो।' });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to save price.', variant: 'destructive' });
      console.error(error);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('market_prices')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-market-prices'] });
      toast({ title: 'Deleted!', description: 'मूल्य हटाइयो।' });
    },
  });

  const resetForm = () => {
    setFormData({
      crop_type: 'rice',
      price_per_quintal: '',
      price_date: format(new Date(), 'yyyy-MM-dd'),
      state: 'Bagmati Province',
      district: '',
      mandi_name: '',
      demand_level: 'medium',
    });
    setEditingPrice(null);
  };

  const handleEdit = (price: MarketPrice) => {
    setEditingPrice(price);
    setFormData({
      crop_type: price.crop_type,
      price_per_quintal: price.price_per_quintal?.toString() || '',
      price_date: price.price_date,
      state: price.state,
      district: price.district || '',
      mandi_name: price.mandi_name || '',
      demand_level: price.demand_level || 'medium',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleDelete = (id: string) => {
    if (confirm('के तपाईं यो मूल्य हटाउन चाहनुहुन्छ?')) {
      deleteMutation.mutate(id);
    }
  };

  const getDemandBadgeClass = (level: string | null) => {
    switch (level) {
      case 'high': return 'bg-success/20 text-success';
      case 'low': return 'bg-destructive/20 text-destructive';
      default: return 'bg-warning/20 text-warning';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            बजार मूल्य व्यवस्थापन
          </h2>
          <p className="text-sm text-muted-foreground">
            बालीको मूल्य अपडेट गर्नुहोस्
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-market-prices'] })}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                नयाँ मूल्य
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPrice ? 'मूल्य सम्पादन' : 'नयाँ बजार मूल्य'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>बाली</Label>
                    <Select 
                      value={formData.crop_type} 
                      onValueChange={(v) => setFormData({ ...formData, crop_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CROP_TYPES.map((crop) => (
                          <SelectItem key={crop} value={crop} className="capitalize">
                            {crop}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>मूल्य (रु./क्विन्टल)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.price_per_quintal}
                      onChange={(e) => setFormData({ ...formData, price_per_quintal: e.target.value })}
                      placeholder="जस्तै: 4500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>मिति</Label>
                    <Input
                      type="date"
                      value={formData.price_date}
                      onChange={(e) => setFormData({ ...formData, price_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>माग स्तर</Label>
                    <Select 
                      value={formData.demand_level} 
                      onValueChange={(v) => setFormData({ ...formData, demand_level: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEMAND_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level === 'high' ? 'उच्च' : level === 'low' ? 'कम' : 'मध्यम'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>जिल्ला</Label>
                    <Select 
                      value={formData.district} 
                      onValueChange={(v) => setFormData({ ...formData, district: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="छान्नुहोस्" />
                      </SelectTrigger>
                      <SelectContent>
                        {DISTRICTS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>हाट/मण्डी नाम</Label>
                    <Input
                      value={formData.mandi_name}
                      onChange={(e) => setFormData({ ...formData, mandi_name: e.target.value })}
                      placeholder="वैकल्पिक"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : editingPrice ? 'अपडेट गर्नुहोस्' : 'थप्नुहोस्'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Prices Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !prices || prices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              कुनै मूल्य डाटा छैन। नयाँ थप्नुहोस्।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>बाली</TableHead>
                    <TableHead>मूल्य</TableHead>
                    <TableHead>जिल्ला</TableHead>
                    <TableHead>मिति</TableHead>
                    <TableHead>माग</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.map((price) => (
                    <TableRow key={price.id}>
                      <TableCell className="font-medium capitalize">{price.crop_type}</TableCell>
                      <TableCell>
                        {price.price_per_quintal 
                          ? `रु. ${price.price_per_quintal.toLocaleString()}` 
                          : '-'}
                      </TableCell>
                      <TableCell>{price.district || price.state}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(price.price_date), 'yyyy-MM-dd')}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getDemandBadgeClass(price.demand_level)}`}>
                          {price.demand_level === 'high' ? 'उच्च' : price.demand_level === 'low' ? 'कम' : 'मध्यम'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(price)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(price.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
