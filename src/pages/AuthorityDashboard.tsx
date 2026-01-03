import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Helmet } from "react-helmet-async";
import {
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
  Filter,
  Search,
  Eye,
  TrendingDown,
  Leaf,
} from "lucide-react";

// Nepal-focused mock data
const mockSubmissions = [
  {
    id: "SUB-2024-001",
    farmer: "Ram Bahadur Tamang",
    farmerId: "FRM-78542",
    village: "Chautara",
    district: "Sindhupalchok",
    province: "Bagmati Province",
    crop: "Rice",
    date: "2024-01-10",
    status: "damage_detected",
    damageType: "Waterlogging",
    severity: "High",
    coordinates: { lat: 27.7857, lng: 85.7136 },
  },
  {
    id: "SUB-2024-002",
    farmer: "Sita Devi Gurung",
    farmerId: "FRM-45231",
    village: "Pokhara-17",
    district: "Kaski",
    province: "Gandaki Province",
    crop: "Vegetables",
    date: "2024-01-10",
    status: "healthy",
    damageType: null,
    severity: null,
    coordinates: { lat: 28.2096, lng: 83.9856 },
  },
  {
    id: "SUB-2024-003",
    farmer: "Hari Prasad Yadav",
    farmerId: "FRM-91837",
    village: "Janakpur-5",
    district: "Dhanusha",
    province: "Madhesh Province",
    crop: "Wheat",
    date: "2024-01-09",
    status: "pending",
    damageType: null,
    severity: null,
    coordinates: { lat: 26.7288, lng: 85.9220 },
  },
  {
    id: "SUB-2024-004",
    farmer: "Dawa Sherpa",
    farmerId: "FRM-34821",
    village: "Namche",
    district: "Solukhumbu",
    province: "Koshi Province",
    crop: "Potato",
    date: "2024-01-09",
    status: "damage_detected",
    damageType: "Frost Damage",
    severity: "Medium",
    coordinates: { lat: 27.8069, lng: 86.7140 },
  },
  {
    id: "SUB-2024-005",
    farmer: "Kamala Tharu",
    farmerId: "FRM-56234",
    village: "Gulariya",
    district: "Bardiya",
    province: "Lumbini Province",
    crop: "Sugarcane",
    date: "2024-01-08",
    status: "healthy",
    damageType: null,
    severity: null,
    coordinates: { lat: 28.2144, lng: 81.3467 },
  },
];

const provinceStats = [
  { name: "Koshi Province", nepaliName: "कोशी प्रदेश", plots: 1245, alerts: 23, healthy: 89 },
  { name: "Madhesh Province", nepaliName: "मधेश प्रदेश", plots: 1892, alerts: 35, healthy: 82 },
  { name: "Bagmati Province", nepaliName: "बागमती प्रदेश", plots: 1567, alerts: 45, healthy: 78 },
  { name: "Gandaki Province", nepaliName: "गण्डकी प्रदेश", plots: 892, alerts: 15, healthy: 92 },
  { name: "Lumbini Province", nepaliName: "लुम्बिनी प्रदेश", plots: 1734, alerts: 28, healthy: 85 },
  { name: "Karnali Province", nepaliName: "कर्णाली प्रदेश", plots: 534, alerts: 8, healthy: 95 },
  { name: "Sudurpashchim Province", nepaliName: "सुदूरपश्चिम प्रदेश", plots: 678, alerts: 12, healthy: 91 },
];

const AuthorityDashboard = () => {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "alerts" | "healthy" | "pending">("all");

  const filteredSubmissions = mockSubmissions.filter((sub) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "alerts") return sub.status === "damage_detected";
    if (selectedFilter === "healthy") return sub.status === "healthy";
    if (selectedFilter === "pending") return sub.status === "pending";
    return true;
  });

  const totalPlots = provinceStats.reduce((acc, p) => acc + p.plots, 0);
  const totalAlerts = provinceStats.reduce((acc, p) => acc + p.alerts, 0);

  return (
    <>
      <Helmet>
        <title>Authority Dashboard - CROPIC Nepal</title>
        <meta name="description" content="Monitor crop health submissions, view alerts, and manage insurance claims across Nepal's 7 provinces with CROPIC's authority dashboard." />
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
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Authority Dashboard
                  </h1>
                  <p className="text-muted-foreground">
                    कृषि विभाग | नेपाल सरकार
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">
                    <Download className="w-4 h-4" />
                    Export Report
                  </Button>
                  <Button>
                    <FileText className="w-4 h-4" />
                    Generate CCE List
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Users, label: "Total Farmers", value: "12,438", trend: "+12%", color: "bg-primary" },
                { icon: Leaf, label: "Active Plots", value: totalPlots.toLocaleString(), trend: "+8%", color: "bg-success" },
                { icon: AlertTriangle, label: "Damage Alerts", value: totalAlerts.toString(), trend: "-5%", trendDown: true, color: "bg-warning" },
                { icon: CheckCircle2, label: "Claims Processed", value: "534", trend: "+23%", color: "bg-secondary" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                          <stat.icon className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className={`text-xs font-medium flex items-center gap-1 ${stat.trendDown ? "text-success" : "text-success"}`}>
                          {stat.trendDown ? <TrendingDown className="w-3 h-3" /> : null}
                          {stat.trend}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Map Section */}
              <div className="lg:col-span-2">
                <Card className="border-border/50 h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Nepal Map View
                      </CardTitle>
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4" />
                        Filter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Placeholder Map */}
                    <div className="aspect-[16/10] rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="w-12 h-12 text-primary/30 mx-auto mb-3" />
                          <p className="text-muted-foreground text-sm">
                            Interactive map will load here
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Showing plots from all 7 provinces of Nepal
                          </p>
                        </div>
                      </div>
                      {/* Mock plot markers */}
                      {mockSubmissions.map((sub, i) => (
                        <div
                          key={sub.id}
                          className={`absolute w-4 h-4 rounded-full border-2 border-card shadow-md ${
                            sub.status === "damage_detected"
                              ? "bg-warning"
                              : sub.status === "healthy"
                              ? "bg-success"
                              : "bg-muted-foreground"
                          }`}
                          style={{
                            left: `${20 + i * 15}%`,
                            top: `${30 + (i % 3) * 20}%`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-success" />
                        <span className="text-muted-foreground">Healthy</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-warning" />
                        <span className="text-muted-foreground">Damage Alert</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                        <span className="text-muted-foreground">Pending Analysis</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Province Stats */}
              <div>
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Province Overview (प्रदेश)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                    {provinceStats.map((province) => (
                      <div
                        key={province.name}
                        className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-foreground text-sm">{province.name}</span>
                            <p className="text-xs text-muted-foreground">{province.nepaliName}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{province.plots} plots</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm">
                            <CheckCircle2 className="w-3 h-3 text-success" />
                            <span className="text-muted-foreground">{province.healthy}%</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <AlertTriangle className="w-3 h-3 text-warning" />
                            <span className="text-muted-foreground">{province.alerts}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Submissions */}
            <Card className="border-border/50 mt-6">
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle>Recent Submissions</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search farmer or village..."
                        className="h-9 pl-9 pr-4 rounded-lg border border-input bg-background text-sm"
                      />
                    </div>
                    <div className="flex rounded-lg border border-input overflow-hidden">
                      {(["all", "alerts", "healthy", "pending"] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setSelectedFilter(filter)}
                          className={`px-3 py-2 text-xs font-medium transition-colors ${
                            selectedFilter === filter
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Farmer</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Location</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Province</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Crop</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map((sub) => (
                        <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 px-4 text-sm font-mono text-muted-foreground">{sub.id}</td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium text-foreground">{sub.farmer}</div>
                            <div className="text-xs text-muted-foreground">{sub.farmerId}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-foreground">{sub.village}</div>
                            <div className="text-xs text-muted-foreground">{sub.district}</div>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{sub.province}</td>
                          <td className="py-3 px-4 text-sm text-foreground">{sub.crop}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{sub.date}</td>
                          <td className="py-3 px-4">
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                sub.status === "damage_detected"
                                  ? "bg-warning/10 text-warning"
                                  : sub.status === "healthy"
                                  ? "bg-success/10 text-success"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {sub.status === "damage_detected" && <AlertTriangle className="w-3 h-3" />}
                              {sub.status === "healthy" && <CheckCircle2 className="w-3 h-3" />}
                              {sub.status === "damage_detected"
                                ? `${sub.damageType} (${sub.severity})`
                                : sub.status === "healthy"
                                ? "Healthy"
                                : "Pending"}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AuthorityDashboard;
