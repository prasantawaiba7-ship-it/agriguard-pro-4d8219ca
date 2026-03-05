import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User, Phone, MapPin, Loader2, Camera, Wheat, Droplets, Ruler, Sprout, Edit3, X, LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionCard } from '@/components/profile/SubscriptionCard';
import { QueryHistoryCard } from '@/components/profile/QueryHistoryCard';
import { NotificationPreferencesCard } from '@/components/profile/NotificationPreferencesCard';
import { WeatherAlertSettingsCard } from '@/components/farmer/WeatherAlertSettingsCard';
import { GeneralFeedbackForm } from '@/components/feedback/GeneralFeedbackForm';

const profileSchema = z.object({
  full_name: z.string().min(2).max(100),
  phone: z.string().max(15).optional().or(z.literal('')),
  village: z.string().max(100).optional().or(z.literal('')),
  district: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  main_crops: z.string().optional().or(z.literal('')),
  land_size_hectares: z.string().optional().or(z.literal('')),
  irrigation_type: z.string().optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const nepalProvinces = [
  'Province 1 (Koshi)', 'Province 2 (Madhesh)', 'Province 3 (Bagmati)',
  'Province 4 (Gandaki)', 'Province 5 (Lumbini)', 'Province 6 (Karnali)', 'Province 7 (Sudurpashchim)',
];

const irrigationTypes = [
  { value: 'rainfed', label: 'Rainfed / वर्षामा निर्भर' },
  { value: 'canal', label: 'Canal / नहर' },
  { value: 'borewell', label: 'Borewell / नलकुपा' },
  { value: 'river', label: 'River / नदी' },
  { value: 'pond', label: 'Pond / पोखरी' },
  { value: 'drip', label: 'Drip Irrigation / थोपा सिँचाइ' },
  { value: 'sprinkler', label: 'Sprinkler / स्प्रिंकलर' },
];

const commonCrops = [
  'Rice / धान', 'Wheat / गहुँ', 'Maize / मकै', 'Potato / आलु',
  'Tomato / गोलभेडा', 'Vegetables / तरकारी', 'Sugarcane / उखु', 'Mustard / तोरी',
];

export function EmbeddedProfileTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [farmingDetails, setFarmingDetails] = useState({
    main_crops: [] as string[],
    land_size_hectares: null as number | null,
    irrigation_type: null as string | null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile, isLoading: authLoading, signOut, updateProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: '', phone: '', village: '', district: '', state: '', main_crops: '', land_size_hectares: '', irrigation_type: '' },
  });

  useEffect(() => {
    const fetchFarmingDetails = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('farmer_profiles')
        .select('main_crops, land_size_hectares, irrigation_type')
        .eq('id', profile.id)
        .single();
      if (data) {
        setFarmingDetails({
          main_crops: (data.main_crops as string[]) || [],
          land_size_hectares: data.land_size_hectares,
          irrigation_type: data.irrigation_type,
        });
        form.reset({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          village: profile.village || '',
          district: profile.district || '',
          state: profile.state || '',
          main_crops: ((data.main_crops as string[]) || []).join(', '),
          land_size_hectares: data.land_size_hectares?.toString() || '',
          irrigation_type: data.irrigation_type || '',
        });
      }
    };
    if (profile) {
      form.reset({
        full_name: profile.full_name || '', phone: profile.phone || '',
        village: profile.village || '', district: profile.district || '', state: profile.state || '',
      });
      setAvatarUrl(profile.avatar_url);
      fetchFarmingDetails();
    }
  }, [profile, form]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Invalid file', variant: 'destructive' }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ title: 'File too large', variant: 'destructive' }); return; }
    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await updateProfile({ avatar_url: publicUrl });
      setAvatarUrl(publicUrl);
      toast({ title: 'Photo updated' });
    } catch (error) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    const mainCropsArray = data.main_crops ? data.main_crops.split(',').map(c => c.trim()).filter(Boolean) : [];
    const landSize = data.land_size_hectares ? parseFloat(data.land_size_hectares) : null;
    const { error } = await supabase
      .from('farmer_profiles')
      .update({
        full_name: data.full_name, phone: data.phone || null, village: data.village || null,
        district: data.district || null, state: data.state || null,
        main_crops: mainCropsArray, land_size_hectares: landSize, irrigation_type: data.irrigation_type || null,
      })
      .eq('user_id', user?.id);
    setIsLoading(false);
    if (!error) {
      setIsEditing(false);
      setFarmingDetails({ main_crops: mainCropsArray, land_size_hectares: landSize, irrigation_type: data.irrigation_type || null });
      toast({ title: 'Profile updated' });
    } else {
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) return null;

  const getIrrigationLabel = (value: string | null) => irrigationTypes.find(t => t.value === value)?.label || value || 'Not set';

  return (
    <div className="px-3 pt-4 pb-4 max-w-5xl mx-auto">
      {/* Profile Header */}
      <Card className="border-border/50 shadow-lg overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full bg-background/80 backdrop-blur flex items-center justify-center overflow-hidden cursor-pointer group ring-4 ring-background shadow-xl"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  {isUploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{profile?.full_name || 'Farmer'}</h1>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              {(profile?.village || profile?.district) && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{[profile?.village, profile?.district].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {!isEditing ? (
              <Button size="sm" onClick={() => setIsEditing(true)} className="gap-1.5 rounded-full">
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="gap-1.5 rounded-full">
                <X className="w-3.5 h-3.5" /> Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>

      {isEditing ? (
        <Card className="border-border/50 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><User className="w-5 h-5 text-primary" /> Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="full_name" render={({ field }) => (
                    <FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input placeholder="Your name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" placeholder="98XXXXXXXX" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="village" render={({ field }) => (
                    <FormItem><FormLabel>Village / गाउँ</FormLabel><FormControl><Input placeholder="Your village" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="district" render={({ field }) => (
                    <FormItem><FormLabel>District / जिल्ला</FormLabel><FormControl><Input placeholder="Your district" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Province / प्रदेश</FormLabel>
                      <FormControl>
                        <select className="w-full h-10 px-3 rounded-md border border-input bg-background" {...field}>
                          <option value="">Select Province</option>
                          {nepalProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="main_crops" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Crops / मुख्य बाली</FormLabel>
                    <FormControl><Input placeholder="e.g., Rice, Wheat" {...field} /></FormControl>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {commonCrops.map(crop => (
                        <Badge key={crop} variant="outline" className="cursor-pointer text-xs hover:bg-primary/10"
                          onClick={() => {
                            const current = field.value || '';
                            const crops = current.split(',').map(c => c.trim()).filter(Boolean);
                            if (!crops.includes(crop)) field.onChange([...crops, crop].join(', '));
                          }}>{crop}</Badge>
                      ))}
                    </div>
                  </FormItem>
                )} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="land_size_hectares" render={({ field }) => (
                    <FormItem><FormLabel>Land Size (Hectares)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 2.5" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="irrigation_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Irrigation Type</FormLabel>
                      <FormControl>
                        <select className="w-full h-10 px-3 rounded-md border border-input bg-background" {...field}>
                          <option value="">Select type</option>
                          {irrigationTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 mb-6">
          {/* Info cards */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div><p className="text-[10px] text-muted-foreground">Phone</p><p className="text-sm font-medium">{profile?.phone || 'Not set'}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div><p className="text-[10px] text-muted-foreground">Location</p><p className="text-sm font-medium">{[profile?.village, profile?.district].filter(Boolean).join(', ') || 'Not set'}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <Wheat className="w-4 h-4 text-muted-foreground" />
                  <div><p className="text-[10px] text-muted-foreground">Crops</p><p className="text-sm font-medium">{farmingDetails.main_crops.length > 0 ? farmingDetails.main_crops.join(', ') : 'Not set'}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <div><p className="text-[10px] text-muted-foreground">Land</p><p className="text-sm font-medium">{farmingDetails.land_size_hectares ? `${farmingDetails.land_size_hectares} ha` : 'Not set'}</p></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings cards */}
      <div className="space-y-4">
        <SubscriptionCard />
        <NotificationPreferencesCard />
        <WeatherAlertSettingsCard />
        <QueryHistoryCard />
        <GeneralFeedbackForm />
      </div>

      {/* Logout Button */}
      <div className="mt-6 mb-4">
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl h-12"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="w-4 h-4" />
          🚪 Logout
        </Button>
      </div>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>के तपाईं निस्कन चाहनुहुन्छ?</AlertDialogTitle>
            <AlertDialogDescription>तपाईं आफ्नो खाताबाट लगआउट हुनुहुनेछ।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
