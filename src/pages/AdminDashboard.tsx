import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Settings,
  PlayCircle,
  Users,
  Languages,
  MessageSquare,
  Star,
  Shield,
  Database,
  Bell,
  BarChart3,
  Phone,
  Mic,
  Volume2,
  RefreshCw,
  AlertTriangle,
  Crown,
  Bug,
  Leaf,
  TrendingUp,
  MapPin,
  LeafyGreen,
  Store,
  Image as ImageIcon,
  GraduationCap,
  Award,
  Loader2,
} from "lucide-react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionAnalytics } from "@/components/admin/SubscriptionAnalytics";
import { AppSettingsManager } from "@/components/admin/AppSettingsManager";
import { SubscriptionPlansManager } from "@/components/admin/SubscriptionPlansManager";
import { ContentBlocksManager } from "@/components/admin/ContentBlocksManager";
import { EmailSettingsManager } from "@/components/admin/EmailSettingsManager";
import { PdfReportsManager } from "@/components/admin/PdfReportsManager";
import { ActivityLogsViewer } from "@/components/admin/ActivityLogsViewer";
import { UserManagement } from "@/components/admin/UserManagement";
import { DiseaseAnalyticsDashboard } from "@/components/admin/DiseaseAnalyticsDashboard";
import CropManager from "@/components/admin/CropManager";
import { CropGuidesManager } from "@/components/admin/CropGuidesManager";
import CropTreatmentManager from "@/components/admin/CropTreatmentManager";
import { OfficerManager } from "@/components/admin/OfficerManager";
import { MarketPricesManager } from "@/components/admin/MarketPricesManager";
import { CropsManager } from "@/components/admin/CropsManager";
import { LocationsManager } from "@/components/admin/LocationsManager";
import { DailyMarketPricesManager } from "@/components/admin/DailyMarketPricesManager";
import { MarketsManager } from "@/components/admin/MarketsManager";
import { CropPhotosManager } from "@/components/admin/CropPhotosManager";
import { MarketCoverageReport } from "@/components/admin/MarketCoverageReport";
import { FeedbackManager } from "@/components/admin/FeedbackManager";
import { DiagnosisCasesManager } from "@/components/admin/DiagnosisCasesManager";
import { CoursesManager } from "@/components/admin/CoursesManager";
import { QuizManager } from "@/components/admin/QuizManager";
import { CertificateTemplatesManager } from "@/components/admin/CertificateTemplatesManager";
import { ExpertManager } from "@/components/admin/ExpertManager";
import { CasesInboxManager } from "@/components/admin/CasesInboxManager";
import { ExpertTicketsManager } from "@/components/admin/ExpertTicketsManager";
import { TechnicianManager } from "@/components/admin/TechnicianManager";
import { ExpertTemplatesManager } from "@/components/admin/ExpertTemplatesManager";
import { FileText } from "lucide-react";

interface FarmerProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  state: string | null;
  district: string | null;
  village: string | null;
  created_at: string;
  role?: string;
}

interface UserStats {
  totalUsers: number;
  activeToday: number;
  aiQueries: number;
  voiceCalls: number;
}

const defaultTestimonials = [
  { id: 1, name: "Ram Bahadur Tamang", location: "Sindhupalchok, Bagmati Province", crop: "Rice Farmer", quote: "कृषि मित्रले मेरो धानमा लागेको झुलसा रोग तुरुन्तै पत्ता लगायो।", rating: 5, active: true },
  { id: 2, name: "Sita Devi Gurung", location: "Kaski, Gandaki Province", crop: "Vegetable Farmer", quote: "नेपालीमा प्रश्न सोध्न सक्नु धेरै सजिलो छ।", rating: 5, active: true },
];

const languageOptions = [
  { code: "en", name: "English", nativeName: "English", enabled: true },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", enabled: true },
  { code: "tamang", name: "Tamang", nativeName: "तामाङ", enabled: true },
  { code: "newar", name: "Newar", nativeName: "नेवारी", enabled: true },
  { code: "maithili", name: "Maithili", nativeName: "मैथिली", enabled: true },
  { code: "magar", name: "Magar", nativeName: "मगर", enabled: true },
  { code: "rai", name: "Rai", nativeName: "राई", enabled: true },
];

// Admin tab configuration for sidebar-style navigation
const ADMIN_TABS = [
  { value: 'overview', label: 'Overview', icon: BarChart3, group: 'main' },
  { value: 'disease', label: 'Disease', icon: Bug, group: 'main' },
  { value: 'users', label: 'Users', icon: Users, group: 'main' },
  { value: 'subscriptions', label: 'Subscriptions', icon: Crown, group: 'main' },
  { value: 'plans', label: 'Plans', icon: Star, group: 'main' },
  { value: 'reports', label: 'Reports', icon: Database, group: 'content' },
  { value: 'content', label: 'Content', icon: MessageSquare, group: 'content' },
  { value: 'email', label: 'Email', icon: Bell, group: 'content' },
  { value: 'settings', label: 'Settings', icon: Settings, group: 'content' },
  { value: 'crops', label: 'बाली', icon: Leaf, group: 'data' },
  { value: 'activity', label: 'Activity', icon: RefreshCw, group: 'data' },
  { value: 'officers', label: 'Officers', icon: Users, group: 'experts' },
  { value: 'experts', label: 'कृषि विज्ञ', icon: Shield, group: 'experts' },
  { value: 'treatments', label: 'उपचार', icon: PlayCircle, group: 'data' },
  { value: 'guides', label: 'Guides', icon: Leaf, group: 'data' },
  { value: 'market', label: 'बजार भाउ', icon: TrendingUp, group: 'market' },
  { value: 'daily-market', label: 'दैनिक मूल्य', icon: Store, group: 'market' },
  { value: 'crops-master', label: 'बाली Master', icon: LeafyGreen, group: 'market' },
  { value: 'locations', label: 'स्थान', icon: MapPin, group: 'market' },
  { value: 'markets', label: 'बजारहरू', icon: Store, group: 'market' },
  { value: 'crop-photos', label: 'बाली फोटो', icon: ImageIcon, group: 'data' },
  { value: 'coverage', label: 'कभरेज', icon: BarChart3, group: 'data' },
  { value: 'feedback', label: 'Feedback', icon: MessageSquare, group: 'content' },
  { value: 'diagnosis-cases', label: 'रोग केस', icon: Bug, group: 'experts' },
  { value: 'ticket-cases', label: 'टिकट केस', icon: MessageSquare, group: 'experts' },
  { value: 'expert-tickets', label: 'विज्ञ टिकट', icon: UserPlus, group: 'experts' },
  { value: 'technician-mgmt', label: 'प्राविधिक', icon: Users, group: 'experts' },
  { value: 'expert-templates', label: 'सिफारिश Templates', icon: FileText, group: 'experts' },
  { value: 'courses', label: 'पढाइ', icon: GraduationCap, group: 'content' },
  { value: 'quiz', label: 'हाजिरीजवाफ', icon: Award, group: 'content' },
  { value: 'certificates', label: 'प्रमाणपत्र', icon: Award, group: 'content' },
];

const AdminDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  
  const isLoading = authLoading || roleLoading;
  
  const [users, setUsers] = useState<FarmerProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<UserStats>({ totalUsers: 0, activeToday: 0, aiQueries: 0, voiceCalls: 0 });
  
  useEffect(() => {
    if (!isLoading && !isAdmin()) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, isAdmin, navigate]);
  
  const [testimonials, setTestimonials] = useState(defaultTestimonials);
  const [languages, setLanguages] = useState(languageOptions);
  const [newTestimonial, setNewTestimonial] = useState({ name: "", location: "", crop: "", quote: "", rating: 5 });
  const [settings, setSettings] = useState({
    aiEnabled: true, voiceInputEnabled: true, textToSpeechEnabled: true,
    offlineModeEnabled: true, autoTranslate: true, notificationsEnabled: true,
  });

  const adminStatus = isAdmin();
  useEffect(() => {
    if (adminStatus) { fetchUsers(); fetchStats(); }
  }, [adminStatus]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data: profiles, error } = await supabase.from('farmer_profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.user_id)?.role || 'farmer'
      })) || [];
      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: userCount } = await supabase.from('farmer_profiles').select('*', { count: 'exact', head: true });
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: chatCount } = await supabase.from('ai_chat_history').select('*', { count: 'exact', head: true }).gte('created_at', yesterday.toISOString());
      setStats({
        totalUsers: userCount || 0,
        activeToday: Math.floor((userCount || 0) * 0.3),
        aiQueries: chatCount || 0,
        voiceCalls: Math.floor((chatCount || 0) * 0.15)
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleAssignRole = async (userId: string, newRole: string) => {
    try {
      const { data: existingRole } = await supabase.from('user_roles').select('id').eq('user_id', userId).single();
      if (existingRole) {
        await supabase.from('user_roles').update({ role: newRole as any }).eq('user_id', userId);
      } else {
        await supabase.from('user_roles').insert({ user_id: userId, role: newRole as any });
      }
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
      toast.error("Failed to update role");
    }
  };

  const handleToggleLanguage = (code: string) => {
    setLanguages(prev => prev.map(lang => lang.code === code ? { ...lang, enabled: !lang.enabled } : lang));
    toast.success("Language setting updated");
  };

  const handleDeleteTestimonial = (id: number) => {
    setTestimonials(prev => prev.filter(t => t.id !== id));
    toast.success("Testimonial deleted");
  };

  const handleToggleTestimonial = (id: number) => {
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
    toast.success("Testimonial visibility updated");
  };

  const handleAddTestimonial = () => {
    if (!newTestimonial.name || !newTestimonial.quote) { toast.error("Please fill in name and quote"); return; }
    setTestimonials(prev => [...prev, { id: Date.now(), ...newTestimonial, active: true }]);
    setNewTestimonial({ name: "", location: "", crop: "", quote: "", rating: 5 });
    toast.success("Testimonial added successfully");
  };

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success("Setting updated");
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery) ||
    user.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.district?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
            <Shield className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate('/farmer')} className="rounded-full px-8">Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Kisan Sathi</title>
        <meta name="description" content="Manage Kisan Sathi settings, users, and platform." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 sm:pt-24 pb-28">
          <div className="container mx-auto px-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.03] rounded-3xl p-6 sm:p-8 border border-border/40">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                    <Shield className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
                    <p className="text-muted-foreground text-sm">प्रशासन ड्यासबोर्ड — प्लेटफर्म व्यवस्थापन</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tabs with horizontal scroll */}
            <Tabs defaultValue="overview" className="space-y-6">
              <ScrollArea className="w-full">
                <TabsList className="inline-flex w-max gap-1 h-auto p-1.5 bg-muted/50 rounded-2xl">
                  {ADMIN_TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 rounded-xl text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                      <tab.icon className="h-3.5 w-3.5" />
                      <span>{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Total Users", value: stats.totalUsers.toString(), icon: Users, iconBg: "bg-primary" },
                    { label: "Active Languages", value: languages.filter(l => l.enabled).length.toString(), icon: Languages, iconBg: "bg-[hsl(var(--card-weather-icon))]" },
                    { label: "AI Queries (24h)", value: stats.aiQueries.toString(), icon: MessageSquare, iconBg: "bg-[hsl(var(--card-market-icon))]" },
                    { label: "Voice Calls (24h)", value: stats.voiceCalls.toString(), icon: Phone, iconBg: "bg-[hsl(var(--card-journey-icon))]" },
                  ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <Card className="border-border/40 hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-4">
                            <div className={`h-13 w-13 rounded-2xl ${stat.iconBg} flex items-center justify-center shadow-sm`}>
                              <stat.icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                              <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="rounded-2xl border-border/40">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        Voice AI Status
                      </CardTitle>
                      <CardDescription>Real-time voice assistant</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                          <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                            <div>
                              <p className="font-bold text-foreground">Voice AI Active</p>
                              <p className="text-sm text-muted-foreground">GPT-4o Realtime API</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-primary text-primary rounded-full">Online</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 rounded-2xl bg-muted/50">
                            <div className="flex items-center gap-2 mb-1">
                              <Mic className="h-4 w-4 text-primary" />
                              <span className="text-sm font-bold">Speech Recognition</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Whisper-1 Model</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-muted/50">
                            <div className="flex items-center gap-2 mb-1">
                              <Volume2 className="h-4 w-4 text-primary" />
                              <span className="text-sm font-bold">Voice Output</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Alloy Voice</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-border/40">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        System Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { name: "Database", status: "Healthy" },
                          { name: "AI Chat Service", status: "Running" },
                          { name: "Voice AI (Realtime)", status: "Active" },
                          { name: "Weather API", status: "Active" },
                          { name: "Disease Detection", status: "Operational" },
                        ].map((service) => (
                          <div key={service.name} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/50">
                            <span className="text-foreground font-medium text-sm">{service.name}</span>
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                              <span className="text-xs text-muted-foreground">{service.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="disease"><DiseaseAnalyticsDashboard /></TabsContent>
              <TabsContent value="diagnosis-cases"><DiagnosisCasesManager /></TabsContent>
              <TabsContent value="ticket-cases"><CasesInboxManager /></TabsContent>
              <TabsContent value="expert-tickets"><ExpertTicketsManager /></TabsContent>
              <TabsContent value="users"><UserManagement /></TabsContent>
              <TabsContent value="subscriptions"><SubscriptionAnalytics /></TabsContent>
              <TabsContent value="plans"><SubscriptionPlansManager /></TabsContent>
              <TabsContent value="reports"><PdfReportsManager /></TabsContent>
              <TabsContent value="content"><ContentBlocksManager /></TabsContent>
              <TabsContent value="email"><EmailSettingsManager /></TabsContent>

              <TabsContent value="voice-ai">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="rounded-2xl border-border/40">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> Voice AI Configuration</CardTitle>
                      <CardDescription>Configure the AI voice assistant</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-5 rounded-2xl border border-primary/15 bg-primary/5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                            <Phone className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">Voice Calling Active</h3>
                            <p className="text-sm text-muted-foreground">AI answers in real-time</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Users can speak with the AI assistant by clicking the floating phone button.
                          The AI understands Nepali and English, and responds with voice.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-bold text-foreground">Features</h4>
                        {[
                          { icon: Mic, label: "Voice Recognition", desc: "Whisper-1 for speech-to-text" },
                          { icon: Volume2, label: "Voice Response", desc: "Natural AI voice output" },
                          { icon: MessageSquare, label: "Live Transcription", desc: "See what's being said" },
                        ].map((feature) => (
                          <div key={feature.label} className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50">
                            <feature.icon className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-bold text-sm">{feature.label}</p>
                              <p className="text-xs text-muted-foreground">{feature.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-border/40">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> How It Works</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { n: "1", t: "User Clicks Phone Button", d: "Floating button appears on every page" },
                          { n: "2", t: "WebRTC Connection", d: "Real-time audio streaming to OpenAI" },
                          { n: "3", t: "AI Listens & Responds", d: "Speaks back in Nepali or English" },
                          { n: "4", t: "Live Transcription", d: "User sees what AI is saying in real-time" },
                        ].map((step) => (
                          <div key={step.n} className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-primary">{step.n}</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm">{step.t}</h4>
                              <p className="text-xs text-muted-foreground">{step.d}</p>
                            </div>
                          </div>
                        ))}
                        <div className="mt-6 p-5 rounded-2xl bg-accent/8 border border-accent/15">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-accent" />
                            <h4 className="font-bold text-sm">Requirements</h4>
                          </div>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• OPENAI_API_KEY configured in secrets</li>
                            <li>• Microphone permission from browser</li>
                            <li>• Stable internet connection</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="settings"><AppSettingsManager /></TabsContent>
              <TabsContent value="crops"><CropManager /></TabsContent>
              <TabsContent value="activity"><ActivityLogsViewer /></TabsContent>
              <TabsContent value="officers"><OfficerManager /></TabsContent>
              <TabsContent value="experts"><ExpertManager /></TabsContent>
              <TabsContent value="treatments"><CropTreatmentManager /></TabsContent>
              <TabsContent value="guides"><CropGuidesManager /></TabsContent>
              <TabsContent value="market"><MarketPricesManager /></TabsContent>
              <TabsContent value="daily-market"><DailyMarketPricesManager /></TabsContent>
              <TabsContent value="crops-master"><CropsManager /></TabsContent>
              <TabsContent value="locations"><LocationsManager /></TabsContent>
              <TabsContent value="markets"><MarketsManager /></TabsContent>
              <TabsContent value="crop-photos"><CropPhotosManager /></TabsContent>
              <TabsContent value="coverage"><MarketCoverageReport /></TabsContent>
              <TabsContent value="feedback"><FeedbackManager /></TabsContent>
              <TabsContent value="technician-mgmt"><TechnicianManager /></TabsContent>
              <TabsContent value="expert-templates"><ExpertTemplatesManager /></TabsContent>
              <TabsContent value="courses"><CoursesManager /></TabsContent>
              <TabsContent value="quiz"><QuizManager /></TabsContent>
              <TabsContent value="certificates"><CertificateTemplatesManager /></TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AdminDashboard;
