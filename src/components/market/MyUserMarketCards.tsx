import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, MapPin, Clock, Eye, EyeOff, Tag } from 'lucide-react';
import { useUserMarketCards, UserMarketCard } from '@/hooks/useUserMarketCards';
import { UserMarketCardForm } from './UserMarketCardForm';
import { formatDistanceToNow } from 'date-fns';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function MyUserMarketCards() {
  const { cards, isLoading, deleteCard, toggleCardActive } = useUserMarketCards({ myCardsOnly: true });
  const [editingCard, setEditingCard] = useState<UserMarketCard | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    return parts.join(', ') || 'स्थान उल्लेख नभएको';
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteCard.mutateAsync(deletingId);
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>तपाईंले अहिलेसम्म कुनै कार्ड थप्नुभएको छैन</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {cards.map((card) => (
          <Card key={card.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                {/* Image */}
                <div className="w-24 h-24 flex-shrink-0 bg-muted">
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
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      🌱
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium line-clamp-1">{card.title}</h4>
                      <p className="text-sm text-primary font-semibold">{formatPrice(card)}</p>
                    </div>
                    <Badge variant={card.card_type === 'sell' ? 'default' : 'secondary'} className="text-xs">
                      {card.card_type === 'sell' ? 'बेच्ने' : 'किन्ने'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{getLocationText(card)}</span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={card.is_active}
                        onCheckedChange={(checked) =>
                          toggleCardActive.mutate({ id: card.id, is_active: checked })
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {card.is_active ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <Eye className="h-3 w-3" /> सक्रिय
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <EyeOff className="h-3 w-3" /> निष्क्रिय
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingCard(card)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeletingId(card.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Sheet */}
      <Sheet open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>कार्ड सम्पादन</SheetTitle>
          </SheetHeader>
          {editingCard && (
            <UserMarketCardForm
              editingCard={editingCard}
              onSuccess={() => setEditingCard(null)}
              onCancel={() => setEditingCard(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>कार्ड हटाउने?</AlertDialogTitle>
            <AlertDialogDescription>
              यो कार्यलाई पूर्ववत गर्न सकिँदैन। के तपाईं निश्चित हुनुहुन्छ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>रद्द गर्नुहोस्</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              हटाउनुहोस्
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
