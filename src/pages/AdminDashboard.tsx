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
} from "lucide-react";
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

// Sample testimonials data
const defaultTestimonials = [
  {
    id: 1,
    name: "Ram Bahadur Tamang",
    location: "Sindhupalchok, Bagmati Province",
    crop: "Rice Farmer",
    quote: "कृषि मित्रले मेरो धानमा लागेको झुलसा रोग तुरुन्तै पत्ता लगायो।",
    rating: 5,
    active: true,
  },
  {
    id: 2,
    name: "Sita Devi Gurung",
    location: "Kaski, Gandaki Province",
    crop: "Vegetable Farmer",
    quote: "नेपालीमा प्रश्न सोध्न सक्नु धेरै सजिलो छ।",
    rating: 5,
    active: true,
  },
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

const AdminDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  
  const isLoading = authLoading || roleLoading;
  
  // Users state
  const [users, setUsers] = useState<FarmerProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeToday: 0,
    aiQueries: 0,
    voiceCalls: 0
  });
  
  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && !isAdmin()) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, isAdmin, navigate]);
  
  const [testimonials, setTestimonials] = useState(defaultTestimonials);
  const [languages, setLanguages] = useState(languageOptions);
  const [newTestimonial, setNewTestimonial] = useState({
    name: "",
    location: "",
    crop: "",
    quote: "",
    rating: 5,
  });

  // Settings states
  const [settings, setSettings] = useState({
    aiEnabled: true,
    voiceInputEnabled: true,
    textToSpeechEnabled: true,
    offlineModeEnabled: true,
    autoTranslate: true,
    notificationsEnabled: true,
  });

  // Fetch real user data
  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
      fetchStats();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('farmer_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch roles for all users
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

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
      // Get total users count
      const { count: userCount } = await supabase
        .from('farmer_profiles')
        .select('*', { count: 'exact', head: true });

      // Get AI chat count (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: chatCount } = await supabase
        .from('ai_chat_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      setStats({
        totalUsers: userCount || 0,
        activeToday: Math.floor((userCount || 0) * 0.3), // Estimate
        aiQueries: chatCount || 0,
        voiceCalls: Math.floor((chatCount || 0) * 0.15) // Estimate
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleAssignRole = async (userId: string, newRole: string) => {
    try {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing role
        await supabase
          .from('user_roles')
          .update({ role: newRole as any })
          .eq('user_id', userId);
      } else {
        // Insert new role
        await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole as any });
      }

      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
      toast.error("Failed to update role");
    }
  };

  const handleToggleLanguage = (code: string) => {
    setLanguages(prev =>
      prev.map(lang =>
        lang.code === code ? { ...lang, enabled: !lang.enabled } : lang
      )
    );
    toast.success("Language setting updated");
  };

  const handleDeleteTestimonial = (id: number) => {
    setTestimonials(prev => prev.filter(t => t.id !== id));
    toast.success("Testimonial deleted");
  };

  const handleToggleTestimonial = (id: number) => {
    setTestimonials(prev =>
      prev.map(t =>
        t.id === id ? { ...t, active: !t.active } : t
      )
    );
    toast.success("Testimonial visibility updated");
  };

  const handleAddTestimonial = () => {
    if (!newTestimonial.name || !newTestimonial.quote) {
      toast.error("Please fill in name and quote");
      return;
    }
    
    setTestimonials(prev => [
      ...prev,
      {
        id: Date.now(),
        ...newTestimonial,
        active: true,
      }
    ]);
    
    setNewTestimonial({
      name: "",
      location: "",
      crop: "",
      quote: "",
      rating: 5,
    });
    
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate('/farmer')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - CROPIC Nepal</title>
        <meta name="description" content="Manage CROPIC settings, languages, testimonials, and more." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                  <p className="text-muted-foreground">प्रशासन ड्यासबोर्ड</p>
                </div>
              </div>
            </motion.div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="flex flex-wrap w-full gap-1 h-auto p-2">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="disease" className="flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  <span className="hidden sm:inline">Disease</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  <span className="hidden sm:inline">Subscriptions</span>
                </TabsTrigger>
                <TabsTrigger value="plans" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">Plans</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="hidden sm:inline">Reports</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Content</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
                <TabsTrigger value="crops" className="flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  <span className="hidden sm:inline">बाली</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Activity</span>
                </TabsTrigger>
                <TabsTrigger value="officers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Officers</span>
                </TabsTrigger>
                <TabsTrigger value="treatments" className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">उपचार</span>
                </TabsTrigger>
                <TabsTrigger value="guides" className="flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  <span className="hidden sm:inline">Guides</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Total Users", value: stats.totalUsers.toString(), icon: Users, color: "bg-primary" },
                    { label: "Active Languages", value: languages.filter(l => l.enabled).length.toString(), icon: Languages, color: "bg-blue-500" },
                    { label: "AI Queries (24h)", value: stats.aiQueries.toString(), icon: MessageSquare, color: "bg-green-500" },
                    { label: "Voice Calls (24h)", value: stats.voiceCalls.toString(), icon: Phone, color: "bg-purple-500" },
                  ].map((stat, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                            <stat.icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Voice AI Status
                      </CardTitle>
                      <CardDescription>Real-time voice assistant powered by OpenAI</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-success/10 border border-success/20">
                          <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
                            <div>
                              <p className="font-medium text-foreground">Voice AI Active</p>
                              <p className="text-sm text-muted-foreground">GPT-4o Realtime API</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-success text-success">Online</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 mb-1">
                              <Mic className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Speech Recognition</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Whisper-1 Model</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 mb-1">
                              <Volume2 className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Voice Output</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Alloy Voice</p>
                          </div>
                        </div>

                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Users can call the AI by clicking the floating phone button
                          </p>
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent">
                            <Phone className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        System Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { name: "Database", status: "Healthy", color: "bg-success" },
                          { name: "AI Chat Service", status: "Running", color: "bg-success" },
                          { name: "Voice AI (Realtime)", status: "Active", color: "bg-success" },
                          { name: "Weather API", status: "Active", color: "bg-success" },
                          { name: "Disease Detection", status: "Operational", color: "bg-success" },
                        ].map((service) => (
                          <div key={service.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <span className="text-foreground">{service.name}</span>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${service.color}`} />
                              <span className="text-sm text-muted-foreground">{service.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Disease Analytics Tab */}
              <TabsContent value="disease">
                <DiseaseAnalyticsDashboard />
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users">
                <UserManagement />
              </TabsContent>

              {/* Subscriptions Tab */}
              <TabsContent value="subscriptions">
                <SubscriptionAnalytics />
              </TabsContent>

              {/* Plans Tab */}
              <TabsContent value="plans">
                <SubscriptionPlansManager />
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports">
                <PdfReportsManager />
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content">
                <ContentBlocksManager />
              </TabsContent>

              {/* Email Tab */}
              <TabsContent value="email">
                <EmailSettingsManager />
              </TabsContent>

              {/* Voice AI Tab */}
              <TabsContent value="voice-ai">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Voice AI Configuration
                      </CardTitle>
                      <CardDescription>Configure the AI voice assistant</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-lg border border-success/20 bg-success/5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                            <Phone className="h-5 w-5 text-success" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">Voice Calling Active</h3>
                            <p className="text-sm text-muted-foreground">AI answers in real-time</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Users can speak with the AI assistant by clicking the floating phone button.
                          The AI understands Nepali and English, and responds with voice.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Features</h4>
                        {[
                          { icon: Mic, label: "Voice Recognition", desc: "Whisper-1 for speech-to-text" },
                          { icon: Volume2, label: "Voice Response", desc: "Natural AI voice output" },
                          { icon: MessageSquare, label: "Live Transcription", desc: "See what's being said" },
                        ].map((feature) => (
                          <div key={feature.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <feature.icon className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium text-sm">{feature.label}</p>
                              <p className="text-xs text-muted-foreground">{feature.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        How It Works
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary">1</span>
                          </div>
                          <div>
                            <h4 className="font-medium">User Clicks Phone Button</h4>
                            <p className="text-sm text-muted-foreground">Floating button appears on every page</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary">2</span>
                          </div>
                          <div>
                            <h4 className="font-medium">WebRTC Connection</h4>
                            <p className="text-sm text-muted-foreground">Real-time audio streaming to OpenAI</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary">3</span>
                          </div>
                          <div>
                            <h4 className="font-medium">AI Listens & Responds</h4>
                            <p className="text-sm text-muted-foreground">Speaks back in Nepali or English</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary">4</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Live Transcription</h4>
                            <p className="text-sm text-muted-foreground">User sees what AI is saying in real-time</p>
                          </div>
                        </div>

                        <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-primary" />
                            <h4 className="font-medium text-sm">Requirements</h4>
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

              {/* Settings Tab */}
              <TabsContent value="settings">
                <AppSettingsManager />
              </TabsContent>

              {/* Crops Tab */}
              <TabsContent value="crops">
                <CropManager />
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity">
                <ActivityLogsViewer />
              </TabsContent>

              <TabsContent value="officers">
                <OfficerManager />
              </TabsContent>

              {/* Treatments Tab */}
              <TabsContent value="treatments">
                <CropTreatmentManager />
              </TabsContent>

              {/* Crop Guides Tab */}
              <TabsContent value="guides">
                <CropGuidesManager />
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AdminDashboard;
