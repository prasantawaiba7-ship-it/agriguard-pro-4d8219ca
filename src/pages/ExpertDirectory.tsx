import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AgriculturalOfficerDirectory } from '@/components/directory/AgriculturalOfficerDirectory';
import { FloatingVoiceButton } from '@/components/ai/FloatingVoiceButton';
import { useLanguage } from '@/hooks/useLanguage';

export default function ExpertDirectory() {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t('expertDirectory')} | Kisan Sathi</title>
        <meta name="description" content={t('expertDirectorySubtitle')} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 pt-20 sm:pt-24 pb-28 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              👨‍🌾 {t('expertDirectory')}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('expertDirectorySubtitle')}
            </p>
          </div>

          <AgriculturalOfficerDirectory />

          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-muted/50 rounded-2xl">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {t('beforeContactTitle')}
              </h2>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>{t('beforeContact1')}</li>
                <li>{t('beforeContact2')}</li>
                <li>{t('beforeContact3')}</li>
                <li>{t('beforeContact4')}</li>
              </ul>
            </div>

            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {t('nearestOfficeTitle')}
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                {t('nearestOfficeDesc')}
              </p>
              <div className="p-3 bg-background rounded-lg text-sm">
                <p className="font-medium">{t('nationalHelpline')}</p>
                <p className="text-primary font-semibold text-lg">📞 1618</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {t('officeHours')}
                </p>
              </div>
            </div>
          </div>
        </main>

        <Footer />
        <FloatingVoiceButton />
      </div>
    </>
  );
}