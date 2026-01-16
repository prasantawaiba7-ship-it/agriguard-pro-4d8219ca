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
import { LanguageSelector } from "@/components/farmer/LanguageSelector";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { usePlots, useCropPhotos, useCreatePlot, useUploadPhoto, useDashboardStats } from "@/hooks/useFarmerData";
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
} from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"plots" | "capture" | "history" | "offline">("plots");
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
  const createPlot = useCreatePlot();
  const uploadPhoto = useUploadPhoto();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleCreatePlot = async () => {
    if (!newPlot.name) return;

    // Get current location
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
      latitude,
      longitude,
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

    // Get current location
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

    await uploadPhoto.mutateAsync({
      plotId: selectedPlot,
      file,
      stage: selectedStage,
      latitude,
      longitude,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Farmer Dashboard - CROPIC</title>
        <meta name="description" content="Manage your crop plots, capture photos, and track crop health with CROPIC's farmer dashboard." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 sm:mb-8"
            >
              <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate('/farmer/profile')}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">
                        🙏 {t('home')}, {profile?.full_name || 'Farmer'}
                      </h1>
                      <p className="text-muted-foreground text-xs sm:text-sm truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <LanguageSelector />
                    <Button variant="outline" size="sm" onClick={() => navigate('/farmer/profile')} className="flex-1 sm:flex-initial">
                      <User className="w-4 h-4" />
                      <span className="ml-2 hidden md:inline">Profile</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={signOut} className="flex-1 sm:flex-initial">
                      <LogOut className="w-4 h-4" />
                      <span className="ml-2 sm:hidden md:inline">Sign Out</span>
                    </Button>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {profile?.village && `${profile.village}, `}
                  {profile?.district && `${profile.district}, `}
                  {profile?.state || 'India'}
                </p>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {[
                { icon: Leaf, label: t('myPlots'), value: stats?.plots || 0, color: "bg-primary" },
                { icon: Camera, label: "Photos", value: stats?.photos || 0, color: "bg-secondary" },
                { icon: CheckCircle2, label: "Healthy", value: stats?.healthyCrops || 0, color: "bg-success" },
                { icon: AlertTriangle, label: "Alerts", value: stats?.alerts || 0, color: "bg-warning" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-border/50">
                    <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { id: "plots", label: t('myPlots'), icon: MapPin },
                { id: "capture", label: "Capture", icon: Camera },
                { id: "history", label: t('history'), icon: History },
                { id: "offline", label: "Offline", icon: WifiOff },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className="flex-shrink-0 gap-2"
                  size="sm"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "plots" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-foreground">{t('myPlots')}</h2>
                      <Dialog open={isAddPlotOpen} onOpenChange={setIsAddPlotOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4" />
                            Add Plot
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Plot</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label>Plot Name</Label>
                              <Input
                                placeholder="e.g., North Field"
                                value={newPlot.name}
                                onChange={(e) => setNewPlot({ ...newPlot, name: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Crop Type</Label>
                              <select
                                className="w-full h-10 px-3 rounded-md border border-input bg-background"
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
                              />
                            </div>
                            <Button
                              className="w-full"
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
                          <Card key={plot.id} className="border-border/50 hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{plot.plot_name}</CardTitle>
                                <div
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    plot.healthScore && plot.healthScore > 70
                                      ? "bg-success/10 text-success"
                                      : plot.healthScore
                                      ? "bg-warning/10 text-warning"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {plot.healthScore 
                                    ? plot.healthScore > 70 ? "Healthy" : "Needs Attention"
                                    : "No Data"}
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
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Health Score</span>
                                    <span className="font-medium text-foreground">{Math.round(plot.healthScore)}%</span>
                                  </div>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        plot.healthScore > 70 ? "bg-success" : "bg-warning"
                                      }`}
                                      style={{ width: `${plot.healthScore}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              <div className="pt-2">
                                <Button
                                  className="w-full"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPlot(plot.id);
                                    setActiveTab("capture");
                                  }}
                                >
                                  <Camera className="w-4 h-4" />
                                  Capture Now
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-dashed border-2">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
                          <h3 className="font-semibold text-lg mb-2">No plots yet</h3>
                          <p className="text-muted-foreground text-center mb-4">
                            Add your first plot to start monitoring your crops
                          </p>
                          <Button onClick={() => setIsAddPlotOpen(true)}>
                            <Plus className="w-4 h-4" />
                            Add Your First Plot
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {activeTab === "capture" && (
                  <div className="max-w-2xl mx-auto">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Camera className="w-5 h-5 text-primary" />
                          Capture Crop Photo
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label>Select Plot</Label>
                          <select
                            className="w-full h-11 px-3 rounded-lg border border-input bg-background text-foreground"
                            value={selectedPlot}
                            onChange={(e) => setSelectedPlot(e.target.value)}
                          >
                            <option value="">Choose a plot...</option>
                            {plots?.map((plot) => (
                              <option key={plot.id} value={plot.id}>
                                {plot.plot_name} - {plot.crop_type}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Growth Stage</Label>
                          <select
                            className="w-full h-11 px-3 rounded-lg border border-input bg-background text-foreground"
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
                          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
                            selectedPlot
                              ? "border-primary/50 hover:border-primary bg-primary/5"
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
                          <h3 className="text-lg font-medium text-foreground mb-2">
                            {uploadPhoto.isPending ? "Uploading..." : "Capture or Upload Photo"}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {selectedPlot
                              ? "Take a photo of your crop field. GPS location will be recorded automatically."
                              : "Please select a plot first"}
                          </p>
                          <Button variant="hero" disabled={!selectedPlot || uploadPhoto.isPending}>
                            <Camera className="w-4 h-4" />
                            {uploadPhoto.isPending ? "Processing..." : "Open Camera"}
                          </Button>
                        </div>

                        <div className="bg-muted/50 rounded-xl p-4">
                          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Photo Guidelines
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Hold phone at chest height, pointing towards crop</li>
                            <li>• Include at least 50% crop and 30% sky in frame</li>
                            <li>• Ensure good lighting (avoid harsh shadows)</li>
                            <li>• Stand at the edge of your plot boundary</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground">{t('history')}</h2>
                    
                    {photosLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : photos && photos.length > 0 ? (
                      <div className="space-y-3">
                        {photos.map((photo: any) => (
                          <Card key={photo.id} className="border-border/50">
                            <CardContent className="p-4 flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                                <img
                                  src={photo.image_url}
                                  alt="Crop photo"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground truncate">
                                  {photo.plots?.plot_name || 'Unknown Plot'}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(photo.captured_at).toLocaleDateString()} • {photo.capture_stage.replace('_', ' ')}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                {photo.ai_analysis_results?.[0] ? (
                                  <div
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                      photo.ai_analysis_results[0].health_status === 'healthy'
                                        ? "bg-success/10 text-success"
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
                                  <span className="text-sm text-muted-foreground">Pending analysis</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-dashed border-2">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <History className="w-12 h-12 text-muted-foreground mb-4" />
                          <h3 className="font-semibold text-lg mb-2">No photos yet</h3>
                          <p className="text-muted-foreground text-center mb-4">
                            Start capturing photos to track your crop health
                          </p>
                          <Button onClick={() => setActiveTab("capture")}>
                            <Camera className="w-4 h-4" />
                            Capture First Photo
                          </Button>
                        </CardContent>
                      </Card>
                    )}
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
        
        {/* Floating Krishi Mitra Bar */}
        <KrishiMitraBar />
      </div>
    </>
  );
};

export default FarmerDashboard;
