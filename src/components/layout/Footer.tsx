import { Leaf, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-card border-t border-border/40 py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 mb-12">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">{t('kisanSathi')}</span>
            </Link>
            <p className="text-muted-foreground max-w-sm leading-relaxed text-sm">
              {t('footerDescription')}
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-foreground text-sm uppercase tracking-wider">{t('platform')}</h4>
            <ul className="space-y-3">
              {[
                { to: "/farmer", label: t('farmerPortal') },
                { to: "/market", label: t('krishiBazar') },
                { to: "/krishi-mitra", label: t('kisanSathiAI') },
                { to: "/action-film", label: "कृषि यात्रा" },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-foreground text-sm uppercase tracking-wider">{t('resources')}</h4>
            <ul className="space-y-3">
              {[
                { to: "/disease-detection", label: t('diseaseDetection') },
                { to: "/guides", label: t('farmingGuide') || 'Crop Guides' },
                { to: "/expert-directory", label: t('contactSupport') },
                { to: "/ask-expert", label: "प्राविधिकसँग सोध्नुहोस्" },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/30 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              {t('copyright')}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Powered by</span>
              <Heart className="w-3.5 h-3.5 text-destructive fill-current" />
              <span className="font-medium text-foreground/60">Pragati Tech</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
