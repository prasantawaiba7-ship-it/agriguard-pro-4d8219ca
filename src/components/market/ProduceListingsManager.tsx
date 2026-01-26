import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useProduceListings, ProduceListing, CreateListingInput } from '@/hooks/useProduceListings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, Phone, MapPin, Trash2, Edit, Package, Search, 
  Clock, AlertTriangle, ChevronRight, X, User, MessageCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const UNITS = ['kg', 'quintal', 'ton', 'piece', 'bundle', 'खद्रो', 'रोपनी'];
const CROP_FILTERS = ['सबै', 'धान', 'मकै', 'गहुँ', 'आलु', 'गोलभेंडा', 'अन्य'];
const DISTRICTS = ['सबै', 'Kathmandu', 'Kavre', 'Lalitpur', 'Bhaktapur', 'Chitwan', 'Morang', 'Jhapa'];

export function ProduceListingsManager() {
  const { user, profile } = useAuth();
  const { listings, myListings, isLoading, createListing, updateListing, deleteListing, refresh } = useProduceListings();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ProduceListing | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<ProduceListing | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [cropFilter, setCropFilter] = useState('सबै');
  const [districtFilter, setDistrictFilter] = useState('सबै');

  const [formData, setFormData] = useState<CreateListingInput>({
    crop_name: '',
    variety: '',
    quantity: 0,
    unit: 'kg',
    expected_price: undefined,
    district: profile?.district || '',
    municipality: '',
    contact_phone: profile?.phone || '',
    notes: '',
  });

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      const matchesSearch = searchQuery === '' || 
        listing.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (listing.variety && listing.variety.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (listing.district && listing.district.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCrop = cropFilter === 'सबै' || listing.crop_name.includes(cropFilter);
      const matchesDistrict = districtFilter === 'सबै' || listing.district === districtFilter;
      
      return matchesSearch && matchesCrop && matchesDistrict;
    });
  }, [listings, searchQuery, cropFilter, districtFilter]);

  const resetForm = () => {
    setFormData({
      crop_name: '',
      variety: '',
      quantity: 0,
      unit: 'kg',
      expected_price: undefined,
      district: profile?.district || '',
      municipality: '',
      contact_phone: profile?.phone || '',
      notes: '',
    });
    setEditingListing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.crop_name || formData.quantity <= 0) return;

    if (editingListing) {
      await updateListing(editingListing.id, formData);
    } else {
      await createListing(formData);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (listing: ProduceListing) => {
    setEditingListing(listing);
    setFormData({
      crop_name: listing.crop_name,
      variety: listing.variety || '',
      quantity: listing.quantity,
      unit: listing.unit,
      expected_price: listing.expected_price || undefined,
      district: listing.district || '',
      municipality: listing.municipality || '',
      contact_phone: listing.contact_phone || '',
      notes: listing.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('के तपाईं यो listing हटाउन चाहनुहुन्छ?')) {
      await deleteListing(id);
      setIsDetailOpen(false);
    }
  };

  const handleToggleActive = async (listing: ProduceListing) => {
    await updateListing(listing.id, { is_active: !listing.is_active });
  };

  const openDetail = async (listing: ProduceListing) => {
    setSelectedListing(listing);
    setIsDetailOpen(true);
    
    // Track view (don't track own listings)
    if (!isOwner(listing)) {
      try {
        await supabase.from('listing_views').insert({
          listing_id: listing.id,
          viewer_id: user?.id || null,
          session_id: sessionStorage.getItem('session_id') || crypto.randomUUID(),
        });
      } catch (e) {
        console.log('Failed to track view');
      }
    }
  };

  const trackContact = async (listingId: string, contactType: string = 'call') => {
    try {
      await supabase.from('listing_contacts').insert({
        listing_id: listingId,
        contactor_id: user?.id || null,
        contact_type: contactType,
      });
    } catch (e) {
      console.log('Failed to track contact');
    }
  };

  const isOwner = (listing: ProduceListing) => user && listing.user_id === user.id;

  const formatPostedTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  // Listing Card Component
  const ListingCard = ({ listing }: { listing: ProduceListing }) => (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/30"
      onClick={() => openDetail(listing)}
    >
      <CardContent className="p-4">
        {/* Top row - crop name and badges */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-lg text-foreground">{listing.crop_name}</h3>
            {listing.variety && (
              <span className="text-sm text-muted-foreground">{listing.variety}</span>
            )}
          </div>
          {isOwner(listing) && (
            <Badge variant={listing.is_active ? 'default' : 'secondary'} className="text-xs">
              {listing.is_active ? 'सक्रिय' : 'निष्क्रिय'}
            </Badge>
          )}
        </div>

        {/* Image placeholder */}
        <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center mb-3">
          <Package className="h-12 w-12 text-muted-foreground/50" />
        </div>

        {/* Details */}
        <div className="space-y-2">
          {/* Quantity and Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">
                {listing.quantity} {listing.unit}
              </span>
            </div>
            {listing.expected_price && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                रु. {listing.expected_price.toLocaleString()}/{listing.unit}
              </Badge>
            )}
          </div>

          {/* Location */}
          {(listing.district || listing.municipality) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                स्थान: {listing.municipality ? `${listing.municipality}, ` : ''}{listing.district}
              </span>
            </div>
          )}

          {/* Posted time */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatPostedTime(listing.created_at)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
          {listing.contact_phone && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => {
                trackContact(listing.id, 'call');
                window.location.href = `tel:${listing.contact_phone}`;
              }}
            >
              <Phone className="h-4 w-4 mr-1" />
              फोन गर्नुस्
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => openDetail(listing)}
          >
            थप विवरण
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Owner controls */}
        {isOwner(listing) && (
          <div className="flex gap-2 mt-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
            <Button 
              size="sm" 
              variant="ghost" 
              className="flex-1 text-xs"
              onClick={() => handleEdit(listing)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="flex-1 text-xs"
              onClick={() => handleToggleActive(listing)}
            >
              {listing.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="कुन बाली खोज्नुहुन्छ?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {/* Crop filter */}
          <Select value={cropFilter} onValueChange={setCropFilter}>
            <SelectTrigger className="w-auto h-9 text-sm">
              <SelectValue placeholder="बाली" />
            </SelectTrigger>
            <SelectContent>
              {CROP_FILTERS.map((crop) => (
                <SelectItem key={crop} value={crop}>{crop}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* District filter */}
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger className="w-auto h-9 text-sm">
              <SelectValue placeholder="जिल्ला" />
            </SelectTrigger>
            <SelectContent>
              {DISTRICTS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {(cropFilter !== 'सबै' || districtFilter !== 'सबै' || searchQuery) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setCropFilter('सबै');
                setDistrictFilter('सबै');
                setSearchQuery('');
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results count and Add button */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {filteredListings.length} उत्पादन देखाइएको छ
        </p>
        
        {user && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                नयाँ उत्पादन राख्ने
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingListing ? 'Listing सम्पादन गर्नुहोस्' : 'उब्जनी बेच्ने List गर्नुहोस्'}
                </DialogTitle>
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
                    <Label htmlFor="municipality">नगरपालिका/गाउँपालिका</Label>
                    <Input
                      id="municipality"
                      value={formData.municipality || ''}
                      onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">सम्पर्क नम्बर</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone || ''}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">थप जानकारी</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="गुणस्तर, डेलिभरी सम्बन्धी जानकारी..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  {editingListing ? 'अपडेट गर्नुहोस्' : 'List गर्नुहोस्'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">कुनै उत्पादन भेटिएन</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || cropFilter !== 'सबै' || districtFilter !== 'सबै'
                ? 'फिल्टर परिवर्तन गरेर हेर्नुहोस्'
                : 'पहिलो उत्पादन थप्नुहोस्!'}
            </p>
            {user && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                नयाँ उत्पादन राख्ने
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedListing && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle className="text-2xl">{selectedListing.crop_name}</SheetTitle>
                {selectedListing.variety && (
                  <p className="text-muted-foreground">{selectedListing.variety}</p>
                )}
              </SheetHeader>

              {/* Image carousel placeholder */}
              <div className="w-full h-48 rounded-xl bg-muted flex items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground/30" />
              </div>

              {/* Main info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">मात्रा</p>
                    <p className="text-xl font-bold">{selectedListing.quantity} {selectedListing.unit}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-success/10">
                    <p className="text-sm text-muted-foreground mb-1">मूल्य</p>
                    <p className="text-xl font-bold text-success">
                      {selectedListing.expected_price 
                        ? `रु. ${selectedListing.expected_price.toLocaleString()}/${selectedListing.unit}`
                        : 'सम्पर्क गर्नुहोस्'}
                    </p>
                    {selectedListing.expected_price && (
                      <p className="text-xs text-muted-foreground">
                        कुल लगभग रु. {(selectedListing.expected_price * selectedListing.quantity).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Location */}
                {(selectedListing.district || selectedListing.municipality) && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">स्थान</p>
                      <p className="font-medium">
                        {selectedListing.municipality ? `${selectedListing.municipality}, ` : ''}
                        {selectedListing.district}
                      </p>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedListing.notes && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">विवरण</h4>
                    <p className="text-muted-foreground">{selectedListing.notes}</p>
                  </div>
                )}

                {/* Seller info */}
                <div className="p-4 rounded-lg border space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    विक्रेता जानकारी
                  </h4>
                  {selectedListing.contact_phone && (
                    <p className="text-lg font-medium">{selectedListing.contact_phone}</p>
                  )}
                  <div className="flex gap-2">
                    {selectedListing.contact_phone && (
                      <Button 
                        className="flex-1"
                        onClick={() => {
                          trackContact(selectedListing.id, 'call');
                          window.location.href = `tel:${selectedListing.contact_phone}`;
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        फोन गर्नुस्
                      </Button>
                    )}
                  </div>
                </div>

                {/* Safety note */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    कृपया deal गर्दा सावधानी अपनाउनुहोस्। रकम transfer गर्नु अघि सामान verify गर्नुस्।
                  </p>
                </div>

                {/* Owner controls */}
                {isOwner(selectedListing) && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-semibold">तपाईंको Listing</h4>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          handleEdit(selectedListing);
                          setIsDetailOpen(false);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit listing
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleToggleActive(selectedListing)}
                      >
                        {selectedListing.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleDelete(selectedListing.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete listing
                    </Button>
                  </div>
                )}

                {/* Posted time */}
                <p className="text-xs text-center text-muted-foreground">
                  Posted {formatPostedTime(selectedListing.created_at)}
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
