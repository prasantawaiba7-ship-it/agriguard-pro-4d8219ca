import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  TrendingUp, Plus, Edit2, Trash2, RefreshCw, 
  Calendar, Store, MapPin, AlertCircle, CheckCircle2, Clock, Wifi, WifiOff
} from 'lucide-react';
import { useCrops } from '@/hooks/useCrops';
import { useLocationData } from '@/hooks/useLocationData';
import { CSVMarketImport } from './CSVMarketImport';

interface DailyMarketProduct {
  id: string;
  date: string;
  crop_name: string;
  crop_name_ne: string | null;
  crop_id: number | null;
  province_id: number | null;
  district_id_fk: number | null;
  local_level_id: number | null;
  ward_number: number | null;
  market_name: string | null;
  market_name_ne: string | null;
  district: string | null;
  unit: string;
  price_min: number | null;
  price_max: number | null;
  price_avg: number | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export function DailyMarketPricesManager() {
  const queryClient = useQueryClient();
  const { activeCrops } = useCrops();
  const { provinces, districts, localLevels, handleProvinceChange, handleDistrictChange, selectedProvinceId, selectedDistrictId } = useLocationData();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DailyMarketProduct | null>(null);
  const [isRunningUpdate, setIsRunningUpdate] = useState(false);
  const [filterDate, setFilterDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    crop_id: '',
    province_id: '',
    district_id_fk: '',
    local_level_id: '',
    ward_number: '',
    market_name: '',
    market_name_ne: '',
    unit: 'kg',
    price_min: '',
    price_max: '',
    price_avg: '',
  });

  // Fetch daily products
  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['admin-daily-market-products', filterDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_market_products')
        .select('*')
        .eq('date', filterDate)
        .order('crop_name');
      
      if (error) throw error;
      return data as DailyMarketProduct[];
    },
  });

  // Fetch last update status
  const { data: lastUpdate } = useQuery({
    queryKey: ['daily-market-last-update'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_market_products')
        .select('updated_at, source')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const crop = activeCrops.find(c => c.id === parseInt(data.crop_id));
      if (!crop) throw new Error('Crop not found');

      const payload = {
        date: data.date,
        crop_id: parseInt(data.crop_id),
        crop_name: crop.name_en,
        crop_name_ne: crop.name_ne,
        province_id: data.province_id ? parseInt(data.province_id) : null,
        district_id_fk: data.district_id_fk ? parseInt(data.district_id_fk) : null,
        local_level_id: data.local_level_id ? parseInt(data.local_level_id) : null,
        ward_number: data.ward_number ? parseInt(data.ward_number) : null,
        market_name: data.market_name || null,
        market_name_ne: data.market_name_ne || null,
        unit: data.unit,
        price_min: data.price_min ? parseFloat(data.price_min) : null,
        price_max: data.price_max ? parseFloat(data.price_max) : null,
        price_avg: data.price_avg ? parseFloat(data.price_avg) : 
          (data.price_min && data.price_max ? 
            (parseFloat(data.price_min) + parseFloat(data.price_max)) / 2 : null),
        source: 'admin_manual',
        image_url: crop.image_url,
        district: districts.find(d => d.id === parseInt(data.district_id_fk))?.name_en || null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('daily_market_products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('daily_market_products')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-daily-market-products'] });
      queryClient.invalidateQueries({ queryKey: ['daily-market-last-update'] });
      toast.success(editingProduct ? 'मूल्य अपडेट भयो!' : 'नयाँ मूल्य थपियो!');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error('मूल्य सेभ गर्न असफल');
      console.error(error);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_market_products')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-daily-market-products'] });
      toast.success('मूल्य हटाइयो!');
    },
    onError: () => {
      toast.error('हटाउन असफल');
    },
  });

  // Run daily update function
  const runDailyUpdate = async () => {
    setIsRunningUpdate(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-daily-market');
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`${data.productsCount} उत्पादनहरू अपडेट भए!`);
        queryClient.invalidateQueries({ queryKey: ['admin-daily-market-products'] });
        queryClient.invalidateQueries({ queryKey: ['daily-market-last-update'] });
        refetch();
      } else {
        throw new Error(data?.error || 'Update failed');
      }
    } catch (err) {
      console.error('Daily update error:', err);
      toast.error('दैनिक अपडेट असफल');
    } finally {
      setIsRunningUpdate(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      crop_id: '',
      province_id: '',
      district_id_fk: '',
      local_level_id: '',
      ward_number: '',
      market_name: '',
      market_name_ne: '',
      unit: 'kg',
      price_min: '',
      price_max: '',
      price_avg: '',
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: DailyMarketProduct) => {
    setEditingProduct(product);
    setFormData({
      date: product.date,
      crop_id: product.crop_id?.toString() || '',
      province_id: product.province_id?.toString() || '',
      district_id_fk: product.district_id_fk?.toString() || '',
      local_level_id: product.local_level_id?.toString() || '',
      ward_number: product.ward_number?.toString() || '',
      market_name: product.market_name || '',
      market_name_ne: product.market_name_ne || '',
      unit: product.unit,
      price_min: product.price_min?.toString() || '',
      price_max: product.price_max?.toString() || '',
      price_avg: product.price_avg?.toString() || '',
    });
    if (product.province_id) handleProvinceChange(product.province_id);
    if (product.district_id_fk) handleDistrictChange(product.district_id_fk);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.crop_id) {
      toast.error('कृपया बाली छान्नुहोस्');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleDelete = (id: string) => {
    if (confirm('के तपाईं यो मूल्य हटाउन चाहनुहुन्छ?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            दैनिक बजार मूल्य
          </h2>
          <p className="text-sm text-muted-foreground">
            आजको बजार मूल्य व्यवस्थापन गर्नुहोस्
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <CSVMarketImport onImportSuccess={() => refetch()} />
          
          <Button
            variant="outline"
            size="sm"
            onClick={runDailyUpdate}
            disabled={isRunningUpdate}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRunningUpdate ? 'animate-spin' : ''}`} />
            Kalimati + बजार Sync
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" />
                नयाँ मूल्य
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'मूल्य सम्पादन' : 'नयाँ बजार मूल्य'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date */}
                <div className="space-y-1.5">
                  <Label>मिति</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                {/* Crop */}
                <div className="space-y-1.5">
                  <Label>बाली *</Label>
                  <Select
                    value={formData.crop_id}
                    onValueChange={(v) => setFormData({ ...formData, crop_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="बाली छान्नुहोस्" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {activeCrops.map((crop) => (
                        <SelectItem key={crop.id} value={crop.id.toString()}>
                          {crop.name_ne} ({crop.name_en})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>प्रदेश</Label>
                    <Select
                      value={formData.province_id}
                      onValueChange={(v) => {
                        setFormData({ ...formData, province_id: v, district_id_fk: '', local_level_id: '' });
                        handleProvinceChange(v ? parseInt(v) : null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="प्रदेश" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name_ne}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>जिल्ला</Label>
                    <Select
                      value={formData.district_id_fk}
                      onValueChange={(v) => {
                        setFormData({ ...formData, district_id_fk: v, local_level_id: '' });
                        handleDistrictChange(v ? parseInt(v) : null);
                      }}
                      disabled={!formData.province_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="जिल्ला" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((d) => (
                          <SelectItem key={d.id} value={d.id.toString()}>{d.name_ne}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Market Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>बजारको नाम (English)</Label>
                    <Input
                      value={formData.market_name}
                      onChange={(e) => setFormData({ ...formData, market_name: e.target.value })}
                      placeholder="Kalimati"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>बजारको नाम (नेपाली)</Label>
                    <Input
                      value={formData.market_name_ne}
                      onChange={(e) => setFormData({ ...formData, market_name_ne: e.target.value })}
                      placeholder="कालिमाटी"
                    />
                  </div>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>न्यूनतम (रु.)</Label>
                    <Input
                      type="number"
                      value={formData.price_min}
                      onChange={(e) => setFormData({ ...formData, price_min: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>अधिकतम (रु.)</Label>
                    <Input
                      type="number"
                      value={formData.price_max}
                      onChange={(e) => setFormData({ ...formData, price_max: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>औसत (रु.)</Label>
                    <Input
                      type="number"
                      value={formData.price_avg}
                      onChange={(e) => setFormData({ ...formData, price_avg: e.target.value })}
                      placeholder="75"
                    />
                  </div>
                </div>

                {/* Unit */}
                <div className="space-y-1.5">
                  <Label>एकाइ</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(v) => setFormData({ ...formData, unit: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">किलो (kg)</SelectItem>
                      <SelectItem value="quintal">क्विन्टल</SelectItem>
                      <SelectItem value="crate">क्रेट</SelectItem>
                      <SelectItem value="dozen">दर्जन</SelectItem>
                      <SelectItem value="piece">पिस</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    रद्द गर्नुहोस्
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'सेभ हुँदैछ...' : 'सेभ गर्नुहोस्'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">छानिएको मिति</p>
              <p className="font-semibold">{filterDate}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">उत्पादन संख्या</p>
              <p className="font-semibold">{products?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">अन्तिम अपडेट</p>
              <p className="font-semibold text-sm">
                {lastUpdate?.updated_at 
                  ? format(new Date(lastUpdate.updated_at), 'yyyy-MM-dd HH:mm')
                  : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Wifi className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kalimati API</p>
              <p className="font-semibold text-green-600 text-sm">Live Connected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-3">
        <Label>मिति छान्नुहोस्:</Label>
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-auto"
        />
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          ताजा गर्नुहोस्
        </Button>
      </div>

      {/* Products Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">बजार मूल्य सूची</CardTitle>
          <CardDescription>
            {filterDate} को बजार मूल्यहरू
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>बाली</TableHead>
                  <TableHead>बजार</TableHead>
                  <TableHead>जिल्ला</TableHead>
                  <TableHead className="text-right">न्यूनतम</TableHead>
                  <TableHead className="text-right">अधिकतम</TableHead>
                  <TableHead className="text-right">औसत</TableHead>
                  <TableHead>स्रोत</TableHead>
                  <TableHead className="text-right">कार्य</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : products && products.length > 0 ? (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.crop_name_ne || product.crop_name}
                      </TableCell>
                      <TableCell>{product.market_name_ne || product.market_name || '-'}</TableCell>
                      <TableCell>{product.district || '-'}</TableCell>
                      <TableCell className="text-right">
                        {product.price_min ? `रु. ${product.price_min}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.price_max ? `रु. ${product.price_max}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {product.price_avg ? `रु. ${product.price_avg}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.source === 'admin_manual' ? 'default' : 'secondary'} className="text-xs">
                          {product.source === 'admin_manual' ? 'Manual' : 'Auto'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      यो मितिमा कुनै मूल्य छैन।
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
