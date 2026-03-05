import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { KrishiMitraBar } from "@/components/ai/KrishiMitraBar";
import { OfflineDataViewer } from "@/components/farmer/OfflineDataViewer";
import CropCalendar from "@/components/farmer/CropCalendar";
import { TreatmentCalendar } from "@/components/farmer/TreatmentCalendar";
import WeatherPlantingAlerts from "@/components/farmer/WeatherPlantingAlerts";
import { LanguageSelector } from "@/components/farmer/LanguageSelector";
import { SoilAdvisoryCard } from "@/components/soil/SoilAdvisoryCard";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { usePlots, useCropPhotos, useCreatePlot, useUploadPhoto, useDashboardStats } from "@/hooks/useFarmerData";
import { useFields } from "@/hooks/useFields";
import { Helmet } from "react-helmet-async";
import {
  Camera,
  MapPin,
  Calendar,
  Leaf,
  Upload,
  History,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Loader2,
  Cloud,
  Thermometer,
  Droplets,
  LogOut,
  User,
  Sparkles,
  WifiOff,
  Bug,
  CloudSun,
  Stethoscope,
  ArrowRight,
  Store,
  Bot,
  BookOpen,
} from "lucide-react";
import { RadioModePanel } from "@/components/radio/RadioModePanel";
import { Database } from "@/integrations/supabase/types";

type CropType = Database['public']['Enums']['crop_type'];
type CropStage = Database['public']['Enums']['crop_stage'];

const cropTypes: { value: CropType; label: string }[] = [
  { value: 'wheat', label: 'Wheat (गेहूं)' },
  { value: 'rice', label: 'Rice (चावल)' },
  { value: 'cotton', label: 'Cotton (कपास)' },
  { value: 'sugarcane', label: 'Sugarcane (गन्ना)' },
  { value: 'maize', label: 'Maize (मक्का)' },
  { value: 'soybean', label: 'Soybean (सोयाबीन)' },
  { value: 'groundnut', label: 'Groundnut (मूंगफली)' },
  { value: 'mustard', label: 'Mustard (सरसों)' },
  { value: 'other', label: 'Other (अन्य)' },
];

const cropStages: { value: CropStage; label: string }[] = [
  { value: 'sowing', label: 'Sowing (बुवाई)' },
  { value: 'early_vegetative', label: 'Early Vegetative' },
  { value: 'vegetative', label: 'Vegetative (वनस्पति)' },
  { value: 'flowering', label: 'Flowering (फूल)' },
  { value: 'grain_filling', label: 'Grain Filling' },
  { value: 'maturity', label: 'Maturity (परिपक्वता)' },
  { value: 'harvest', label: 'Harvest (कटाई)' },
];

const FarmerDashboard = () => {
  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["plots", "capture", "history", "offline", "calendar", "weather", "treatments"].includes(tab)) {
      return tab as "plots" | "capture" | "history" | "offline" | "calendar" | "weather" | "treatments";
    }
    return "plots";
  };
  
  const [activeTab, setActiveTab] = useState<"plots" | "capture" | "history" | "offline" | "calendar" | "weather" | "treatments">(getInitialTab());
  const [isAddPlotOpen, setIsAddPlotOpen] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<CropStage>("vegetative");
  const [newPlot, setNewPlot] = useState({ name: '', cropType: 'wheat' as CropType, area: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user, profile, isLoading: authLoading, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { data: plots, isLoading: plotsLoading } = usePlots();
  const { data: photos, isLoading: photosLoading } = useCropPhotos();
  const { data: stats } = useDashboardStats();
  const { fields } = useFields();
  const createPlot = useCreatePlot();
  const uploadPhoto = useUploadPhoto();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleCreatePlot = async () => {
    if (!newPlot.name) return;
    let latitude: number | undefined;
    let longitude: number | undefined;
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (e) {
        console.log('Location not available');
      }
    }
    await createPlot.mutateAsync({
      plot_name: newPlot.name,
      crop_type: newPlot.cropType,
      area_hectares: newPlot.area ? parseFloat(newPlot.area) : undefined,
      latitude, longitude,
      state: profile?.state || undefined,
      district: profile?.district || undefined,
      village: profile?.village || undefined,
    });
    setNewPlot({ name: '', cropType: 'wheat', area: '' });
    setIsAddPlotOpen(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPlot) return;
    let latitude: number | undefined;
    let longitude: number | undefined;
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (e) {
        console.log('Location not available');
      }
    }
    await uploadPhoto.mutateAsync({ plotId: selectedPlot, file, stage: selectedStage, latitude, longitude });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const quickTools = [
    { icon: Bug, label: t('cropDiagnosis'), desc: t('askPhoto'), href: '/disease-detection', bg: 'bg-[hsl(var(--card-diagnosis-bg))]', iconBg: 'bg-[hsl(var(--card-diagnosis-icon))]' },
    { icon: Store, label: t('market'), desc: t('buySell'), href: '/market', bg: 'bg-[hsl(var(--card-market-bg))]', iconBg: 'bg-[hsl(var(--card-market-icon))]' },
    { icon: BookOpen, label: t('agriKnowledgeGuide'), desc: t('cropGuide'), href: '/guides', bg: 'bg-[hsl(var(--card-guide-bg))]', iconBg: 'bg-[hsl(var(--card-guide-icon))]' },
    { icon: Calendar, label: t('farmWork'), desc: t('activitiesLog'), href: '/activities', bg: 'bg-[hsl(var(--card-ai-bg))]', iconBg: 'bg-[hsl(var(--card-ai-icon))]' },
    { icon: MapPin, label: t('myFieldLabel'), desc: t('fields'), href: '/fields', bg: 'bg-[hsl(var(--card-field-bg))]', iconBg: 'bg-[hsl(var(--card-field-icon))]' },
    { icon: Bot, label: t('aiHelper'), desc: t('kisanSathi'), href: '/krishi-mitra', bg: 'bg-[hsl(var(--card-weather-bg))]', iconBg: 'bg-[hsl(var(--card-weather-icon))]' },
    { icon: Stethoscope, label: 'प्राविधिकसँग सोध्नुहोस्', desc: 'कृषि विज्ञलाई प्रश्न गर्नुहोस्', href: '/ask-expert', bg: 'bg-[hsl(var(--card-expert-bg))]', iconBg: 'bg-[hsl(var(--card-expert-icon))]' },
    { icon: Camera, label: 'मेरो कृषि यात्रा', desc: 'बालीको कथा हेर्नुहोस्', href: '/action-film', bg: 'bg-[hsl(var(--card-journey-bg))]', iconBg: 'bg-[hsl(var(--card-journey-icon))]' },
  ];

  const tabItems = [
    { id: "plots", label: t('myPlots'), emoji: "🌾", icon: MapPin },
    { id: "capture", label: t('capture'), emoji: "📷", icon: Camera },
    { id: "treatments", label: t('treatments'), emoji: "💊", icon: Stethoscope },
    { id: "weather", label: t('weatherForecast'), emoji: "🌤️", icon: CloudSun },
    { id: "calendar", label: t('calendar'), emoji: "📅", icon: Calendar },
    { id: "history", label: t('history'), emoji: "📜", icon: History },
    { id: "offline", label: t('offlineData'), emoji: "📴", icon: WifiOff },
  ];

  return (
    <>
      <Helmet>
        <title>किसान ड्यासबोर्ड | Kisan Sathi</title>
        <meta name="description" content="Manage your crop plots, capture photos, and track crop health." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 sm:pt-24 pb-28">
          <div className="container mx-auto px-4 max-w-7xl">
            {/* Welcome Section */}
            {activeTab !== "weather" && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.03] rounded-3xl p-6 sm:p-8 border border-border/40">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div 
                      className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => navigate('/farmer/profile')}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-7 h-7 text-primary-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                          🙏 नमस्ते, {profile?.full_name || 'किसान'}!
                        </h1>
                        <p className="text-muted-foreground text-sm truncate">
                          {profile?.village && `${profile.village}, `}
                          {profile?.district && `${profile.district}, `}
                          {profile?.state || 'Nepal'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <LanguageSelector />
                      <Button variant="outline" size="sm" onClick={() => navigate('/farmer/profile')} className="rounded-full flex-1 sm:flex-initial">
                        <User className="w-4 h-4" />
                        <span className="ml-2 hidden md:inline">Profile</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={signOut} className="rounded-full flex-1 sm:flex-initial">
                        <LogOut className="w-4 h-4" />
                        <span className="ml-2 sm:hidden md:inline">Sign Out</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Stats */}
            {activeTab !== "weather" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
                {[
                  { icon: Leaf, label: t('myPlots'), value: stats?.plots || 0, iconBg: "bg-[hsl(var(--card-market-icon))]" },
                  { icon: Camera, label: t('photos'), value: stats?.photos || 0, iconBg: "bg-[hsl(var(--card-weather-icon))]" },
                  { icon: CheckCircle2, label: t('healthy'), value: stats?.healthyCrops || 0, iconBg: "bg-primary" },
                  { icon: AlertTriangle, label: t('alerts'), value: stats?.alerts || 0, iconBg: "bg-[hsl(var(--card-diagnosis-icon))]" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Card className="border-border/40 hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${stat.iconBg} flex items-center justify-center shadow-sm`}>
                          <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Quick Access Tools */}
            {activeTab !== "weather" && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <h2 className="text-lg font-bold text-foreground mb-4">⚡ छिटो पहुँच</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {quickTools.map((tool, i) => (
                    <motion.div
                      key={tool.href}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.03 }}
                    >
                      <Card 
                        className={`${tool.bg} border-border/30 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.97]`}
                        onClick={() => navigate(tool.href)}
                      >
                        <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center gap-3">
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${tool.iconBg} flex items-center justify-center shadow-sm`}>
                            <tool.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-foreground">{tool.label}</h3>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">{tool.desc}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Radio Mode */}
            {activeTab !== "weather" && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <RadioModePanel />
              </motion.div>
            )}

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 pb-2">
              {tabItems.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-shrink-0 gap-1.5 sm:gap-2 rounded-full ${activeTab === tab.id ? 'shadow-md' : ''}`}
                  size="sm"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.emoji}</span>
                </Button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "plots" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-foreground">{t('myPlots')}</h2>
                      <Dialog open={isAddPlotOpen} onOpenChange={setIsAddPlotOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="rounded-full">
                            <Plus className="w-4 h-4 mr-1" />
                            नयाँ Plot
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl">
                          <DialogHeader>
                            <DialogTitle>नयाँ Plot थप्नुहोस्</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label>Plot Name</Label>
                              <Input
                                placeholder="e.g., North Field"
                                value={newPlot.name}
                                onChange={(e) => setNewPlot({ ...newPlot, name: e.target.value })}
                                className="rounded-xl"
                              />
                            </div>
                            <div>
                              <Label>Crop Type</Label>
                              <select
                                className="w-full h-11 px-3 rounded-xl border border-input bg-background"
                                value={newPlot.cropType}
                                onChange={(e) => setNewPlot({ ...newPlot, cropType: e.target.value as CropType })}
                              >
                                {cropTypes.map((crop) => (
                                  <option key={crop.value} value={crop.value}>{crop.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label>Area (Hectares)</Label>
                              <Input
                                type="number"
                                placeholder="e.g., 2.5"
                                value={newPlot.area}
                                onChange={(e) => setNewPlot({ ...newPlot, area: e.target.value })}
                                className="rounded-xl"
                              />
                            </div>
                            <Button
                              className="w-full rounded-xl"
                              onClick={handleCreatePlot}
                              disabled={createPlot.isPending || !newPlot.name}
                            >
                              {createPlot.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Create Plot'
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {plotsLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : plots && plots.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plots.map((plot) => (
                          <Card key={plot.id} className="border-border/40 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{plot.plot_name}</CardTitle>
                                <div
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    plot.healthScore && plot.healthScore > 70
                                      ? "bg-primary/10 text-primary"
                                      : plot.healthScore
                                      ? "bg-warning/10 text-warning"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {plot.healthScore 
                                    ? plot.healthScore > 70 ? "स्वस्थ" : "ध्यान दिनुहोस्"
                                    : "डाटा छैन"}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Leaf className="w-4 h-4" />
                                <span className="capitalize">{plot.crop_type}</span>
                                {plot.area_hectares && (
                                  <>
                                    <span className="text-border">•</span>
                                    <span>{plot.area_hectares} ha</span>
                                  </>
                                )}
                              </div>
                              {plot.sowing_date && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  <span>Sown: {new Date(plot.sowing_date).toLocaleDateString()}</span>
                                </div>
                              )}
                              {plot.healthScore && (
                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Health Score</span>
                                    <span className="font-bold text-foreground">{Math.round(plot.healthScore)}%</span>
                                  </div>
                                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        plot.healthScore > 70 ? "bg-primary" : "bg-warning"
                                      }`}
                                      style={{ width: `${plot.healthScore}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              <div className="pt-2">
                                <Button
                                  className="w-full rounded-xl"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPlot(plot.id);
                                    setActiveTab("capture");
                                  }}
                                >
                                  <Camera className="w-4 h-4 mr-1" />
                                  फोटो खिच्नुहोस्
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-dashed border-2">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                          <div className="w-20 h-20 rounded-3xl bg-primary/8 flex items-center justify-center mb-5">
                            <MapPin className="w-10 h-10 text-primary" />
                          </div>
                          <h3 className="font-bold text-lg mb-2 text-foreground">अझै Plot छैन</h3>
                          <p className="text-muted-foreground text-center mb-5 text-sm max-w-xs">
                            तपाईंको पहिलो Plot थप्नुहोस् र बालीको अवस्था ट्र्याक गर्नुहोस्
                          </p>
                          <Button onClick={() => setIsAddPlotOpen(true)} className="rounded-full px-6">
                            <Plus className="w-4 h-4 mr-1" />
                            पहिलो Plot थप्नुहोस्
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {fields.length > 0 && (
                      <div className="mt-6">
                        <SoilAdvisoryCard fields={fields} />
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "capture" && (
                  <div className="max-w-2xl mx-auto">
                    <Card className="border-border/40">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Camera className="w-5 h-5 text-primary" />
                          बाली फोटो खिच्नुहोस्
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label>Plot छान्नुहोस्</Label>
                          <select
                            className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground"
                            value={selectedPlot}
                            onChange={(e) => setSelectedPlot(e.target.value)}
                          >
                            <option value="">Plot छान्नुहोस्...</option>
                            {plots?.map((plot) => (
                              <option key={plot.id} value={plot.id}>
                                {plot.plot_name} - {plot.crop_type}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>बिरुवाको चरण</Label>
                          <select
                            className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground"
                            value={selectedStage}
                            onChange={(e) => setSelectedStage(e.target.value as CropStage)}
                          >
                            {cropStages.map((stage) => (
                              <option key={stage.value} value={stage.value}>{stage.label}</option>
                            ))}
                          </select>
                        </div>

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handlePhotoUpload}
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                        />

                        <div
                          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                            selectedPlot
                              ? "border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/8"
                              : "border-border opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() => selectedPlot && fileInputRef.current?.click()}
                        >
                          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-primary/10 flex items-center justify-center">
                            {uploadPhoto.isPending ? (
                              <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            ) : (
                              <Upload className="w-10 h-10 text-primary" />
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-foreground mb-2">
                            {uploadPhoto.isPending ? "अपलोड हुँदैछ..." : "फोटो खिच्नुहोस् वा अपलोड गर्नुहोस्"}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-5">
                            {selectedPlot
                              ? "बालीको फोटो खिच्नुहोस्। GPS स्थान स्वतः रेकर्ड हुनेछ।"
                              : "कृपया पहिले Plot छान्नुहोस्"}
                          </p>
                          <Button variant="default" disabled={!selectedPlot || uploadPhoto.isPending} className="rounded-full px-6">
                            <Camera className="w-4 h-4 mr-1" />
                            {uploadPhoto.isPending ? "प्रक्रियामा..." : "क्यामेरा खोल्नुहोस्"}
                          </Button>
                        </div>

                        <div className="bg-accent/8 rounded-2xl p-5 border border-accent/15">
                          <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-accent" />
                            💡 फोटो सुझाव
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1.5">
                            <li>• छातीको उचाइमा फोन राख्नुहोस्</li>
                            <li>• राम्रो उज्यालोमा फोटो खिच्नुहोस्</li>
                            <li>• बालीको ५०% र आकाशको ३०% समावेश गर्नुहोस्</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground">{t('history')}</h2>
                    
                    {photosLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : photos && photos.length > 0 ? (
                      <div className="space-y-3">
                        {photos.map((photo: any) => (
                          <Card key={photo.id} className="border-border/40 hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                                <img src={photo.image_url} alt="Crop photo" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-foreground truncate">
                                  {photo.plots?.plot_name || 'Unknown Plot'}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(photo.captured_at).toLocaleDateString()} • {photo.capture_stage.replace('_', ' ')}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                {photo.ai_analysis_results?.[0] ? (
                                  <div
                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
                                      photo.ai_analysis_results[0].health_status === 'healthy'
                                        ? "bg-primary/10 text-primary"
                                        : photo.ai_analysis_results[0].health_status === 'pending'
                                        ? "bg-muted text-muted-foreground"
                                        : "bg-warning/10 text-warning"
                                    }`}
                                  >
                                    {photo.ai_analysis_results[0].health_status === 'healthy' ? (
                                      <CheckCircle2 className="w-4 h-4" />
                                    ) : photo.ai_analysis_results[0].health_status !== 'pending' ? (
                                      <AlertTriangle className="w-4 h-4" />
                                    ) : null}
                                    <span className="capitalize">
                                      {photo.ai_analysis_results[0].health_status.replace('_', ' ')}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">विश्लेषण हुँदैछ</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-dashed border-2">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                          <div className="w-20 h-20 rounded-3xl bg-primary/8 flex items-center justify-center mb-5">
                            <History className="w-10 h-10 text-primary" />
                          </div>
                          <h3 className="font-bold text-lg mb-2">अझै फोटो छैन</h3>
                          <p className="text-muted-foreground text-center mb-5 text-sm">
                            बालीको स्वास्थ्य ट्र्याक गर्न फोटो खिच्न सुरु गर्नुहोस्
                          </p>
                          <Button onClick={() => setActiveTab("capture")} className="rounded-full px-6">
                            <Camera className="w-4 h-4 mr-1" />
                            पहिलो फोटो खिच्नुहोस्
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {activeTab === "weather" && (
                  <div className="space-y-4">
                    <WeatherPlantingAlerts />
                  </div>
                )}

                {activeTab === "treatments" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-primary" />
                      उपचार क्यालेन्डर
                    </h2>
                    <TreatmentCalendar />
                  </div>
                )}

                {activeTab === "calendar" && (
                  <div className="space-y-4">
                    <CropCalendar />
                  </div>
                )}

                {activeTab === "offline" && (
                  <div className="space-y-4">
                    <OfflineDataViewer />
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <Footer />
        <KrishiMitraBar />
      </div>
    </>
  );
};

export default FarmerDashboard;
