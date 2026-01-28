import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Phone, MessageCircle, MapPin, Clock, ShoppingCart, Tag, Truck, AlertTriangle, Filter } from 'lucide-react';
import { useCrops } from '@/hooks/useCrops';
import { useLocationData } from '@/hooks/useLocationData';
import { useUserMarketCards, UserMarketCard } from '@/hooks/useUserMarketCards';
import { useAuth } from '@/hooks/useAuth';
import { DeliveryRequestForm } from './DeliveryRequestForm';
import { formatDistanceToNow } from 'date-fns';


interface UserMarketCardsListProps {
  showMyCards?: boolean;
}

export function UserMarketCardsList({ showMyCards = false }: UserMarketCardsListProps) {
  const { user } = useAuth();
  const { crops } = useCrops();
  const [selectedCard, setSelectedCard] = useState<UserMarketCard | null>(null);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  
  // Filters
  const [cardTypeFilter, setCardTypeFilter] = useState<string>('_all');
  const [cropFilter, setCropFilter] = useState<string>('_all');
  const [provinceFilter, setProvinceFilter] = useState<string>('_all');

  const { provinces } = useLocationData();

  const { cards, isLoading } = useUserMarketCards({
    myCardsOnly: showMyCards,
    card_type: cardTypeFilter !== '_all' ? (cardTypeFilter as 'sell' | 'buy') : undefined,
    crop_id: cropFilter !== '_all' ? parseInt(cropFilter) : undefined,
    province_id: provinceFilter !== '_all' ? parseInt(provinceFilter) : undefined,
  });

  const formatPrice = (card: UserMarketCard) => {
    if (card.price_type === 'negotiable') return 'मोलमोलाई';
    if (card.price_type === 'range' && card.price_min && card.price_max) {
      return `रु. ${card.price_min} - ${card.price_max}/${card.unit}`;
    }
    if (card.price) return `रु. ${card.price}/${card.unit}`;
    return '-';
  };

  const getLocationText = (card: UserMarketCard) => {
    const parts: string[] = [];
    if (card.local_levels?.name_ne) parts.push(card.local_levels.name_ne);
    if (card.districts?.name_ne) parts.push(card.districts.name_ne);
    if (card.provinces?.name_ne) parts.push(card.provinces.name_ne);
    return parts.join(', ') || 'स्थान उल्लेख नभएको';
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone: string, cardTitle: string) => {
    const message = encodeURIComponent(`नमस्ते! म "${cardTitle}" को बारेमा जानकारी लिन चाहन्छु।`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={cardTypeFilter} onValueChange={setCardTypeFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="प्रकार" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">सबै</SelectItem>
            <SelectItem value="sell">बेच्ने</SelectItem>
            <SelectItem value="buy">किन्ने</SelectItem>
          </SelectContent>
        </Select>

        <Select value={cropFilter} onValueChange={setCropFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="बाली" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">सबै बाली</SelectItem>
            {crops.map((crop) => (
              <SelectItem key={crop.id} value={crop.id.toString()}>
                {crop.name_ne}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={provinceFilter} onValueChange={setProvinceFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="प्रदेश" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">सबै प्रदेश</SelectItem>
            {provinces.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>
                {p.name_ne}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>कुनै कार्ड भेटिएन</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Sheet key={card.id}>
              <SheetTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden">
                  {/* Card Image */}
                  <div className="relative h-32 bg-muted">
                    {card.images && card.images.length > 0 ? (
                      <img
                        src={card.images[0]}
                        alt={card.title}
                        className="w-full h-full object-cover"
                      />
                    ) : card.crops?.image_url ? (
                      <img
                        src={card.crops.image_url}
                        alt={card.crops.name_ne}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🌱
                      </div>
                    )}
                    <Badge
                      className="absolute top-2 left-2"
                      variant={card.card_type === 'sell' ? 'default' : 'secondary'}
                    >
                      {card.card_type === 'sell' ? '🏷️ बेच्ने' : '🛒 किन्ने'}
                    </Badge>
                    {card.images && card.images.length > 1 && (
                      <Badge className="absolute top-2 right-2 bg-black/60">
                        +{card.images.length - 1}
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-3">
                    <h3 className="font-semibold line-clamp-1">{card.title}</h3>
                    {card.crops && (
                      <p className="text-sm text-muted-foreground">{card.crops.name_ne}</p>
                    )}
                    <p className="text-primary font-bold mt-1">{formatPrice(card)}</p>
                    {card.available_quantity && (
                      <p className="text-xs text-muted-foreground">
                        मात्रा: {card.available_quantity} {card.unit}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{getLocationText(card)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span className="line-clamp-1">
                        {formatDistanceToNow(new Date(card.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </SheetTrigger>

              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{card.title}</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-4 mt-4">
                  {/* Images */}
                  {card.images && card.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {card.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${card.title} ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={card.card_type === 'sell' ? 'default' : 'secondary'}>
                        {card.card_type === 'sell' ? 'बेच्ने' : 'किन्ने'}
                      </Badge>
                      {card.crops && <Badge variant="outline">{card.crops.name_ne}</Badge>}
                    </div>

                    <p className="text-2xl font-bold text-primary">{formatPrice(card)}</p>

                    {card.available_quantity && (
                      <p className="text-muted-foreground">
                        उपलब्ध मात्रा: <strong>{card.available_quantity} {card.unit}</strong>
                      </p>
                    )}

                    {card.description && (
                      <p className="text-sm text-muted-foreground">{card.description}</p>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{getLocationText(card)}</span>
                    </div>
                  </div>

                  {/* Contact Actions */}
                  {card.user_id !== user?.id && (
                    <div className="space-y-2 pt-4 border-t">
                      <p className="text-sm font-medium">सम्पर्क गर्नुहोस्:</p>
                      <div className="flex gap-2">
                        {card.contact_phone && (
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleCall(card.contact_phone!)}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            कल गर्नुहोस्
                          </Button>
                        )}
                        {card.whatsapp && (
                          <Button
                            variant="outline"
                            className="flex-1 text-green-600 border-green-600"
                            onClick={() => handleWhatsApp(card.whatsapp!, card.title)}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp
                          </Button>
                        )}
                      </div>

                      {/* Delivery Request */}
                      {card.card_type === 'sell' && (
                        <Button
                          className="w-full mt-2"
                          onClick={() => {
                            setSelectedCard(card);
                            setShowDeliveryForm(true);
                          }}
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          डेलिभरी अनुरोध पठाउनुहोस्
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Report */}
                  {card.user_id !== user?.id && (
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      रिपोर्ट गर्नुहोस्
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          ))}
        </div>
      )}

      {/* Delivery Request Form Sheet */}
      {selectedCard && (
        <Sheet open={showDeliveryForm} onOpenChange={setShowDeliveryForm}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>डेलिभरी अनुरोध</SheetTitle>
            </SheetHeader>
            <DeliveryRequestForm
              card={selectedCard}
              onSuccess={() => setShowDeliveryForm(false)}
              onCancel={() => setShowDeliveryForm(false)}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
