import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FarmerBottomNav, type MainTab } from "@/components/layout/FarmerBottomNav";
import { FarmerSidebar } from "@/components/layout/FarmerSidebar";
import { OfflineDataViewer } from "@/components/farmer/OfflineDataViewer";
import CropCalendar from "@/components/farmer/CropCalendar";
import { TreatmentCalendar } from "@/components/farmer/TreatmentCalendar";
import WeatherPlantingAlerts from "@/components/farmer/WeatherPlantingAlerts";
import { LanguageSelector } from "@/components/farmer/LanguageSelector";
import { SoilAdvisoryCard } from "@/components/soil/SoilAdvisoryCard";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { usePlots, useCropPhotos, useCreatePlot, useUploadPhoto, useDashboardStats } from "@/hooks/useFarmerData";
import { useFields } from "@/hooks/useFields";
import { Helmet } from "react-helmet-async";
import {
  Camera, MapPin, Calendar, Leaf, Upload, History, CheckCircle2,
  AlertTriangle, Plus, Loader2, User, Sparkles,
  Bug, CloudSun, Stethoscope, Store, Bot,
  BookOpen, ChevronRight, Bell, Sun, Droplets, CloudRain,
  Sprout, TrendingUp, MessageSquare,
} from "lucide-react";
import { RadioModePanel } from "@/components/radio/RadioModePanel";
import { Database } from "@/integrations/supabase/types";

// Lazy-loaded tab content
import { NepaliDiseaseDetector } from "@/components/ai/NepaliDiseaseDetector";
import { DiseasePrediction } from "@/components/disease/DiseasePrediction";
import { OutbreakAlertsBanner } from "@/components/disease/OutbreakAlertsBanner";
import { OnScreenAssistant } from "@/components/ai/OnScreenAssistant";
import { EmbeddedProfileTab } from "@/components/profile/EmbeddedProfileTab";
import { EmbeddedFieldsTab } from "@/components/fields/EmbeddedFieldsTab";

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
  const getInitialTab = (): MainTab => {
    if (window.location.pathname === '/farmer/profile') return "profile";
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["home", "scan", "ai", "farm", "profile"].includes(tab)) {
      return tab as MainTab;
    }
    return "home";
  };

  const [mainTab, setMainTab] = useState<MainTab>(getInitialTab());
  // Sub-tabs for home dashboard
  const [homeSubTab, setHomeSubTab] = useState<"dashboard" | "plots" | "capture" | "history" | "calendar" | "weather" | "treatments" | "offline">("dashboard");
  
  const [isAddPlotOpen, setIsAddPlotOpen] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<CropStage>("vegetative");
  const [newPlot, setNewPlot] = useState({ name: '', cropType: 'wheat' as CropType, area: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

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

  const firstName = profile?.full_name?.split(' ')[0] || 'किसान';
  const location_ = profile?.district || profile?.state || 'Nepal';

  const quickActions = [
    { icon: Camera, label: "📷 रोग पहिचान", desc: "बालीको फोटो स्क्यान", onClick: () => setMainTab("scan"), bg: "bg-[hsl(var(--card-diagnosis-bg))]", iconColor: "text-[hsl(var(--card-diagnosis-icon))]" },
    { icon: Bot, label: "🤖 AI सहायक", desc: "AI सँग सोध्नुहोस्", onClick: () => setMainTab("ai"), bg: "bg-[hsl(var(--card-ai-bg))]", iconColor: "text-[hsl(var(--card-ai-icon))]" },
    { icon: Store, label: "📊 बजार भाउ", desc: "कृषि बजार मूल्य", onClick: () => navigate("/market"), bg: "bg-[hsl(var(--card-market-bg))]", iconColor: "text-[hsl(var(--card-market-icon))]" },
    { icon: CloudSun, label: "🌦 मौसम", desc: "आजको मौसम हेर्नुहोस्", onClick: () => { setMainTab("home"); setHomeSubTab("weather"); }, bg: "bg-[hsl(var(--card-weather-bg))]", iconColor: "text-[hsl(var(--card-weather-icon))]" },
  ];

  const homeTabItems = [
    { id: "dashboard", label: "होम", icon: "🏠" },
    { id: "plots", label: t('myPlots'), icon: "🌾" },
    { id: "capture", label: t('capture'), icon: "📷" },
    { id: "treatments", label: t('treatments'), icon: "💊" },
    { id: "weather", label: t('weatherForecast'), icon: "🌤️" },
    { id: "calendar", label: t('calendar'), icon: "📅" },
    { id: "history", label: t('history'), icon: "📜" },
    { id: "offline", label: t('offlineData'), icon: "📴" },
  ];

  const handleMainTabChange = (tab: MainTab) => {
    setMainTab(tab);
    if (tab === "home") setHomeSubTab("dashboard");
  };

  return (
    <>
      <Helmet>
        <title>किसान ड्यासबोर्ड | Kisan Sathi</title>
        <meta name="description" content="Manage your crop plots, capture photos, and track crop health." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* ── Unified Header ── */}
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/30">
          <div className="flex items-center justify-between px-4 h-14">
            {/* Left: Sidebar + Avatar */}
            <div className="flex items-center gap-2 min-w-0">
              <FarmerSidebar onTabChange={handleMainTabChange} />
              <div
                className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 ring-2 ring-primary/20"
                onClick={() => setMainTab("profile")}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-[14px] font-bold text-foreground leading-tight truncate">
                  नमस्ते {firstName} 👋
                </h1>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" /> {location_}
                  </span>
                  <span className="text-border">•</span>
                  <span className="flex items-center gap-0.5">
                    <Sun className="w-3 h-3 text-amber-500" /> 27°C
                  </span>
                </div>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <NotificationBell />
              <LanguageSelector />
            </div>
          </div>
        </div>

        <main className="pb-24">
          <AnimatePresence mode="wait">
            {/* ===== HOME TAB ===== */}
            {mainTab === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Sub-tab bar (show when not on dashboard) */}
                {homeSubTab !== "dashboard" && (
                  <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-sm border-b border-border/20 px-3 py-2">
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                      {homeTabItems.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setHomeSubTab(tab.id as any)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                            homeSubTab === tab.id
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

                <div className="px-4 pt-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={homeSubTab}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.12 }}
                    >
                      {/* HOME DASHBOARD */}
                      {homeSubTab === "dashboard" && (
                        <div className="space-y-5">
                          {/* Quick Actions */}
                          <section>
                            <h2 className="text-sm font-bold text-foreground mb-2.5 flex items-center gap-1.5">
                              <span className="text-base">⚡</span> छिटो कार्य
                            </h2>
                            <div className="grid grid-cols-2 gap-2.5">
                              {quickActions.map((action, i) => (
                                <motion.div
                                  key={action.label}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                >
                                  <Card
                                    className={`${action.bg} border-0 cursor-pointer active:scale-[0.97] transition-transform shadow-sm`}
                                    onClick={action.onClick}
                                  >
                                    <CardContent className="p-3.5">
                                      <div className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center mb-2.5">
                                        <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                                      </div>
                                      <h3 className="text-[13px] font-bold text-foreground leading-tight">{action.label}</h3>
                                      <p className="text-[11px] text-muted-foreground mt-0.5">{action.desc}</p>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ))}
                            </div>
                          </section>

                          {/* My Farm */}
                          <section>
                            <div className="flex items-center justify-between mb-2.5">
                              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                <span className="text-base">🌱</span> मेरो खेत
                              </h2>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-primary h-7 px-2"
                                onClick={() => setMainTab("farm")}
                              >
                                सबै हेर्नुहोस् <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                              </Button>
                            </div>

                            {fields.length > 0 || (plots && plots.length > 0) ? (
                              <div className="space-y-2">
                                {(fields.length > 0 ? fields.slice(0, 2) : plots?.slice(0, 2))?.map((item: any) => (
                                  <Card key={item.id} className="border-border/30 shadow-sm" onClick={() => setMainTab("farm")}>
                                    <CardContent className="p-3 flex items-center gap-3 cursor-pointer">
                                      <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                                        <Sprout className="w-5 h-5 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-foreground truncate">
                                          {item.field_name || item.plot_name || 'खेत'}
                                        </h3>
                                        <p className="text-[11px] text-muted-foreground">
                                          {item.crop_type ? String(item.crop_type).replace('_', ' ') : ''} 
                                          {item.area_hectares ? ` • ${item.area_hectares} ha` : item.size_value ? ` • ${item.size_value} ${item.size_unit || ''}` : ''}
                                        </p>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <Card className="border-dashed border-2 border-border/40 shadow-none">
                                <CardContent className="flex flex-col items-center py-8">
                                  <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-3">
                                    <Sprout className="w-7 h-7 text-primary" />
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3 text-center">
                                    अहिले तपाईंको खेत जानकारी छैन।
                                  </p>
                                  <Button
                                    size="sm"
                                    className="rounded-full px-5"
                                    onClick={() => setMainTab("farm")}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    नयाँ खेत थप्नुहोस्
                                  </Button>
                                </CardContent>
                              </Card>
                            )}
                          </section>

                          {/* Alerts */}
                          <section>
                            <h2 className="text-sm font-bold text-foreground mb-2.5 flex items-center gap-1.5">
                              <span className="text-base">🔔</span> अलर्ट
                            </h2>
                            <div className="space-y-2">
                              {[
                                { icon: CloudRain, label: "🌧️ वर्षा चेतावनी", desc: "भोलि भारी वर्षा हुने सम्भावना छ। आज spray नगर्नुहोस्।", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200/60 dark:border-blue-800/40", iconColor: "text-blue-500" },
                                { icon: Bug, label: "⚠️ रोग चेतावनी", desc: "तपाईंको क्षेत्रमा Late Blight रिपोर्ट भएको छ।", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200/60 dark:border-amber-800/40", iconColor: "text-amber-500" },
                                { icon: TrendingUp, label: "📈 बजार मूल्य सूचना", desc: "टमाटरको भाउ बढेको छ — रु. ४५/kg", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200/60 dark:border-emerald-800/40", iconColor: "text-emerald-500" },
                              ].map((alert, i) => (
                                <motion.div
                                  key={alert.label}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.06 }}
                                >
                                  <Card className={`${alert.bg} ${alert.border} border shadow-none`}>
                                    <CardContent className="p-3 flex items-start gap-3">
                                      <div className="w-9 h-9 rounded-lg bg-card/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <alert.icon className={`w-4.5 h-4.5 ${alert.iconColor}`} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-semibold text-foreground">{alert.label}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{alert.desc}</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ))}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-primary h-8"
                                onClick={() => navigate('/notifications')}
                              >
                                सबै सूचना हेर्नुहोस् <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                              </Button>
                            </div>
                          </section>

                          {/* Quick Stats */}
                          <section>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { label: "खेत", value: stats?.plots || fields.length || 0, icon: Leaf },
                                { label: "फोटो", value: stats?.photos || 0, icon: Camera },
                                { label: "स्वस्थ", value: stats?.healthyCrops || 0, icon: CheckCircle2 },
                                { label: "अलर्ट", value: stats?.alerts || 0, icon: AlertTriangle },
                              ].map((s) => (
                                <Card key={s.label} className="border-border/30 shadow-sm">
                                  <CardContent className="p-2.5 text-center">
                                    <s.icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                                    <p className="text-lg font-bold text-foreground leading-none">{s.value}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </section>

                          {/* Recent Activity */}
                          <section>
                            <h2 className="text-sm font-bold text-foreground mb-2.5 flex items-center gap-1.5">
                              <span className="text-base">📋</span> हालको गतिविधि
                            </h2>
                            {photos && photos.length > 0 ? (
                              <div className="space-y-2">
                                {photos.slice(0, 3).map((photo: any) => (
                                  <Card key={photo.id} className="border-border/30 shadow-sm">
                                    <CardContent className="p-3 flex items-center gap-3">
                                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-muted flex-shrink-0">
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
                                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                          photo.ai_analysis_results[0].health_status === 'healthy'
                                            ? "bg-primary/10 text-primary"
                                            : "bg-warning/10 text-warning"
                                        }`}>
                                          {photo.ai_analysis_results[0].health_status === 'healthy' ? "✓ स्वस्थ" : "⚠ ध्यान"}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full text-xs text-primary h-8"
                                  onClick={() => setHomeSubTab("history")}
                                >
                                  सबै हेर्नुहोस् <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                              </div>
                            ) : (
                              <Card className="border-dashed border-border/40 shadow-none">
                                <CardContent className="py-8 text-center">
                                  <History className="w-7 h-7 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-sm text-muted-foreground mb-3">अझै कुनै गतिविधि छैन</p>
                                  <Button
                                    size="sm"
                                    className="rounded-full text-xs px-5"
                                    onClick={() => setMainTab("scan")}
                                  >
                                    <Camera className="w-3.5 h-3.5 mr-1" />
                                    पहिलो स्क्यान गर्नुहोस्
                                  </Button>
                                </CardContent>
                              </Card>
                            )}
                          </section>

                          {/* More Tools */}
                          <section>
                            <h2 className="text-sm font-bold text-foreground mb-2.5 flex items-center gap-1.5">
                              <span className="text-base">🛠️</span> थप उपकरण
                            </h2>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { label: "खेती गाइड", icon: BookOpen, href: "/guides" },
                                { label: "विज्ञ सोध्नुहोस्", icon: MessageSquare, href: "/ask-expert" },
                                { label: "सिक्नुहोस्", icon: Sparkles, href: "/learning" },
                                { label: "उपचार", icon: Stethoscope, onClick: () => setHomeSubTab("treatments") },
                              ].map((item) => (
                                <Card
                                  key={item.label}
                                  className="border-border/30 cursor-pointer active:scale-[0.97] transition-transform shadow-sm"
                                  onClick={() => item.href ? navigate(item.href) : item.onClick?.()}
                                >
                                  <CardContent className="p-2.5 flex flex-col items-center text-center">
                                    <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center mb-1.5">
                                      <item.icon className="w-4.5 h-4.5 text-primary" />
                                    </div>
                                    <p className="text-[10px] font-medium text-foreground leading-tight">{item.label}</p>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </section>

                          <RadioModePanel />
                        </div>
                      )}

                      {/* PLOTS SUB-TAB */}
                      {homeSubTab === "plots" && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-foreground">{t('myPlots')}</h2>
                            <Dialog open={isAddPlotOpen} onOpenChange={setIsAddPlotOpen}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-full">
                                  <Plus className="w-4 h-4 mr-1" /> नयाँ Plot
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="rounded-2xl">
                                <DialogHeader>
                                  <DialogTitle>नयाँ Plot थप्नुहोस्</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <div>
                                    <Label>Plot Name</Label>
                                    <Input placeholder="e.g., North Field" value={newPlot.name} onChange={(e) => setNewPlot({ ...newPlot, name: e.target.value })} className="rounded-xl" />
                                  </div>
                                  <div>
                                    <Label>Crop Type</Label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-input bg-background" value={newPlot.cropType} onChange={(e) => setNewPlot({ ...newPlot, cropType: e.target.value as CropType })}>
                                      {cropTypes.map((crop) => (<option key={crop.value} value={crop.value}>{crop.label}</option>))}
                                    </select>
                                  </div>
                                  <div>
                                    <Label>Area (Hectares)</Label>
                                    <Input type="number" placeholder="e.g., 2.5" value={newPlot.area} onChange={(e) => setNewPlot({ ...newPlot, area: e.target.value })} className="rounded-xl" />
                                  </div>
                                  <Button className="w-full rounded-xl" onClick={handleCreatePlot} disabled={createPlot.isPending || !newPlot.name}>
                                    {createPlot.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Plot'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>

                          {plotsLoading ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
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
                                        plot.healthScore && plot.healthScore > 70 ? "bg-primary/10 text-primary" : plot.healthScore ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                                      }`}>
                                        {plot.healthScore ? plot.healthScore > 70 ? "स्वस्थ" : "ध्यान दिनुहोस्" : "डाटा छैन"}
                                      </div>
                                    </div>
                                    {plot.healthScore && (
                                      <div className="mb-3">
                                        <div className="flex justify-between text-xs mb-1">
                                          <span className="text-muted-foreground">Health</span>
                                          <span className="font-bold">{Math.round(plot.healthScore)}%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full ${plot.healthScore > 70 ? "bg-primary" : "bg-warning"}`} style={{ width: `${plot.healthScore}%` }} />
                                        </div>
                                      </div>
                                    )}
                                    <Button size="sm" className="w-full rounded-xl text-xs" onClick={() => { setSelectedPlot(plot.id); setHomeSubTab("capture"); }}>
                                      <Camera className="w-3.5 h-3.5 mr-1" /> फोटो खिच्नुहोस्
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
                                <p className="text-muted-foreground text-center text-sm mb-4 max-w-xs">तपाईंको पहिलो Plot थप्नुहोस्</p>
                                <Button onClick={() => setIsAddPlotOpen(true)} className="rounded-full px-6" size="sm">
                                  <Plus className="w-4 h-4 mr-1" /> पहिलो Plot थप्नुहोस्
                                </Button>
                              </CardContent>
                            </Card>
                          )}
                          {fields.length > 0 && <SoilAdvisoryCard fields={fields} />}
                        </div>
                      )}

                      {/* CAPTURE SUB-TAB */}
                      {homeSubTab === "capture" && (
                        <div className="max-w-lg mx-auto space-y-5">
                          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Camera className="w-5 h-5 text-primary" /> बाली फोटो खिच्नुहोस्
                          </h2>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs">Plot छान्नुहोस्</Label>
                              <select className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground mt-1" value={selectedPlot} onChange={(e) => setSelectedPlot(e.target.value)}>
                                <option value="">Plot छान्नुहोस्...</option>
                                {plots?.map((plot) => (<option key={plot.id} value={plot.id}>{plot.plot_name} - {plot.crop_type}</option>))}
                              </select>
                            </div>
                            <div>
                              <Label className="text-xs">बिरुवाको चरण</Label>
                              <select className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground mt-1" value={selectedStage} onChange={(e) => setSelectedStage(e.target.value as CropStage)}>
                                {cropStages.map((stage) => (<option key={stage.value} value={stage.value}>{stage.label}</option>))}
                              </select>
                            </div>
                          </div>
                          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" capture="environment" className="hidden" />
                          <div
                            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${selectedPlot ? "border-primary/40 hover:border-primary bg-primary/5" : "border-border opacity-50 cursor-not-allowed"}`}
                            onClick={() => selectedPlot && fileInputRef.current?.click()}
                          >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                              {uploadPhoto.isPending ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> : <Upload className="w-8 h-8 text-primary" />}
                            </div>
                            <h3 className="text-base font-bold text-foreground mb-1">{uploadPhoto.isPending ? "अपलोड हुँदैछ..." : "फोटो खिच्नुहोस्"}</h3>
                            <p className="text-xs text-muted-foreground mb-4">{selectedPlot ? "GPS स्थान स्वतः रेकर्ड हुनेछ" : "कृपया पहिले Plot छान्नुहोस्"}</p>
                            <Button disabled={!selectedPlot || uploadPhoto.isPending} className="rounded-full px-5" size="sm">
                              <Camera className="w-4 h-4 mr-1" /> {uploadPhoto.isPending ? "प्रक्रियामा..." : "क्यामेरा खोल्नुहोस्"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* HISTORY SUB-TAB */}
                      {homeSubTab === "history" && (
                        <div className="space-y-4">
                          <h2 className="text-lg font-bold text-foreground">{t('history')}</h2>
                          {photosLoading ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                          ) : photos && photos.length > 0 ? (
                            <div className="space-y-2">
                              {photos.map((photo: any) => (
                                <Card key={photo.id} className="border-border/30">
                                  <CardContent className="p-3 flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                                      <img src={photo.image_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm text-foreground truncate">{photo.plots?.plot_name || 'Unknown Plot'}</h4>
                                      <p className="text-[11px] text-muted-foreground">{new Date(photo.captured_at).toLocaleDateString()} • {photo.capture_stage.replace('_', ' ')}</p>
                                    </div>
                                    {photo.ai_analysis_results?.[0] && (
                                      <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                        photo.ai_analysis_results[0].health_status === 'healthy' ? "bg-primary/10 text-primary" : photo.ai_analysis_results[0].health_status === 'pending' ? "bg-muted text-muted-foreground" : "bg-warning/10 text-warning"
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
                                <p className="text-muted-foreground text-center text-sm mb-3">बालीको फोटो खिच्न सुरु गर्नुहोस्</p>
                                <Button onClick={() => setHomeSubTab("capture")} className="rounded-full" size="sm">
                                  <Camera className="w-4 h-4 mr-1" /> फोटो खिच्नुहोस्
                                </Button>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}

                      {/* WEATHER SUB-TAB */}
                      {homeSubTab === "weather" && (
                        <div className="space-y-4"><WeatherPlantingAlerts /></div>
                      )}

                      {/* TREATMENTS SUB-TAB */}
                      {homeSubTab === "treatments" && (
                        <div className="space-y-4">
                          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-primary" /> उपचार क्यालेन्डर
                          </h2>
                          <TreatmentCalendar />
                        </div>
                      )}

                      {/* CALENDAR SUB-TAB */}
                      {homeSubTab === "calendar" && (
                        <div className="space-y-4"><CropCalendar /></div>
                      )}

                      {/* OFFLINE SUB-TAB */}
                      {homeSubTab === "offline" && (
                        <div className="space-y-4"><OfflineDataViewer /></div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* ===== SCAN TAB ===== */}
            {mainTab === "scan" && (
              <motion.div
                key="scan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="px-4 pt-4"
              >
                <OutbreakAlertsBanner />
                <div className="mt-4">
                  <NepaliDiseaseDetector />
                </div>
                <DiseasePrediction />
              </motion.div>
            )}

            {/* ===== AI CHAT TAB ===== */}
            {mainTab === "ai" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col"
                style={{ height: "calc(100vh - 56px - 60px)" }}
              >
                <OnScreenAssistant isFullScreen={true} inputRef={aiInputRef} />
              </motion.div>
            )}

            {/* ===== FARM TAB ===== */}
            {mainTab === "farm" && (
              <motion.div
                key="farm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <EmbeddedFieldsTab />
              </motion.div>
            )}

            {/* ===== PROFILE TAB ===== */}
            {mainTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <EmbeddedProfileTab />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <FarmerBottomNav activeTab={mainTab} onTabChange={handleMainTabChange} />
      </div>
    </>
  );
};

export default FarmerDashboard;
