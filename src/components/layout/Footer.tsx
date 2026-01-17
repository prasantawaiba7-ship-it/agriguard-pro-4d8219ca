import { Leaf, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-background">कृषि मित्र</span>
            </Link>
            <p className="text-background/70 max-w-sm leading-relaxed">
              नेपाली किसानहरूको लागि AI-संचालित बाली निगरानी र रोग पहिचान प्रणाली।
              तपाईंको खेतीमा स्मार्ट साथी।
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-background">प्लेटफर्म</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/farmer"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  किसान पोर्टल
                </Link>
              </li>
              <li>
                <Link
                  to="/authority"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  प्राधिकरण ड्यासबोर्ड
                </Link>
              </li>
              <li>
                <Link
                  to="/krishi-mitra"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  कृषि मित्र AI
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-background">स्रोतहरू</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/disease-detection"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  रोग पहिचान
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  प्रयोगकर्ता गाइड
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  सम्पर्क सहायता
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <p className="text-sm text-background/60">
              © २०२४ कृषि मित्र। नेपाली किसानहरूको लागि बनाइएको।
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-background/60 hover:text-background">
                गोपनीयता नीति
              </a>
              <a href="#" className="text-sm text-background/60 hover:text-background">
                सेवाका सर्तहरू
              </a>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-background/50">
            <span>विकासकर्ता:</span>
            <Heart className="w-4 h-4 text-red-400 fill-red-400" />
            <span className="font-medium text-background/70">प्रशान्त वाइबा (Prashanta Waiba)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
