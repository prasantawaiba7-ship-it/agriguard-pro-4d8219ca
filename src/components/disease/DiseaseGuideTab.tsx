import { useState, useMemo } from 'react';
import { Leaf, Search, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import ReactMarkdown from 'react-markdown';

const CROP_OPTIONS = [
  "धान", "गहुँ", "मकै", "टमाटर", "बन्दा", "काउली", "ब्रोकाउली",
  "आलु", "खुर्सानी", "क्याप्सिकम", "प्याज", "लसुन", "काँक्रो",
  "फर्सी", "लौका", "गिलौरी", "करेला", "झिङ्गे", "भण्टा", "भिण्डी",
  "धनिया", "पालुङ्गो", "रायो साग", "कोदो", "जौ", "तोरी",
  "मसुरो", "केराउ", "राजमा", "भटमास", "चना",
  "आँप", "लिची", "केरा", "सुन्तला", "कागती", "स्याउ", "नासपाती", "अम्बा", "मेवा",
  "चिया", "कफी", "उखु", "अलैंची", "अदुवा", "बेसार",
  "Paddy", "Wheat", "Maize", "Tomato", "Potato", "Cabbage", "Cauliflower",
  "Chilli", "Onion", "Garlic", "Cucumber", "Pumpkin", "Banana", "Orange", "Apple",
  "Tea", "Coffee", "Sugarcane", "Cardamom", "Ginger", "Turmeric"
];

const normalizeText = (value: string) =>
  value.normalize("NFKD").toLowerCase().trim();

export function DiseaseGuideTab() {
  const { language } = useLanguage();
  const [cropName, setCropName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [guide, setGuide] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCrops = useMemo(() => {
    if (!cropName) return [];
    return CROP_OPTIONS.filter((c) =>
      normalizeText(c).includes(normalizeText(cropName))
    ).slice(0, 6);
  }, [cropName]);

  const fetchGuide = async (name: string) => {
    if (!name.trim()) return;
    setIsLoading(true);
    setError(null);
    setGuide(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disease-guide`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ crop_name: name.trim(), language }),
        }
      );

      if (!res.ok) throw new Error('Failed to fetch guide');
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setGuide(data.guide);
      }
    } catch {
      setError(language === 'ne'
        ? 'गाइड लोड गर्न सकिएन। पछि फेरि प्रयास गर्नुहोस्।'
        : 'Failed to load guide. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCrop = (name: string) => {
    setCropName(name);
    setShowSuggestions(false);
    fetchGuide(name);
  };

  return (
    <div className="mx-auto w-full">
      <div className="rounded-2xl border bg-card text-card-foreground shadow-sm">
        {/* Header */}
        <div className="flex flex-col space-y-2 p-4 sm:p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-2xl">
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold flex items-center gap-2">
            <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            {language === 'ne' ? 'बाली रोग गाइड' : 'Disease & Pest Guide'}
          </h3>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
            {language === 'ne'
              ? 'बाली छानेर रोगको जानकारी, लक्षण र व्यवस्थापनको गाइड हेर्नुहोस्।'
              : 'Select a crop to view disease info, symptoms & management guide.'}
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Crop input + suggestions */}
          <div className="relative">
            <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 sm:px-4 sm:py-3">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={cropName}
                onChange={(e) => {
                  setCropName(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => cropName && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && cropName.trim()) {
                    setShowSuggestions(false);
                    fetchGuide(cropName);
                  }
                }}
                placeholder={language === 'ne'
                  ? 'जस्तै: धान, गहुँ, मकै, टमाटर...'
                  : 'e.g. Paddy, Wheat, Tomato...'}
                className="flex h-9 sm:h-10 w-full bg-transparent text-sm sm:text-base outline-none placeholder:text-muted-foreground"
              />
            </div>

            {showSuggestions && filteredCrops.length > 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border bg-popover shadow-md max-h-56 overflow-y-auto">
                {filteredCrops.map((crop) => (
                  <button
                    key={crop}
                    type="button"
                    className="w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base hover:bg-muted"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectCrop(crop);
                    }}
                  >
                    {crop}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Guide result card */}
          <div className="rounded-xl border bg-muted/50">
            <div className="flex items-center justify-between px-3 py-2 sm:px-5 sm:py-3 border-b">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                {language === 'ne' ? 'रोग गाइड' : 'Disease Guide'}
              </span>
              <span className="text-[11px] sm:text-xs text-muted-foreground">
                {cropName || (language === 'ne' ? 'बाली छानिएको छैन' : 'Crop not selected')}
              </span>
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-3 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm lg:text-base leading-relaxed space-y-2 sm:space-y-3">
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 gap-2">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {language === 'ne' ? 'AI गाइड तयार गर्दैछ...' : 'Generating AI guide...'}
                  </p>
                </div>
              )}

              {error && (
                <p className="text-destructive text-center py-4 text-sm sm:text-base">{error}</p>
              )}

              {guide && !isLoading && (
                <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none
                                prose-headings:text-foreground prose-p:text-foreground
                                prose-li:text-foreground prose-strong:text-foreground">
                  <ReactMarkdown>{guide}</ReactMarkdown>
                </div>
              )}

              {!guide && !isLoading && !error && (
                <>
                  <p className="text-muted-foreground">
                    {language === 'ne'
                      ? 'बाली रोजेपछि रोगको विस्तृत गाइड यहाँ देखिन्छ।'
                      : 'Select a crop above to see the detailed disease guide here.'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 sm:space-y-2 text-muted-foreground">
                    <li>{language === 'ne' ? 'मुख्य रोगहरूको नाम र लक्षण' : 'Major disease names & symptoms'}</li>
                    <li>{language === 'ne' ? 'कहिले जोखिम धेरै हुन्छ (मौसम / चरण)' : 'High-risk seasons & stages'}</li>
                    <li>{language === 'ne' ? 'जोगाउने तरिका (cultural, organic, chemical)' : 'Management (cultural, organic, chemical)'}</li>
                    <li>{language === 'ne' ? 'सुरक्षासम्बन्धी सावधानी र PHI दिन' : 'Safety precautions & PHI days'}</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
