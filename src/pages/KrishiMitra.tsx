import { Helmet } from "react-helmet-async";
import { useRef } from "react";
import Header from "@/components/layout/Header";
import { OnScreenAssistant } from "@/components/ai/OnScreenAssistant";

const KrishiMitra = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Helmet>
        <title>Krishi Mitra - AI Farming Assistant | Kisan Sathi</title>
        <meta
          name="description"
          content="Krishi Mitra is your AI-powered farming assistant. Get instant help with crop diseases, weather advisories, pest management, and personalized farming recommendations in Nepali, Hindi, and English."
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        {/* Full-screen AI Assistant Chat */}
        <main className="flex-1 flex flex-col">
          <OnScreenAssistant 
            isFullScreen={true} 
            inputRef={inputRef}
          />
        </main>
      </div>
    </>
  );
};

export default KrishiMitra;
