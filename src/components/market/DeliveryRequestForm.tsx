import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Truck } from 'lucide-react';
import { useDeliveryRequests } from '@/hooks/useDeliveryRequests';
import { useAuth } from '@/hooks/useAuth';
import { UserMarketCard } from '@/hooks/useUserMarketCards';

interface DeliveryRequestFormProps {
  card: UserMarketCard;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DeliveryRequestForm({ card, onSuccess, onCancel }: DeliveryRequestFormProps) {
  const { user } = useAuth();
  const { createRequest } = useDeliveryRequests();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState(card.price?.toString() || '');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || !address) return;

    if (!user) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createRequest.mutateAsync({
        card_id: card.id,
        requested_quantity: parseFloat(quantity),
        requested_price: price ? parseFloat(price) : undefined,
        delivery_address_text: address,
        buyer_notes: notes || undefined,
      });
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {/* Card Info */}
      <div className="p-3 bg-muted rounded-lg">
        <p className="font-medium">{card.title}</p>
        {card.crops && <p className="text-sm text-muted-foreground">{card.crops.name_ne}</p>}
        <p className="text-primary font-bold mt-1">
          {card.price ? `रु. ${card.price}/${card.unit}` : 'मोलमोलाई'}
        </p>
        {card.available_quantity && (
          <p className="text-xs text-muted-foreground">
            उपलब्ध: {card.available_quantity} {card.unit}
          </p>
        )}
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <Label>चाहिने मात्रा ({card.unit}) *</Label>
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={`जस्तै: 10 ${card.unit}`}
          required
          min="1"
          max={card.available_quantity || undefined}
        />
        {card.available_quantity && parseFloat(quantity) > card.available_quantity && (
          <p className="text-xs text-destructive">
            अधिकतम {card.available_quantity} {card.unit} उपलब्ध छ
          </p>
        )}
      </div>

      {/* Offered Price */}
      <div className="space-y-2">
        <Label>प्रस्तावित मूल्य (रु./{card.unit})</Label>
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={card.price?.toString() || 'मोलमोलाई'}
        />
        <p className="text-xs text-muted-foreground">
          बिक्रेताले यो मूल्य स्वीकार वा अस्वीकार गर्न सक्छन्
        </p>
      </div>

      {/* Delivery Address */}
      <div className="space-y-2">
        <Label>डेलिभरी ठेगाना *</Label>
        <Textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="पूरा ठेगाना लेख्नुहोस्..."
          rows={3}
          required
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>थप टिप्पणी</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="केही थप जानकारी..."
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={isSubmitting || !user}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Truck className="mr-2 h-4 w-4" />
          अनुरोध पठाउनुहोस्
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            रद्द
          </Button>
        )}
      </div>

      {!user && (
        <p className="text-xs text-center text-destructive">
          कृपया पहिले लगइन गर्नुहोस्
        </p>
      )}
    </form>
  );
}
