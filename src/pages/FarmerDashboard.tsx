import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FarmerBottomNav } from "@/components/layout/FarmerBottomNav";
import { OfflineDataViewer } from "@/components/farmer/OfflineDataViewer";
import CropCalendar from "@/components/farmer/CropCalendar";
import { TreatmentCalendar } from "@/components/farmer/TreatmentCalendar";
import WeatherPlantingAlerts from "@/components/farmer/WeatherPlantingAlerts";
import { LanguageSelector } from "@/components/farmer/LanguageSelector";
import { SoilAdvisoryCard } from "@/components/soil/SoilAdvisoryCard";
import { WeatherWidget } from "@/components/farmer/WeatherWidget";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { usePlots, useCropPhotos, useCreatePlot, useUploadPhoto, useDashboardStats } from "@/hooks/useFarmerData";
import { useFields } from "@/hooks/useFields";
import { Helmet } from "react-helmet-async";
import {
  Camera, MapPin, Calendar, Leaf, Upload, History, CheckCircle2,
  AlertTriangle, Plus, Loader2, Cloud, LogOut, User, Sparkles,
  WifiOff, Bug, CloudSun, Stethoscope, ArrowRight, Store, Bot,
  BookOpen, ChevronRight, Bell, Sun, Droplets,
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
    if (tab && ["home", "plots", "capture", "history", "offline", "calendar", "weather", "treatments"].includes(tab)) {
      return tab as any;
    }
    return "home";
  };

  const [activeTab, setActiveTab] = useState<"home" | "plots" | "capture" | "history" | "offline" | "calendar" | "weather" | "treatments">(getInitialTab());
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

  const quickActions = [
    { icon: Camera, label: "रोग पहिचान", desc: "बालीको फोटो स्क्यान", href: "/disease-detection", color: "bg-[hsl(var(--card-diagnosis-bg))]", iconColor: "text-[hsl(var(--card-diagnosis-icon))]" },
    { icon: Bot, label: "AI सहायक", desc: "AI सँग सोध्नुहोस्", href: "/krishi-mitra", color: "bg-[hsl(var(--card-ai-bg))]", iconColor: "text-[hsl(var(--card-ai-icon))]" },
    { icon: CloudSun, label: "मौसम", desc: "आजको मौसम हेर्नुहोस्", onClick: () => setActiveTab("weather"), color: "bg-[hsl(var(--card-weather-bg))]", iconColor: "text-[hsl(var(--card-weather-icon))]" },
    { icon: Store, label: "बजार भाउ", desc: "कृषि बजार मूल्य", href: "/market", color: "bg-[hsl(var(--card-market-bg))]", iconColor: "text-[hsl(var(--card-market-icon))]" },
  ];

  const farmTools = [
    { icon: MapPin, label: "मेरो खेत", desc: `${stats?.plots || 0} plots`, onClick: () => setActiveTab("plots") },
    { icon: Calendar, label: "कृषि कार्य", desc: "गतिविधि लग", href: "/activities" },
    { icon: Stethoscope, label: "उपचार", desc: "क्यालेन्डर", onClick: () => setActiveTab("treatments") },
    { icon: BookOpen, label: "खेती गाइड", desc: "बाली सुझाव", href: "/guides" },
  ];

  const tabItems = [
    { id: "home", label: "होम", icon: "🏠" },
    { id: "plots", label: t('myPlots'), icon: "🌾" },
    { id: "capture", label: t('capture'), icon: "📷" },
    { id: "treatments", label: t('treatments'), icon: "💊" },
    { id: "weather", label: t('weatherForecast'), icon: "🌤️" },
    { id: "calendar", label: t('calendar'), icon: "📅" },
    { id: "history", label: t('history'), icon: "📜" },
    { id: "offline", label: t('offlineData'), icon: "📴" },
  ];

  return (
    <>
      <Helmet>
        <title>किसान ड्यासबोर्ड | Kisan Sathi</title>
        <meta name="description" content="Manage your crop plots, capture photos, and track crop health." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Minimal Top Bar */}
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/30">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={() => navigate('/farmer/profile')}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground leading-tight">
                  नमस्ते, {profile?.full_name?.split(' ')[0] || 'किसान'} 👋
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {profile?.district || profile?.state || 'Nepal'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9" onClick={() => navigate('/farmer?tab=weather')}>
                <Bell className="w-4.5 h-4.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>

        <main className="pb-24">
          {/* Scrollable Tab Bar (only show when not on home) */}
          {activeTab !== "home" && (
            <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-sm border-b border-border/20 px-3 py-2">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {tabItems.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 pt-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {/* ===== HOME TAB ===== */}
                {activeTab === "home" && (
                  <div className="space-y-6">
                    {/* Weather Mini Card */}
                    <Card className="border-border/30 overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--card-weather-bg))] flex items-center justify-center">
                              <Sun className="w-6 h-6 text-[hsl(var(--card-weather-icon))]" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">आजको मौसम</p>
                              <p className="text-xs text-muted-foreground">
                                🌤️ 27°C • वर्षा 30%
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full text-xs text-primary"
                            onClick={() => setActiveTab("weather")}
                          >
                            विवरण
                            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Smart Alert */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-warning/8 border border-warning/20 rounded-2xl p-4 flex items-start gap-3"
                    >
                      <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertTriangle className="w-4.5 h-4.5 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">⚠️ आज वर्षा सम्भावना छ</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          आज pesticide spray नगर्नुहोस्। मौसम सफा भएपछि गर्नुहोस्।
                        </p>
                      </div>
                    </motion.div>

                    {/* Quick Actions - 2x2 Grid */}
                    <div>
                      <h2 className="text-base font-bold text-foreground mb-3">⚡ छिटो कार्य</h2>
                      <div className="grid grid-cols-2 gap-3">
                        {quickActions.map((action, i) => (
                          <motion.div
                            key={action.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <Card
                              className={`${action.color} border-0 cursor-pointer active:scale-[0.97] transition-transform`}
                              onClick={() => action.href ? navigate(action.href) : action.onClick?.()}
                            >
                              <CardContent className="p-4 flex flex-col gap-3">
                                <div className={`w-11 h-11 rounded-xl bg-card/80 flex items-center justify-center`}>
                                  <action.icon className={`w-5.5 h-5.5 ${action.iconColor}`} />
                                </div>
                                <div>
                                  <h3 className="text-sm font-bold text-foreground">{action.label}</h3>
                                  <p className="text-[11px] text-muted-foreground">{action.desc}</p>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Plots", value: stats?.plots || 0, icon: Leaf },
                        { label: "फोटो", value: stats?.photos || 0, icon: Camera },
                        { label: "स्वस्थ", value: stats?.healthyCrops || 0, icon: CheckCircle2 },
                        { label: "अलर्ट", value: stats?.alerts || 0, icon: AlertTriangle },
                      ].map((s) => (
                        <Card key={s.label} className="border-border/30">
                          <CardContent className="p-3 text-center">
                            <s.icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                            <p className="text-lg font-bold text-foreground">{s.value}</p>
                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Farm Management Section */}
                    <div>
                      <h2 className="text-base font-bold text-foreground mb-3">🌱 खेत व्यवस्थापन</h2>
                      <div className="space-y-2">
                        {farmTools.map((tool) => (
                          <Card
                            key={tool.label}
                            className="border-border/30 cursor-pointer active:scale-[0.99] transition-transform"
                            onClick={() => tool.href ? navigate(tool.href) : tool.onClick?.()}
                          >
                            <CardContent className="p-3.5 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                                <tool.icon className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-foreground">{tool.label}</h3>
                                <p className="text-[11px] text-muted-foreground">{tool.desc}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* More Tools */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "कृषि यात्रा", icon: "📸", href: "/action-film" },
                        { label: "विज्ञ सोध्नुहोस्", icon: "👨‍⚕️", href: "/ask-expert" },
                        { label: "सिक्नुहोस्", icon: "📚", href: "/learning" },
                      ].map((item) => (
                        <Card
                          key={item.label}
                          className="border-border/30 cursor-pointer active:scale-[0.97] transition-transform"
                          onClick={() => navigate(item.href)}
                        >
                          <CardContent className="p-3 text-center">
                            <span className="text-2xl">{item.icon}</span>
                            <p className="text-[11px] font-medium text-foreground mt-1.5">{item.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <h2 className="text-base font-bold text-foreground mb-3">📋 हालको गतिविधि</h2>
                      {photos && photos.length > 0 ? (
                        <div className="space-y-2">
                          {photos.slice(0, 3).map((photo: any) => (
                            <Card key={photo.id} className="border-border/30">
                              <CardContent className="p-3 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                                  <img src={photo.image_url} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {photo.plots?.plot_name || 'Plot'}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {new Date(photo.captured_at).toLocaleDateString()} • {photo.capture_stage.replace('_', ' ')}
                                  </p>
                                </div>
                                {photo.ai_analysis_results?.[0] && (
                                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                    photo.ai_analysis_results[0].health_status === 'healthy'
                                      ? "bg-primary/10 text-primary"
                                      : "bg-warning/10 text-warning"
                                  }`}>
                                    {photo.ai_analysis_results[0].health_status === 'healthy' ? "स्वस्थ" : "ध्यान"}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-primary"
                            onClick={() => setActiveTab("history")}
                          >
                            सबै हेर्नुहोस् <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </div>
                      ) : (
                        <Card className="border-dashed border-border/40">
                          <CardContent className="p-6 text-center">
                            <History className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">अझै कुनै गतिविधि छैन</p>
                            <Button
                              size="sm"
                              className="mt-3 rounded-full text-xs"
                              onClick={() => navigate('/disease-detection')}
                            >
                              <Camera className="w-3.5 h-3.5 mr-1" />
                              पहिलो स्क्यान गर्नुहोस्
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Radio Mode */}
                    <RadioModePanel />
                  </div>
                )}

                {/* ===== PLOTS TAB ===== */}
                {activeTab === "plots" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold text-foreground">{t('myPlots')}</h2>
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
                              {createPlot.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Plot'}
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
                      <div className="space-y-3">
                        {plots.map((plot) => (
                          <Card key={plot.id} className="border-border/30">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="font-bold text-foreground">{plot.plot_name}</h3>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Leaf className="w-3 h-3" />
                                    <span className="capitalize">{plot.crop_type}</span>
                                    {plot.area_hectares && <span> • {plot.area_hectares} ha</span>}
                                  </p>
                                </div>
                                <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                  plot.healthScore && plot.healthScore > 70
                                    ? "bg-primary/10 text-primary"
                                    : plot.healthScore
                                    ? "bg-warning/10 text-warning"
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                  {plot.healthScore
                                    ? plot.healthScore > 70 ? "स्वस्थ" : "ध्यान दिनुहोस्"
                                    : "डाटा छैन"}
                                </div>
                              </div>
                              {plot.healthScore && (
                                <div className="mb-3">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">Health</span>
                                    <span className="font-bold">{Math.round(plot.healthScore)}%</span>
                                  </div>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${plot.healthScore > 70 ? "bg-primary" : "bg-warning"}`}
                                      style={{ width: `${plot.healthScore}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              <Button
                                size="sm"
                                className="w-full rounded-xl text-xs"
                                onClick={() => { setSelectedPlot(plot.id); setActiveTab("capture"); }}
                              >
                                <Camera className="w-3.5 h-3.5 mr-1" />
                                फोटो खिच्नुहोस्
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-dashed border-2">
                        <CardContent className="flex flex-col items-center justify-center py-14">
                          <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
                            <MapPin className="w-8 h-8 text-primary" />
                          </div>
                          <h3 className="font-bold text-base mb-1">अझै Plot छैन</h3>
                          <p className="text-muted-foreground text-center text-sm mb-4 max-w-xs">
                            तपाईंको पहिलो Plot थप्नुहोस्
                          </p>
                          <Button onClick={() => setIsAddPlotOpen(true)} className="rounded-full px-6" size="sm">
                            <Plus className="w-4 h-4 mr-1" /> पहिलो Plot थप्नुहोस्
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {fields.length > 0 && <SoilAdvisoryCard fields={fields} />}
                  </div>
                )}

                {/* ===== CAPTURE TAB ===== */}
                {activeTab === "capture" && (
                  <div className="max-w-lg mx-auto space-y-5">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Camera className="w-5 h-5 text-primary" />
                      बाली फोटो खिच्नुहोस्
                    </h2>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Plot छान्नुहोस्</Label>
                        <select
                          className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground mt-1"
                          value={selectedPlot}
                          onChange={(e) => setSelectedPlot(e.target.value)}
                        >
                          <option value="">Plot छान्नुहोस्...</option>
                          {plots?.map((plot) => (
                            <option key={plot.id} value={plot.id}>{plot.plot_name} - {plot.crop_type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs">बिरुवाको चरण</Label>
                        <select
                          className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground mt-1"
                          value={selectedStage}
                          onChange={(e) => setSelectedStage(e.target.value as CropStage)}
                        >
                          {cropStages.map((stage) => (
                            <option key={stage.value} value={stage.value}>{stage.label}</option>
                          ))}
                        </select>
                      </div>
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
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                        selectedPlot
                          ? "border-primary/40 hover:border-primary bg-primary/5"
                          : "border-border opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => selectedPlot && fileInputRef.current?.click()}
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                        {uploadPhoto.isPending ? (
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : (
                          <Upload className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-1">
                        {uploadPhoto.isPending ? "अपलोड हुँदैछ..." : "फोटो खिच्नुहोस्"}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        {selectedPlot ? "GPS स्थान स्वतः रेकर्ड हुनेछ" : "कृपया पहिले Plot छान्नुहोस्"}
                      </p>
                      <Button disabled={!selectedPlot || uploadPhoto.isPending} className="rounded-full px-5" size="sm">
                        <Camera className="w-4 h-4 mr-1" />
                        {uploadPhoto.isPending ? "प्रक्रियामा..." : "क्यामेरा खोल्नुहोस्"}
                      </Button>
                    </div>

                    <Card className="border-border/30 bg-accent/5">
                      <CardContent className="p-4">
                        <h4 className="font-bold text-sm text-foreground mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-accent" />
                          💡 फोटो सुझाव
                        </h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• छातीको उचाइमा फोन राख्नुहोस्</li>
                          <li>• राम्रो उज्यालोमा फोटो खिच्नुहोस्</li>
                          <li>• बालीको ५०% र आकाशको ३०% समावेश गर्नुहोस्</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ===== HISTORY TAB ===== */}
                {activeTab === "history" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-foreground">{t('history')}</h2>
                    {photosLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : photos && photos.length > 0 ? (
                      <div className="space-y-2">
                        {photos.map((photo: any) => (
                          <Card key={photo.id} className="border-border/30">
                            <CardContent className="p-3 flex items-center gap-3">
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                                <img src={photo.image_url} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-foreground truncate">
                                  {photo.plots?.plot_name || 'Unknown Plot'}
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                  {new Date(photo.captured_at).toLocaleDateString()} • {photo.capture_stage.replace('_', ' ')}
                                </p>
                              </div>
                              {photo.ai_analysis_results?.[0] && (
                                <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                  photo.ai_analysis_results[0].health_status === 'healthy'
                                    ? "bg-primary/10 text-primary"
                                    : photo.ai_analysis_results[0].health_status === 'pending'
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-warning/10 text-warning"
                                }`}>
                                  {photo.ai_analysis_results[0].health_status === 'healthy' ? "✓ स्वस्थ" : "⚠ ध्यान"}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-dashed border-2">
                        <CardContent className="flex flex-col items-center justify-center py-14">
                          <History className="w-8 h-8 text-muted-foreground mb-3" />
                          <h3 className="font-bold text-base mb-1">अझै फोटो छैन</h3>
                          <p className="text-muted-foreground text-center text-sm mb-3">
                            बालीको फोटो खिच्न सुरु गर्नुहोस्
                          </p>
                          <Button onClick={() => setActiveTab("capture")} className="rounded-full" size="sm">
                            <Camera className="w-4 h-4 mr-1" /> फोटो खिच्नुहोस्
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* ===== WEATHER TAB ===== */}
                {activeTab === "weather" && (
                  <div className="space-y-4">
                    <WeatherPlantingAlerts />
                  </div>
                )}

                {/* ===== TREATMENTS TAB ===== */}
                {activeTab === "treatments" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-primary" />
                      उपचार क्यालेन्डर
                    </h2>
                    <TreatmentCalendar />
                  </div>
                )}

                {/* ===== CALENDAR TAB ===== */}
                {activeTab === "calendar" && (
                  <div className="space-y-4">
                    <CropCalendar />
                  </div>
                )}

                {/* ===== OFFLINE TAB ===== */}
                {activeTab === "offline" && (
                  <div className="space-y-4">
                    <OfflineDataViewer />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <FarmerBottomNav />
      </div>
    </>
  );
};

export default FarmerDashboard;
