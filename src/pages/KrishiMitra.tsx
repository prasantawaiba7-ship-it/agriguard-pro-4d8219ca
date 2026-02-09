import { Helmet } from "react-helmet-async";
import { useRef } from "react";
import Header from "@/components/layout/Header";
import { OnScreenAssistant } from "@/components/ai/OnScreenAssistant";
import { useLanguage } from "@/hooks/useLanguage";

const KrishiMitra = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t('krishiMitraTitle')} | Kisan Sathi</title>
        <meta name="description" content={t('krishiMitraDesc')} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1 flex flex-col pt-16 sm:pt-20">
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