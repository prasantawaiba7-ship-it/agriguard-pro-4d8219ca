import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, Mail, MapPin, Clock, Search, Filter, User, 
  Building2, ChevronDown, CheckCircle, X, PhoneCall,
  MessageCircle, Briefcase, Navigation, Calendar, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { AppointmentBooking, FarmerAppointments } from './AppointmentBooking';
import { toast } from 'sonner';

interface AgriculturalOfficer {
  id: string;
  name: string;
  name_ne: string | null;
  designation: string;
  designation_ne: string | null;
  phone: string | null;
  alternate_phone: string | null;
  email: string | null;
  district: string;
  province: string;
  municipality: string | null;
  office_name: string | null;
  office_name_ne: string | null;
  office_address_ne: string | null;
  specializations: string[] | null;
  working_hours: string | null;
  is_available: boolean | null;
  profile_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

// Nepal provinces
const PROVINCES = [
  { value: 'all', label: 'सबै प्रदेश' },
  { value: 'Koshi', label: 'कोशी प्रदेश' },
  { value: 'Madhesh', label: 'मधेश प्रदेश' },
  { value: 'Bagmati', label: 'बागमती प्रदेश' },
  { value: 'Gandaki', label: 'गण्डकी प्रदेश' },
  { value: 'Lumbini', label: 'लुम्बिनी प्रदेश' },
  { value: 'Karnali', label: 'कर्णाली प्रदेश' },
  { value: 'Sudurpashchim', label: 'सुदूरपश्चिम प्रदेश' },
];

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function AgriculturalOfficerDirectory() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedOfficer, setSelectedOfficer] = useState<AgriculturalOfficer | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [bookingOfficer, setBookingOfficer] = useState<AgriculturalOfficer | null>(null);

  // Fetch officers from database
  const { data: officers, isLoading } = useQuery({
    queryKey: ['agricultural-officers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agricultural_officers')
        .select('*')
        .eq('is_active', true)
        .order('district');
      
      if (error) throw error;
      return data as AgriculturalOfficer[];
    }
  });

  // Get user's location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('तपाईंको ब्राउजरले स्थान सेवा समर्थन गर्दैन');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setSortByDistance(true);
        setIsLocating(false);
        toast.success('स्थान प्राप्त भयो! नजिकका अधिकारीहरू देखाइँदै');
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('स्थान अनुमति अस्वीकार गरियो');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('स्थान जानकारी उपलब्ध छैन');
            break;
          case error.TIMEOUT:
            toast.error('स्थान अनुरोध समय सकियो');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Filter and sort officers
  const filteredOfficers = useMemo(() => {
    if (!officers) return [];
    
    let filtered = officers.filter(officer => {
      const matchesSearch = 
        searchTerm === '' ||
        officer.name_ne?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        officer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        officer.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
        officer.municipality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        officer.specializations?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesProvince = 
        selectedProvince === 'all' || 
        officer.province === selectedProvince;
      
      return matchesSearch && matchesProvince;
    });

    // Sort by distance if user location is available
    if (sortByDistance && userLocation) {
      filtered = filtered.map(officer => ({
        ...officer,
        distance: officer.latitude && officer.longitude
          ? calculateDistance(userLocation.lat, userLocation.lng, officer.latitude, officer.longitude)
          : Infinity
      })).sort((a, b) => (a as any).distance - (b as any).distance);
    }

    return filtered;
  }, [officers, searchTerm, selectedProvince, userLocation, sortByDistance]);

  // Get unique districts for the selected province
  const availableDistricts = useMemo(() => {
    if (!officers) return [];
    const districts = new Set(
      officers
        .filter(o => selectedProvince === 'all' || o.province === selectedProvince)
        .map(o => o.district)
    );
    return Array.from(districts).sort();
  }, [officers, selectedProvince]);

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const getDistanceText = (officer: AgriculturalOfficer) => {
    if (!userLocation || !officer.latitude || !officer.longitude) return null;
    const distance = calculateDistance(userLocation.lat, userLocation.lng, officer.latitude, officer.longitude);
    if (distance < 1) {
      return `${Math.round(distance * 1000)} मीटर`;
    }
    return `${distance.toFixed(1)} कि.मी.`;
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-primary/10">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Building2 className="w-6 h-6 text-primary" />
          👨‍🌾 कृषि प्राविधिक सम्पर्क निर्देशिका
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          आफ्नो नजिकको कृषि प्राविधिकसँग सम्पर्क गर्नुहोस्
        </p>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Farmer's Appointments */}
        {user && <FarmerAppointments />}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="नाम, जिल्ला वा विशेषज्ञता खोज्नुहोस्..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="प्रदेश छान्नुहोस्" />
            </SelectTrigger>
            <SelectContent>
              {PROVINCES.map((province) => (
                <SelectItem key={province.value} value={province.value}>
                  {province.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Button */}
        <div className="flex items-center gap-3">
          <Button
            variant={sortByDistance ? "default" : "outline"}
            size="sm"
            onClick={getUserLocation}
            disabled={isLocating}
            className="gap-2"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            {sortByDistance ? 'नजिककै देखाउँदै' : 'नजिकको खोज्नुहोस्'}
          </Button>
          {sortByDistance && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSortByDistance(false);
                setUserLocation(null);
              }}
            >
              <X className="w-4 h-4 mr-1" />
              रिसेट
            </Button>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {filteredOfficers.length} कृषि प्राविधिक भेटियो
          </span>
          {availableDistricts.length > 0 && (
            <span className="text-muted-foreground">
              {availableDistricts.length} जिल्लामा
            </span>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl border bg-card">
                <div className="flex gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Officers List */}
        {!isLoading && (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredOfficers.map((officer, index) => (
                <motion.div
                  key={officer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer
                    ${selectedOfficer?.id === officer.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedOfficer(
                    selectedOfficer?.id === officer.id ? null : officer
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        {officer.profile_image_url ? (
                          <img 
                            src={officer.profile_image_url} 
                            alt={officer.name_ne || officer.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      {officer.is_available && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-base">
                            {officer.name_ne || officer.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {officer.designation_ne || officer.designation}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {officer.is_available && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20 flex-shrink-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              उपलब्ध
                            </Badge>
                          )}
                          {getDistanceText(officer) && (
                            <Badge variant="secondary" className="text-xs">
                              <Navigation className="w-3 h-3 mr-1" />
                              {getDistanceText(officer)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {officer.district}, {officer.municipality || officer.province}
                        </span>
                        {officer.working_hours && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {officer.working_hours}
                          </span>
                        )}
                      </div>

                      {/* Specializations */}
                      {officer.specializations && officer.specializations.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {officer.specializations.slice(0, 3).map((spec, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {officer.specializations.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{officer.specializations.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                      selectedOfficer?.id === officer.id ? 'rotate-180' : ''
                    }`} />
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {selectedOfficer?.id === officer.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t space-y-4">
                          {/* Office Info */}
                          {(officer.office_name_ne || officer.office_address_ne) && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-sm font-medium flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" />
                                {officer.office_name_ne || officer.office_name}
                              </p>
                              {officer.office_address_ne && (
                                <p className="text-sm text-muted-foreground mt-1 ml-6">
                                  📍 {officer.office_address_ne}
                                </p>
                              )}
                            </div>
                          )}

                          {/* All Specializations */}
                          {officer.specializations && officer.specializations.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                विशेषज्ञता क्षेत्रहरू:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {officer.specializations.map((spec, i) => (
                                  <Badge key={i} variant="secondary">
                                    {spec}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Contact Buttons */}
                          <div className="flex flex-wrap gap-2">
                            {officer.phone && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCall(officer.phone!);
                                  }}
                                  className="gap-2"
                                >
                                  <PhoneCall className="w-4 h-4" />
                                  फोन गर्नुहोस्
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWhatsApp(officer.phone!);
                                  }}
                                  className="gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border-[#25D366]/30"
                                >
                                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                                  WhatsApp
                                </Button>
                              </>
                            )}
                            {officer.email && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEmail(officer.email!);
                                }}
                                className="gap-2"
                              >
                                <Mail className="w-4 h-4" />
                                इमेल
                              </Button>
                            )}
                            {user && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBookingOfficer(officer);
                                }}
                                className="gap-2 bg-primary/10 hover:bg-primary/20"
                              >
                                <Calendar className="w-4 h-4 text-primary" />
                                भेटघाट तय गर्नुहोस्
                              </Button>
                            )}
                          </div>

                          {/* Contact Info */}
                          <div className="text-sm text-muted-foreground space-y-1">
                            {officer.phone && (
                              <p className="flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                {officer.phone}
                              </p>
                            )}
                            {officer.alternate_phone && (
                              <p className="flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                {officer.alternate_phone} (वैकल्पिक)
                              </p>
                            )}
                            {officer.email && (
                              <p className="flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                {officer.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty State */}
            {filteredOfficers.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">कुनै कृषि प्राविधिक भेटिएन</p>
                <p className="text-sm mt-1">खोज वा फिल्टर परिवर्तन गर्नुहोस्</p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="w-4 h-4 mr-1" />
                    खोज हटाउनुहोस्
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Appointment Booking Dialog */}
      {bookingOfficer && (
        <AppointmentBooking
          officer={bookingOfficer}
          isOpen={!!bookingOfficer}
          onClose={() => setBookingOfficer(null)}
        />
      )}
    </Card>
  );
}
