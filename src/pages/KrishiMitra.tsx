import { Helmet } from "react-helmet-async";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { OnScreenAssistant } from "@/components/ai/OnScreenAssistant";
import { FarmerBottomNav, type MainTab } from "@/components/layout/FarmerBottomNav";
import { useLanguage } from "@/hooks/useLanguage";

const KrishiMitra = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleTabChange = (tab: MainTab) => {
    // Navigate to farmer dashboard with the selected tab
    navigate(`/farmer?tab=${tab}`);
  };

  return (
    <>
      <Helmet>
        <title>{t('krishiMitraTitle')} | Kisan Sathi</title>
        <meta name="description" content={t('krishiMitraDesc')} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 flex flex-col">
          <OnScreenAssistant 
            isFullScreen={true} 
            inputRef={inputRef}
          />
        </main>
        <FarmerBottomNav activeTab="ai" onTabChange={handleTabChange} />
      </div>
    </>
  );
};

export default KrishiMitra;
