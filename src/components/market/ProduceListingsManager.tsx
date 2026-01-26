import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useProduceListings, ProduceListing, CreateListingInput } from '@/hooks/useProduceListings';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Phone, MapPin, Trash2, Edit, Package } from 'lucide-react';
import { format } from 'date-fns';

const UNITS = ['kg', 'quintal', 'ton', 'piece', 'bundle'];

export function ProduceListingsManager() {
  const { user, profile } = useAuth();
  const { listings, myListings, isLoading, createListing, updateListing, deleteListing } = useProduceListings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateListingInput>({
    crop_name: '',
    variety: '',
    quantity: 0,
    unit: 'kg',
    expected_price: undefined,
    district: profile?.district || '',
    contact_phone: profile?.phone || '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.crop_name || formData.quantity <= 0) return;

    const result = await createListing(formData);
    if (result) {
      setIsDialogOpen(false);
      setFormData({
        crop_name: '',
        variety: '',
        quantity: 0,
        unit: 'kg',
        expected_price: undefined,
        district: profile?.district || '',
        contact_phone: profile?.phone || '',
        notes: '',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('के तपाईं यो listing हटाउन चाहनुहुन्छ?')) {
      await deleteListing(id);
    }
  };

  const handleToggleActive = async (listing: ProduceListing) => {
    await updateListing(listing.id, { is_active: !listing.is_active });
  };

  const ListingCard = ({ listing, showActions = false }: { listing: ProduceListing; showActions?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{listing.crop_name}</h3>
            {listing.variety && (
              <span className="text-sm text-muted-foreground">{listing.variety}</span>
            )}
          </div>
          {showActions && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={listing.is_active ? 'outline' : 'secondary'}
                onClick={() => handleToggleActive(listing)}
              >
                {listing.is_active ? 'Active' : 'Inactive'}
              </Button>
              <Button size="icon" variant="destructive" onClick={() => handleDelete(listing.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {listing.quantity} {listing.unit}
            </span>
            {listing.expected_price && (
              <Badge variant="secondary">रु. {listing.expected_price}/{listing.unit}</Badge>
            )}
          </div>

          {listing.district && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{listing.municipality ? `${listing.municipality}, ` : ''}{listing.district}</span>
            </div>
          )}

          {listing.contact_phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-primary" />
              <a href={`tel:${listing.contact_phone}`} className="text-primary hover:underline">
                {listing.contact_phone}
              </a>
            </div>
          )}

          {listing.notes && (
            <p className="text-sm text-muted-foreground mt-2">{listing.notes}</p>
          )}

          <p className="text-xs text-muted-foreground">
            {format(new Date(listing.created_at), 'yyyy-MM-dd')}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">सबै ({listings.length})</TabsTrigger>
            <TabsTrigger value="my">मेरो ({myListings.length})</TabsTrigger>
          </TabsList>

          {user && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  नयाँ Listing
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>उब्जनी बेच्ने List गर्नुहोस्</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="crop_name">बाली नाम *</Label>
                      <Input
                        id="crop_name"
                        value={formData.crop_name}
                        onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                        placeholder="जस्तै: धान, गहुँ"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="variety">जात</Label>
                      <Input
                        id="variety"
                        value={formData.variety || ''}
                        onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                        placeholder="जात नाम"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">परिमाण *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.quantity || ''}
                        onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">एकाइ</Label>
                      <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expected_price">अपेक्षित मूल्य (रु./{formData.unit})</Label>
                    <Input
                      id="expected_price"
                      type="number"
                      min="0"
                      value={formData.expected_price || ''}
                      onChange={(e) => setFormData({ ...formData, expected_price: parseFloat(e.target.value) || undefined })}
                      placeholder="वैकल्पिक"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="district">जिल्ला</Label>
                      <Input
                        id="district"
                        value={formData.district || ''}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">सम्पर्क नम्बर</Label>
                      <Input
                        id="contact_phone"
                        value={formData.contact_phone || ''}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">थप जानकारी</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="गुणस्तर, डेलिभरी सम्बन्धी जानकारी..."
                      rows={2}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    List गर्नुहोस्
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="all">
          {listings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                कुनै listing छैन। पहिलो listing थप्नुहोस्!
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my">
          {!user ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                कृपया पहिला login गर्नुहोस्।
              </CardContent>
            </Card>
          ) : myListings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                तपाईंको कुनै listing छैन।
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} showActions />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
