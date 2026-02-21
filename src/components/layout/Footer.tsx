import { Leaf, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-card border-t border-border/40 py-10 sm:py-14">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Leaf className="w-4.5 h-4.5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">{t('kisanSathi')}</span>
            </Link>
            <p className="text-muted-foreground max-w-sm leading-relaxed text-sm">
              {t('footerDescription')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground text-sm">{t('platform')}</h4>
            <ul className="space-y-2">
              {[
                { to: "/farmer", label: t('farmerPortal') },
                { to: "/market", label: t('krishiBazar') },
                { to: "/krishi-mitra", label: t('kisanSathiAI') },
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
            <h4 className="font-semibold mb-3 text-foreground text-sm">{t('resources')}</h4>
            <ul className="space-y-2">
              {[
                { to: "/disease-detection", label: t('diseaseDetection') },
                { to: "/guides", label: t('farmingGuide') || 'Crop Guides' },
                { to: "/expert-directory", label: t('contactSupport') },
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

        <div className="border-t border-border/30 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
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
