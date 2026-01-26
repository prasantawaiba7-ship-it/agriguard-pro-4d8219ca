import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { OnScreenAssistant } from "@/components/ai/OnScreenAssistant";
import { UserBar } from "@/components/layout/UserBar";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import FarmerDashboard from "./pages/FarmerDashboard";

import AdminDashboard from "./pages/AdminDashboard";
import ProfileSettings from "./pages/ProfileSettings";
import KrishiMitra from "./pages/KrishiMitra";
import KrishiMitraDevice from "./pages/KrishiMitraDevice";
import DeviceSettings from "./pages/DeviceSettings";
import InstallPage from "./pages/InstallPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import DiseaseDetection from "./pages/DiseaseDetection";
import ExpertDirectory from "./pages/ExpertDirectory";
import TreatmentLibrary from "./pages/TreatmentLibrary";
import MarketPage from "./pages/MarketPage";
import CropGuidesPage from "./pages/CropGuidesPage";
import CropActivitiesPage from "./pages/CropActivitiesPage";
import FieldsPage from "./pages/FieldsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/farmer" element={<FarmerDashboard />} />
                <Route path="/farmer/profile" element={<ProfileSettings />} />
                <Route path="/krishi-mitra" element={<KrishiMitra />} />
                <Route path="/device" element={<KrishiMitraDevice />} />
                <Route path="/device/settings" element={<DeviceSettings />} />
                <Route path="/install" element={<InstallPage />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/cancelled" element={<PaymentCancelled />} />
                
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/disease-detection" element={<DiseaseDetection />} />
                <Route path="/expert-directory" element={<ExpertDirectory />} />
                <Route path="/treatment-library" element={<TreatmentLibrary />} />
                <Route path="/market" element={<MarketPage />} />
                <Route path="/guides" element={<CropGuidesPage />} />
                <Route path="/activities" element={<CropActivitiesPage />} />
                <Route path="/fields" element={<FieldsPage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <OnScreenAssistant />
              <UserBar />
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
