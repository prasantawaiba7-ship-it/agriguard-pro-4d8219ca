import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Loader2, Search, Leaf } from 'lucide-react';
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
  const { t, language } = useLanguage();
  const [cropName, setCropName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [guide, setGuide] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCrops = useMemo(() => {
    if (!cropName) return [];
    return CROP_OPTIONS.filter((c) =>
      normalizeText(c).includes(normalizeText(cropName))
    );
  }, [cropName]);

  const fetchGuide = async () => {
    if (!cropName.trim()) return;
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
          body: JSON.stringify({ crop_name: cropName.trim(), language }),
        }
      );

      if (!res.ok) throw new Error('Failed to fetch guide');
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setGuide(data.guide);
      }
    } catch (err) {
      setError(language === 'ne'
        ? 'गाइड लोड गर्न सकिएन। पछि फेरि प्रयास गर्नुहोस्।'
        : 'Failed to load guide. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">
          {language === 'ne' ? 'बाली रोग गाइड' : 'Crop Disease Guide'}
        </h3>
      </div>

      {/* Crop input + search */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <label className="text-xs font-medium text-muted-foreground">
            {language === 'ne' ? 'बालीको नाम टाइप गर्नुहोस्' : 'Type crop name'}
          </label>
          <div className="relative">
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
                  fetchGuide();
                }
              }}
              placeholder="e.g. धान, टमाटर, Potato, Maize..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2
                         text-sm ring-offset-background placeholder:text-muted-foreground
                         focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            {showSuggestions && filteredCrops.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border
                             bg-popover text-popover-foreground shadow-sm text-sm">
                {filteredCrops.map((crop) => (
                  <li
                    key={crop}
                    onMouseDown={() => {
                      setCropName(crop);
                      setShowSuggestions(false);
                    }}
                    className="cursor-pointer px-3 py-1.5 hover:bg-muted"
                  >
                    {crop}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button
            onClick={fetchGuide}
            disabled={!cropName.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {language === 'ne' ? 'रोग गाइड खोज्नुहोस्' : 'Search Disease Guide'}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="text-center py-6 text-muted-foreground">
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {language === 'ne' ? 'AI गाइड तयार गर्दैछ...' : 'Generating AI guide...'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Guide result */}
      {guide && !isLoading && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="h-4 w-4 text-primary" />
              <Badge variant="secondary">{cropName}</Badge>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none
                            prose-headings:text-foreground prose-p:text-foreground
                            prose-li:text-foreground prose-strong:text-foreground
                            max-h-[70vh] overflow-y-auto pr-2">
              <ReactMarkdown>{guide}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!guide && !isLoading && !error && (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>
              {language === 'ne'
                ? 'बालीको नाम लेखेर रोग गाइड खोज्नुहोस्।'
                : 'Enter a crop name to search for disease guide.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
