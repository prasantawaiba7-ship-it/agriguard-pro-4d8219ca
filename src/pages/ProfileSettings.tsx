import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ArrowLeft, User, Phone, MapPin, Building, Flag, Loader2, Save, Camera, 
  Wheat, Droplets, Ruler, Sprout, Edit3, X, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageSelector } from '@/components/farmer/LanguageSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionCard } from '@/components/profile/SubscriptionCard';
import { QueryHistoryCard } from '@/components/profile/QueryHistoryCard';
import { NotificationPreferencesCard } from '@/components/profile/NotificationPreferencesCard';
import { WeatherAlertSettingsCard } from '@/components/farmer/WeatherAlertSettingsCard';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().max(15, 'Phone number is too long').optional().or(z.literal('')),
  village: z.string().max(100).optional().or(z.literal('')),
  district: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  main_crops: z.string().optional().or(z.literal('')),
  land_size_hectares: z.string().optional().or(z.literal('')),
  irrigation_type: z.string().optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const nepalProvinces = [
  'Province 1 (Koshi)',
  'Province 2 (Madhesh)',
  'Province 3 (Bagmati)',
  'Province 4 (Gandaki)',
  'Province 5 (Lumbini)',
  'Province 6 (Karnali)',
  'Province 7 (Sudurpashchim)',
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
  'Rice / धान',
  'Wheat / गहुँ',
  'Maize / मकै',
  'Potato / आलु',
  'Tomato / गोलभेडा',
  'Vegetables / तरकारी',
  'Sugarcane / उखु',
  'Mustard / तोरी',
];

const ProfileSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [farmingDetails, setFarmingDetails] = useState({
    main_crops: [] as string[],
    land_size_hectares: null as number | null,
    irrigation_type: null as string | null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile, isLoading: authLoading, updateProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      village: '',
      district: '',
      state: '',
      main_crops: '',
      land_size_hectares: '',
      irrigation_type: '',
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        village: profile.village || '',
        district: profile.district || '',
        state: profile.state || '',
      });
      setAvatarUrl(profile.avatar_url);
      fetchFarmingDetails();
    }
  }, [profile, form]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 2MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await updateProfile({ avatar_url: publicUrl });
      setAvatarUrl(publicUrl);

      toast({
        title: 'Photo updated',
        description: 'Your profile photo has been updated successfully.',
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    
    const mainCropsArray = data.main_crops 
      ? data.main_crops.split(',').map(c => c.trim()).filter(Boolean)
      : [];
    
    const landSize = data.land_size_hectares 
      ? parseFloat(data.land_size_hectares)
      : null;

    // Update farmer_profiles with new fields
    const { error } = await supabase
      .from('farmer_profiles')
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        village: data.village || null,
        district: data.district || null,
        state: data.state || null,
        main_crops: mainCropsArray,
        land_size_hectares: landSize,
        irrigation_type: data.irrigation_type || null,
      })
      .eq('user_id', user?.id);

    setIsLoading(false);

    if (!error) {
      setIsEditing(false);
      setFarmingDetails({
        main_crops: mainCropsArray,
        land_size_hectares: landSize,
        irrigation_type: data.irrigation_type || null,
      });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
    } else {
      toast({
        title: 'Update failed',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const getIrrigationLabel = (value: string | null) => {
    return irrigationTypes.find(t => t.value === value)?.label || value || 'Not set';
  };

  return (
    <>
      <Helmet>
        <title>Profile Settings - CROPIC</title>
        <meta name="description" content="Update your farmer profile settings on CROPIC." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-3 sm:p-4 md:p-6 pt-20 pb-24">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/farmer')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <LanguageSelector />
          </motion.div>

          {/* Profile Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-border/50 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div 
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-background/80 backdrop-blur flex items-center justify-center overflow-hidden cursor-pointer group ring-4 ring-background shadow-xl"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        {isUploadingAvatar ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <Camera className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Name & Basic Info */}
                  <div className="text-center sm:text-left flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {profile?.full_name || 'Farmer'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      {user?.email}
                    </p>
                    {(profile?.village || profile?.district) && (
                      <div className="flex items-center gap-1 mt-2 justify-center sm:justify-start text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{[profile?.village, profile?.district].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Edit Button */}
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)} className="gap-2">
                        <Edit3 className="w-4 h-4" />
                        Edit Profile
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Personal & Farming Details */}
            <div className="lg:col-span-2 space-y-6">
              {isEditing ? (
                /* Edit Form */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Edit Profile
                      </CardTitle>
                      <CardDescription>Update your personal and farming information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                          {/* Personal Info Section */}
                          <div className="space-y-4">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Personal Information</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Full Name *</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Your name" className="pl-10" {...field} />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type="tel" placeholder="98XXXXXXXX" className="pl-10" {...field} />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name="village"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Village / गाउँ</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Your village" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="district"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>District / जिल्ला</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Your district" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Province</FormLabel>
                                    <FormControl>
                                      <select
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={field.value}
                                        onChange={field.onChange}
                                      >
                                        <option value="">Select province</option>
                                        {nepalProvinces.map((state) => (
                                          <option key={state} value={state}>{state}</option>
                                        ))}
                                      </select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          {/* Farming Details Section */}
                          <div className="space-y-4 pt-4 border-t">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Farming Details</h3>
                            
                            <FormField
                              control={form.control}
                              name="main_crops"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <Wheat className="w-4 h-4 text-primary" />
                                    Main Crops / मुख्य बाली
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="e.g. Rice, Wheat, Vegetables" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground">Separate multiple crops with commas</p>
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {commonCrops.map((crop) => (
                                      <Badge
                                        key={crop}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-primary/10 text-xs"
                                        onClick={() => {
                                          const current = field.value || '';
                                          const crops = current.split(',').map(c => c.trim()).filter(Boolean);
                                          if (!crops.some(c => c.toLowerCase() === crop.split(' / ')[0].toLowerCase())) {
                                            const newValue = crops.length > 0 ? `${current}, ${crop.split(' / ')[0]}` : crop.split(' / ')[0];
                                            form.setValue('main_crops', newValue);
                                          }
                                        }}
                                      >
                                        + {crop}
                                      </Badge>
                                    ))}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="land_size_hectares"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <Ruler className="w-4 h-4 text-primary" />
                                      Land Size (Hectares)
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="e.g. 2.5" 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">1 Bigha ≈ 0.68 Hectares</p>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="irrigation_type"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <Droplets className="w-4 h-4 text-primary" />
                                      Irrigation Type / सिँचाइ
                                    </FormLabel>
                                    <FormControl>
                                      <select
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={field.value}
                                        onChange={field.onChange}
                                      >
                                        <option value="">Select type</option>
                                        {irrigationTypes.map((type) => (
                                          <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                      </select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button type="submit" className="flex-1 gap-2" disabled={isLoading}>
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-4 h-4" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                /* View Mode */
                <>
                  {/* Personal Info Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="border-border/50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <User className="w-5 h-5 text-primary" />
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</p>
                            <p className="font-medium">{profile?.full_name || '—'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                            <p className="font-medium">{profile?.phone || '—'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Village</p>
                            <p className="font-medium">{profile?.village || '—'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">District</p>
                            <p className="font-medium">{profile?.district || '—'}</p>
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Province</p>
                            <p className="font-medium">{profile?.state || '—'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Farming Details Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="border-border/50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Sprout className="w-5 h-5 text-primary" />
                          Farming Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                              <Wheat className="w-3.5 h-3.5" />
                              Main Crops
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {farmingDetails.main_crops.length > 0 ? (
                                farmingDetails.main_crops.map((crop, i) => (
                                  <Badge key={i} variant="secondary" className="bg-primary/10 text-primary">
                                    {crop}
                                  </Badge>
                                ))
                              ) : (
                                <p className="text-muted-foreground text-sm">Not set</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                              <Ruler className="w-3.5 h-3.5" />
                              Land Size
                            </div>
                            <p className="font-medium text-lg">
                              {farmingDetails.land_size_hectares 
                                ? `${farmingDetails.land_size_hectares} Hectares`
                                : <span className="text-muted-foreground text-sm font-normal">Not set</span>
                              }
                            </p>
                          </div>
                          
                          <div className="space-y-2 sm:col-span-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                              <Droplets className="w-3.5 h-3.5" />
                              Irrigation Type
                            </div>
                            <p className="font-medium">
                              {farmingDetails.irrigation_type 
                                ? getIrrigationLabel(farmingDetails.irrigation_type)
                                : <span className="text-muted-foreground text-sm font-normal">Not set</span>
                              }
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </>
              )}
            </div>

            {/* Right Column - Subscription, Notifications & Query History */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <SubscriptionCard />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <NotificationPreferencesCard />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 }}
              >
                <WeatherAlertSettingsCard />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <QueryHistoryCard />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSettings;