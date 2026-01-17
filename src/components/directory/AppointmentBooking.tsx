import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, User, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Officer {
  id: string;
  name: string;
  name_ne: string | null;
  designation_ne: string | null;
  district: string;
  phone: string | null;
}

interface AppointmentBookingProps {
  officer: Officer;
  isOpen: boolean;
  onClose: () => void;
}

const PURPOSES = [
  { value: 'crop_advice', label: 'बाली सल्लाह' },
  { value: 'disease_consultation', label: 'रोग परामर्श' },
  { value: 'soil_testing', label: 'माटो परीक्षण' },
  { value: 'pest_control', label: 'कीट नियन्त्रण' },
  { value: 'seed_selection', label: 'बीउ छनोट' },
  { value: 'irrigation', label: 'सिंचाइ सल्लाह' },
  { value: 'fertilizer', label: 'मल प्रयोग' },
  { value: 'market_linkage', label: 'बजार जोडान' },
  { value: 'other', label: 'अन्य' },
];

const TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30', '12:00',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

export function AppointmentBooking({ officer, isOpen, onClose }: AppointmentBookingProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');

  // Get farmer profile
  const { data: farmerProfile } = useQuery({
    queryKey: ['farmer-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('farmer_profiles')
        .select('id, phone')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!farmerProfile?.id) throw new Error('Farmer profile not found');
      
      const { error } = await supabase
        .from('officer_appointments')
        .insert({
          farmer_id: farmerProfile.id,
          officer_id: officer.id,
          appointment_date: date,
          appointment_time: time,
          purpose: purpose,
          notes: notes || null,
          farmer_phone: phone || farmerProfile.phone,
          status: 'pending'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer-appointments'] });
      toast.success('भेटघाट अनुरोध पठाइयो!');
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast.error('भेटघाट अनुरोध पठाउन सकिएन: ' + error.message);
    }
  });

  const resetForm = () => {
    setDate('');
    setTime('');
    setPurpose('');
    setNotes('');
    setPhone('');
  };

  const handleSubmit = () => {
    if (!date || !time || !purpose) {
      toast.error('कृपया सबै आवश्यक जानकारी भर्नुहोस्');
      return;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error('कृपया भविष्यको मिति छान्नुहोस्');
      return;
    }

    createMutation.mutate();
  };

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            भेटघाट तय गर्नुहोस्
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Officer Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{officer.name_ne || officer.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {officer.district}
                </p>
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <Label htmlFor="date">मिति छान्नुहोस् *</Label>
            <Input
              id="date"
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Time Selection */}
          <div>
            <Label htmlFor="time">समय छान्नुहोस् *</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="समय छान्नुहोस्" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {slot}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Purpose Selection */}
          <div>
            <Label htmlFor="purpose">भेटघाटको उद्देश्य *</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="उद्देश्य छान्नुहोस्" />
              </SelectTrigger>
              <SelectContent>
                {PURPOSES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">सम्पर्क नम्बर</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={farmerProfile?.phone || 'फोन नम्बर'}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">थप टिप्पणी</Label>
            <Textarea
              id="notes"
              placeholder="तपाईंको समस्याको विवरण..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>रद्द गर्नुहोस्</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'पठाउँदै...' : 'भेटघाट तय गर्नुहोस्'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Component to show farmer's appointments
export function FarmerAppointments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: farmerProfile } = useQuery({
    queryKey: ['farmer-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('farmer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['farmer-appointments', farmerProfile?.id],
    queryFn: async () => {
      if (!farmerProfile?.id) return [];
      const { data, error } = await supabase
        .from('officer_appointments')
        .select(`
          *,
          agricultural_officers (
            name,
            name_ne,
            designation_ne,
            district,
            phone
          )
        `)
        .eq('farmer_id', farmerProfile.id)
        .order('appointment_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!farmerProfile?.id
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('officer_appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer-appointments'] });
      toast.success('भेटघाट रद्द गरियो');
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><AlertCircle className="w-3 h-3 mr-1" />पेन्डिङ</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-success/10 text-success"><CheckCircle className="w-3 h-3 mr-1" />पुष्टि भयो</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive"><XCircle className="w-3 h-3 mr-1" />रद्द</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-primary/10 text-primary"><CheckCircle className="w-3 h-3 mr-1" />सम्पन्न</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!appointments?.length) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          मेरा भेटघाटहरू
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {appointments.map((apt) => (
          <div key={apt.id} className="p-3 border rounded-lg bg-card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {(apt.agricultural_officers as any)?.name_ne || (apt.agricultural_officers as any)?.name}
                  </span>
                  {getStatusBadge(apt.status)}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(apt.appointment_date), 'yyyy-MM-dd')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {apt.appointment_time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {(apt.agricultural_officers as any)?.district}
                  </span>
                </div>
                <p className="text-sm mt-1">
                  {PURPOSES.find(p => p.value === apt.purpose)?.label || apt.purpose}
                </p>
              </div>
              {apt.status === 'pending' && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-destructive"
                  onClick={() => cancelMutation.mutate(apt.id)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
