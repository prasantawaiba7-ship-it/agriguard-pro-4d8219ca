import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Loader2 } from 'lucide-react';
import { useCrops } from '@/hooks/useCrops';
import { useLocationData } from '@/hooks/useLocationData';
import { useUserMarketCards, CreateCardInput } from '@/hooks/useUserMarketCards';
import { ProduceImageUpload } from './ProduceImageUpload';

interface UserMarketCardFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingCard?: any;
}

export function UserMarketCardForm({ onSuccess, onCancel, editingCard }: UserMarketCardFormProps) {
  const { activeCrops: crops } = useCrops();
  const { createCard, updateCard } = useUserMarketCards();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [cropId, setCropId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cardType, setCardType] = useState<'sell' | 'buy'>('sell');
  const [priceType, setPriceType] = useState<'fixed' | 'range' | 'negotiable'>('fixed');
  const [price, setPrice] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [unit, setUnit] = useState('kg');
  const [quantity, setQuantity] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Location - use hook with handlers
  const { 
    provinces, 
    districts, 
    localLevels,
    handleProvinceChange,
    handleDistrictChange,
    handleLocalLevelChange,
  } = useLocationData();
  
  const [provinceId, setProvinceId] = useState<string>('');
  const [districtId, setDistrictId] = useState<string>('');
  const [localLevelId, setLocalLevelId] = useState<string>('');
  const [wardNumber, setWardNumber] = useState('');

  // When province changes, update districts
  const onProvinceChange = (value: string) => {
    setProvinceId(value);
    setDistrictId('');
    setLocalLevelId('');
    handleProvinceChange(value ? parseInt(value) : null);
  };

  // When district changes, update local levels
  const onDistrictChange = (value: string) => {
    setDistrictId(value);
    setLocalLevelId('');
    handleDistrictChange(value ? parseInt(value) : null);
  };

  // When local level changes
  const onLocalLevelChange = (value: string) => {
    setLocalLevelId(value);
    handleLocalLevelChange(value ? parseInt(value) : null);
  };

  // Fill form when editing
  useEffect(() => {
    if (editingCard) {
      setCropId(editingCard.crop_id?.toString() || '');
      setTitle(editingCard.title || '');
      setDescription(editingCard.description || '');
      setCardType(editingCard.card_type || 'sell');
      setPriceType(editingCard.price_type || 'fixed');
      setPrice(editingCard.price?.toString() || '');
      setPriceMin(editingCard.price_min?.toString() || '');
      setPriceMax(editingCard.price_max?.toString() || '');
      setUnit(editingCard.unit || 'kg');
      setQuantity(editingCard.available_quantity?.toString() || '');
      setContactPhone(editingCard.contact_phone || '');
      setWhatsapp(editingCard.whatsapp || '');
      setImages(editingCard.images || []);
      if (editingCard.province_id) {
        onProvinceChange(editingCard.province_id.toString());
      }
      if (editingCard.district_id) {
        setTimeout(() => onDistrictChange(editingCard.district_id.toString()), 100);
      }
      if (editingCard.local_level_id) {
        setTimeout(() => onLocalLevelChange(editingCard.local_level_id.toString()), 200);
      }
      setWardNumber(editingCard.ward_number?.toString() || '');
    }
  }, [editingCard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const input: CreateCardInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        card_type: cardType,
        price_type: priceType,
        unit,
        images,
        crop_id: cropId ? parseInt(cropId) : undefined,
        price: priceType === 'fixed' && price ? parseFloat(price) : undefined,
        price_min: priceType === 'range' && priceMin ? parseFloat(priceMin) : undefined,
        price_max: priceType === 'range' && priceMax ? parseFloat(priceMax) : undefined,
        available_quantity: quantity ? parseFloat(quantity) : undefined,
        contact_phone: contactPhone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        province_id: provinceId ? parseInt(provinceId) : undefined,
        district_id: districtId ? parseInt(districtId) : undefined,
        local_level_id: localLevelId ? parseInt(localLevelId) : undefined,
        ward_number: wardNumber ? parseInt(wardNumber) : undefined,
      };

      if (editingCard) {
        await updateCard.mutateAsync({ id: editingCard.id, ...input });
      } else {
        await createCard.mutateAsync(input);
      }
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {editingCard ? 'कार्ड सम्पादन' : 'नयाँ कार्ड थप्नुहोस्'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Type */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={cardType === 'sell' ? 'default' : 'outline'}
              onClick={() => setCardType('sell')}
              className="w-full"
            >
              बेच्ने 🏷️
            </Button>
            <Button
              type="button"
              variant={cardType === 'buy' ? 'default' : 'outline'}
              onClick={() => setCardType('buy')}
              className="w-full"
            >
              किन्ने 🛒
            </Button>
          </div>

          {/* Crop Selection */}
          <div className="space-y-2">
            <Label>बाली छान्नुहोस्</Label>
            <Select value={cropId} onValueChange={setCropId}>
              <SelectTrigger>
                <SelectValue placeholder="बाली छान्नुहोस्" />
              </SelectTrigger>
              <SelectContent>
                {crops.map((crop) => (
                  <SelectItem key={crop.id} value={crop.id.toString()}>
                    {crop.name_ne}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>शीर्षक *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="जस्तै: ताजा गोलभेडा बिक्रीमा"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>विवरण</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="थप विवरण..."
              rows={3}
            />
          </div>

          {/* Price Type & Amount */}
          <div className="space-y-2">
            <Label>मूल्य प्रकार</Label>
            <Select value={priceType} onValueChange={(v) => setPriceType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">निश्चित मूल्य</SelectItem>
                <SelectItem value="range">मूल्य दायरा</SelectItem>
                <SelectItem value="negotiable">मोलमोलाई</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {priceType === 'fixed' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>मूल्य (रु.)</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label>एकाइ</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">के.जी.</SelectItem>
                    <SelectItem value="quintal">क्विन्टल</SelectItem>
                    <SelectItem value="dozen">दर्जन</SelectItem>
                    <SelectItem value="piece">थान</SelectItem>
                    <SelectItem value="bundle">मुठा</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {priceType === 'range' && (
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label>न्यूनतम</Label>
                <Input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="80"
                />
              </div>
              <div className="space-y-2">
                <Label>अधिकतम</Label>
                <Input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="120"
                />
              </div>
              <div className="space-y-2">
                <Label>एकाइ</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">के.जी.</SelectItem>
                    <SelectItem value="quintal">क्विन्टल</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label>उपलब्ध मात्रा</Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="50"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>स्थान</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={provinceId} onValueChange={onProvinceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="प्रदेश" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name_ne}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={districtId} onValueChange={(v) => { setDistrictId(v); setLocalLevelId(''); }} disabled={!provinceId}>
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
            <div className="grid grid-cols-2 gap-2">
              <Select value={localLevelId} onValueChange={setLocalLevelId} disabled={!districtId}>
                <SelectTrigger>
                  <SelectValue placeholder="स्थानीय तह" />
                </SelectTrigger>
                <SelectContent>
                  {localLevels.map((l) => (
                    <SelectItem key={l.id} value={l.id.toString()}>{l.name_ne}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={wardNumber}
                onChange={(e) => setWardNumber(e.target.value)}
                placeholder="वडा नं."
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>फोन नम्बर</Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="98XXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="98XXXXXXXX"
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>फोटोहरू (अधिकतम ४)</Label>
            <ProduceImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCard ? 'अपडेट गर्नुहोस्' : 'प्रकाशित गर्नुहोस्'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                रद्द गर्नुहोस्
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
