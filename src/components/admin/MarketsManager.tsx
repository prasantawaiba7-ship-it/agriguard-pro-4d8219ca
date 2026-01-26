import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useLocationData } from '@/hooks/useLocationData';
import { Store, Plus, Edit, Trash2, Loader2, MapPin, Phone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Market {
  id: string;
  name_en: string;
  name_ne: string;
  province_id: number | null;
  district_id: number | null;
  local_level_id: number | null;
  ward_number: number | null;
  latitude: number | null;
  longitude: number | null;
  market_type: string;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  popular_products: string[] | null;
  address: string | null;
  address_ne: string | null;
  is_active: boolean;
}

const MARKET_TYPES = [
  { value: 'wholesale', label: 'थोक बजार' },
  { value: 'retail', label: 'खुद्रा बजार' },
  { value: 'cooperative', label: 'सहकारी बजार' },
  { value: 'haat', label: 'हाट बजार' },
];

export const MarketsManager = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const [saving, setSaving] = useState(false);

  const { provinces, districts, localLevels, handleProvinceChange, handleDistrictChange } = useLocationData();

  // Form state
  const [formData, setFormData] = useState({
    name_en: '',
    name_ne: '',
    province_id: '',
    district_id: '',
    local_level_id: '',
    ward_number: '',
    latitude: '',
    longitude: '',
    market_type: 'retail',
    contact_phone: '',
    contact_whatsapp: '',
    popular_products: '',
    address: '',
    address_ne: '',
    is_active: true,
  });

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .order('name_ne', { ascending: true });

      if (error) throw error;
      setMarkets(data || []);
    } catch (err) {
      console.error('Error fetching markets:', err);
      toast.error('बजारहरू लोड गर्न सकिएन');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ne: '',
      province_id: '',
      district_id: '',
      local_level_id: '',
      ward_number: '',
      latitude: '',
      longitude: '',
      market_type: 'retail',
      contact_phone: '',
      contact_whatsapp: '',
      popular_products: '',
      address: '',
      address_ne: '',
      is_active: true,
    });
    setEditingMarket(null);
  };

  const openEditDialog = (market: Market) => {
    setEditingMarket(market);
    setFormData({
      name_en: market.name_en,
      name_ne: market.name_ne,
      province_id: market.province_id?.toString() || '',
      district_id: market.district_id?.toString() || '',
      local_level_id: market.local_level_id?.toString() || '',
      ward_number: market.ward_number?.toString() || '',
      latitude: market.latitude?.toString() || '',
      longitude: market.longitude?.toString() || '',
      market_type: market.market_type,
      contact_phone: market.contact_phone || '',
      contact_whatsapp: market.contact_whatsapp || '',
      popular_products: market.popular_products?.join(', ') || '',
      address: market.address || '',
      address_ne: market.address_ne || '',
      is_active: market.is_active,
    });
    
    // Load districts for selected province
    if (market.province_id) {
      handleProvinceChange(market.province_id);
    }
    if (market.district_id) {
      handleDistrictChange(market.district_id);
    }
    
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name_ne || !formData.name_en) {
      toast.error('बजारको नाम आवश्यक छ');
      return;
    }

    setSaving(true);
    try {
      const marketData = {
        name_en: formData.name_en,
        name_ne: formData.name_ne,
        province_id: formData.province_id ? Number(formData.province_id) : null,
        district_id: formData.district_id ? Number(formData.district_id) : null,
        local_level_id: formData.local_level_id ? Number(formData.local_level_id) : null,
        ward_number: formData.ward_number ? Number(formData.ward_number) : null,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        market_type: formData.market_type,
        contact_phone: formData.contact_phone || null,
        contact_whatsapp: formData.contact_whatsapp || null,
        popular_products: formData.popular_products 
          ? formData.popular_products.split(',').map(p => p.trim()).filter(Boolean)
          : null,
        address: formData.address || null,
        address_ne: formData.address_ne || null,
        is_active: formData.is_active,
      };

      if (editingMarket) {
        const { error } = await supabase
          .from('markets')
          .update(marketData)
          .eq('id', editingMarket.id);

        if (error) throw error;
        toast.success('बजार अपडेट भयो');
      } else {
        const { error } = await supabase
          .from('markets')
          .insert([marketData]);

        if (error) throw error;
        toast.success('नयाँ बजार थपियो');
      }

      setDialogOpen(false);
      resetForm();
      fetchMarkets();
    } catch (err) {
      console.error('Error saving market:', err);
      toast.error('बजार सेभ गर्न सकिएन');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('के तपाईं यो बजार हटाउन चाहनुहुन्छ?')) return;

    try {
      const { error } = await supabase
        .from('markets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('बजार हटाइयो');
      fetchMarkets();
    } catch (err) {
      console.error('Error deleting market:', err);
      toast.error('बजार हटाउन सकिएन');
    }
  };

  const getMarketTypeLabel = (type: string) => {
    return MARKET_TYPES.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">बजार व्यवस्थापन</h2>
          <p className="text-muted-foreground">Markets: {markets.length}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchMarkets}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                नयाँ बजार
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMarket ? 'बजार सम्पादन' : 'नयाँ बजार थप्नुहोस्'}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>नाम (नेपाली) *</Label>
                    <Input
                      value={formData.name_ne}
                      onChange={(e) => setFormData(f => ({ ...f, name_ne: e.target.value }))}
                      placeholder="कालिमाटी थोक बजार"
                    />
                  </div>
                  <div>
                    <Label>Name (English) *</Label>
                    <Input
                      value={formData.name_en}
                      onChange={(e) => setFormData(f => ({ ...f, name_en: e.target.value }))}
                      placeholder="Kalimati Wholesale Market"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>बजार प्रकार</Label>
                    <Select
                      value={formData.market_type}
                      onValueChange={(v) => setFormData(f => ({ ...f, market_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        {MARKET_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(f => ({ ...f, is_active: checked }))}
                    />
                    <Label>सक्रिय</Label>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>प्रदेश</Label>
                    <Select
                      value={formData.province_id}
                      onValueChange={(v) => {
                        setFormData(f => ({ ...f, province_id: v, district_id: '', local_level_id: '' }));
                        handleProvinceChange(Number(v));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="छान्नुहोस्" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        {provinces.map(p => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name_ne}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>जिल्ला</Label>
                    <Select
                      value={formData.district_id}
                      onValueChange={(v) => {
                        setFormData(f => ({ ...f, district_id: v, local_level_id: '' }));
                        handleDistrictChange(Number(v));
                      }}
                      disabled={!formData.province_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="छान्नुहोस्" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        {districts.map(d => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name_ne}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>पालिका</Label>
                    <Select
                      value={formData.local_level_id}
                      onValueChange={(v) => setFormData(f => ({ ...f, local_level_id: v }))}
                      disabled={!formData.district_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="छान्नुहोस्" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        {localLevels.map(l => (
                          <SelectItem key={l.id} value={String(l.id)}>
                            {l.name_ne}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>वडा नम्बर</Label>
                    <Input
                      type="number"
                      value={formData.ward_number}
                      onChange={(e) => setFormData(f => ({ ...f, ward_number: e.target.value }))}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label>Latitude</Label>
                    <Input
                      value={formData.latitude}
                      onChange={(e) => setFormData(f => ({ ...f, latitude: e.target.value }))}
                      placeholder="27.6990"
                    />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input
                      value={formData.longitude}
                      onChange={(e) => setFormData(f => ({ ...f, longitude: e.target.value }))}
                      placeholder="85.2850"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ठेगाना (नेपाली)</Label>
                    <Input
                      value={formData.address_ne}
                      onChange={(e) => setFormData(f => ({ ...f, address_ne: e.target.value }))}
                      placeholder="काठमाण्डौ"
                    />
                  </div>
                  <div>
                    <Label>Address (English)</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData(f => ({ ...f, address: e.target.value }))}
                      placeholder="Kathmandu"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>सम्पर्क फोन</Label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(f => ({ ...f, contact_phone: e.target.value }))}
                      placeholder="+977-1-4123456"
                    />
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    <Input
                      value={formData.contact_whatsapp}
                      onChange={(e) => setFormData(f => ({ ...f, contact_whatsapp: e.target.value }))}
                      placeholder="+9779812345678"
                    />
                  </div>
                </div>

                <div>
                  <Label>मुख्य उत्पादनहरू (comma-separated)</Label>
                  <Textarea
                    value={formData.popular_products}
                    onChange={(e) => setFormData(f => ({ ...f, popular_products: e.target.value }))}
                    placeholder="Tomato, Potato, Onion, Cabbage"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    रद्द गर्नुहोस्
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingMarket ? 'अपडेट गर्नुहोस्' : 'थप्नुहोस्'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Markets List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {markets.map((market) => (
          <Card key={market.id} className={`${!market.is_active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{market.name_ne}</CardTitle>
                </div>
                <Badge variant={market.is_active ? 'default' : 'secondary'}>
                  {getMarketTypeLabel(market.market_type)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{market.name_en}</p>
              
              {market.address_ne && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {market.address_ne}
                </div>
              )}

              {market.contact_phone && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {market.contact_phone}
                </div>
              )}

              {market.popular_products && market.popular_products.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {market.popular_products.slice(0, 3).map((p, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted">
                      {p}
                    </span>
                  ))}
                  {market.popular_products.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{market.popular_products.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEditDialog(market)}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(market.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {markets.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>कुनै बजार थपिएको छैन।</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
