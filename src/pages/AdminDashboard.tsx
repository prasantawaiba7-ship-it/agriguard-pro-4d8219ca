import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  Settings,
  Users,
  Languages,
  MessageSquare,
  Star,
  Shield,
  Database,
  Bell,
  Trash2,
  Plus,
  Edit,
  Save,
  MapPin,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

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
  
  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && !isAdmin()) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, isAdmin, navigate]);
  
  const [testimonials, setTestimonials] = useState(defaultTestimonials);
  const [languages, setLanguages] = useState(languageOptions);
  const [editingTestimonial, setEditingTestimonial] = useState<number | null>(null);
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
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
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
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 h-auto p-2">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="testimonials" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Testimonials</span>
                </TabsTrigger>
                <TabsTrigger value="languages" className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  <span className="hidden sm:inline">Languages</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Total Users", value: "12,438", icon: Users, color: "bg-primary" },
                    { label: "Active Languages", value: languages.filter(l => l.enabled).length.toString(), icon: Languages, color: "bg-blue-500" },
                    { label: "Testimonials", value: testimonials.filter(t => t.active).length.toString(), icon: Star, color: "bg-yellow-500" },
                    { label: "AI Queries Today", value: "2,341", icon: MessageSquare, color: "bg-green-500" },
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
                        <MapPin className="h-5 w-5" />
                        Province Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { name: "Koshi Province", users: 1823, percentage: 15 },
                          { name: "Madhesh Province", users: 2456, percentage: 20 },
                          { name: "Bagmati Province", users: 3102, percentage: 25 },
                          { name: "Gandaki Province", users: 1543, percentage: 12 },
                          { name: "Lumbini Province", users: 2187, percentage: 18 },
                          { name: "Karnali Province", users: 621, percentage: 5 },
                          { name: "Sudurpashchim Province", users: 706, percentage: 5 },
                        ].map((province) => (
                          <div key={province.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground">{province.name}</span>
                              <span className="text-muted-foreground">{province.users} users</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${province.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
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
                          { name: "Database", status: "Healthy", color: "bg-green-500" },
                          { name: "AI Service", status: "Running", color: "bg-green-500" },
                          { name: "Weather API", status: "Active", color: "bg-green-500" },
                          { name: "Image Processing", status: "Operational", color: "bg-green-500" },
                          { name: "Voice Recognition", status: "Active", color: "bg-green-500" },
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

              {/* Testimonials Tab */}
              <TabsContent value="testimonials">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Add New Testimonial */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Add New Testimonial
                      </CardTitle>
                      <CardDescription>Add a new farmer testimonial to display on the website</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Farmer Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Ram Bahadur Tamang"
                          value={newTestimonial.name}
                          onChange={(e) => setNewTestimonial(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location (District, Province)</Label>
                        <Input
                          id="location"
                          placeholder="e.g., Sindhupalchok, Bagmati Province"
                          value={newTestimonial.location}
                          onChange={(e) => setNewTestimonial(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="crop">Farmer Type</Label>
                        <Input
                          id="crop"
                          placeholder="e.g., Rice Farmer"
                          value={newTestimonial.crop}
                          onChange={(e) => setNewTestimonial(prev => ({ ...prev, crop: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quote">Testimonial Quote (Nepali or English)</Label>
                        <Textarea
                          id="quote"
                          placeholder="Enter the farmer's testimonial..."
                          value={newTestimonial.quote}
                          onChange={(e) => setNewTestimonial(prev => ({ ...prev, quote: e.target.value }))}
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rating">Rating (1-5)</Label>
                        <Input
                          id="rating"
                          type="number"
                          min={1}
                          max={5}
                          value={newTestimonial.rating}
                          onChange={(e) => setNewTestimonial(prev => ({ ...prev, rating: parseInt(e.target.value) || 5 }))}
                        />
                      </div>
                      <Button onClick={handleAddTestimonial} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Testimonial
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Existing Testimonials */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Manage Testimonials
                      </CardTitle>
                      <CardDescription>Toggle visibility or delete existing testimonials</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-[500px] overflow-y-auto">
                        {testimonials.map((testimonial) => (
                          <div
                            key={testimonial.id}
                            className={`p-4 rounded-lg border ${testimonial.active ? 'bg-card' : 'bg-muted/50 opacity-60'}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                                <p className="text-xs text-muted-foreground">{testimonial.crop} • {testimonial.location}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={testimonial.active}
                                  onCheckedChange={() => handleToggleTestimonial(testimonial.id)}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteTestimonial(testimonial.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground italic">"{testimonial.quote}"</p>
                            <div className="flex gap-0.5 mt-2">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Languages Tab */}
              <TabsContent value="languages">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Languages className="h-5 w-5" />
                      Language Settings
                    </CardTitle>
                    <CardDescription>Enable or disable languages for the application</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {languages.map((lang) => (
                        <div
                          key={lang.code}
                          className={`p-4 rounded-lg border ${lang.enabled ? 'bg-card border-primary/20' : 'bg-muted/50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-foreground">{lang.name}</h4>
                              <p className="text-lg text-muted-foreground">{lang.nativeName}</p>
                            </div>
                            <Switch
                              checked={lang.enabled}
                              onCheckedChange={() => handleToggleLanguage(lang.code)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Feature Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { key: "aiEnabled", label: "AI Assistant", description: "Enable Krishi Mitra AI chatbot" },
                        { key: "voiceInputEnabled", label: "Voice Input", description: "Allow voice commands" },
                        { key: "textToSpeechEnabled", label: "Text to Speech", description: "Read responses aloud" },
                        { key: "offlineModeEnabled", label: "Offline Mode", description: "Cache data for offline use" },
                        { key: "autoTranslate", label: "Auto Translate", description: "Automatically translate AI responses" },
                      ].map((setting) => (
                        <div key={setting.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium text-foreground">{setting.label}</p>
                            <p className="text-sm text-muted-foreground">{setting.description}</p>
                          </div>
                          <Switch
                            checked={settings[setting.key as keyof typeof settings]}
                            onCheckedChange={(value) => handleSettingChange(setting.key, value)}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-foreground">Push Notifications</p>
                          <p className="text-sm text-muted-foreground">Send notifications to farmers</p>
                        </div>
                        <Switch
                          checked={settings.notificationsEnabled}
                          onCheckedChange={(value) => handleSettingChange("notificationsEnabled", value)}
                        />
                      </div>
                      <div className="p-4 rounded-lg border border-dashed border-border">
                        <p className="text-sm text-muted-foreground text-center">
                          More notification settings coming soon...
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Management
                    </CardTitle>
                    <CardDescription>View and manage user accounts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">User Management</h3>
                      <p className="text-muted-foreground mb-4">
                        View user statistics and manage user accounts from here.
                      </p>
                      <Button variant="outline">
                        View All Users
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
