import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Play, ChevronDown, ChevronUp, Leaf, Bug, 
  Clock, AlertTriangle, CheckCircle2, ExternalLink,
  BookOpen, Youtube, Pill, Sprout
} from 'lucide-react';
import { FloatingVoiceButton } from '@/components/ai/FloatingVoiceButton';

interface TreatmentStep {
  step: string;
  duration: string;
}

interface CropTreatment {
  id: string;
  crop_name: string;
  disease_or_pest_name: string;
  disease_or_pest_name_ne: string | null;
  treatment_title: string;
  treatment_title_ne: string | null;
  treatment_steps: unknown;
  treatment_steps_ne: unknown;
  chemical_treatment: string | null;
  chemical_treatment_ne: string | null;
  organic_treatment: string | null;
  organic_treatment_ne: string | null;
  youtube_video_url: string | null;
  severity_level: string | null;
  estimated_recovery_days: number | null;
  best_season: string | null;
}

const CROP_CATEGORIES = [
  { value: 'all', label: 'सबै', labelEn: 'All', emoji: '🌾' },
  { value: 'rice', label: 'धान', labelEn: 'Rice', emoji: '🌾' },
  { value: 'wheat', label: 'गहुँ', labelEn: 'Wheat', emoji: '🌾' },
  { value: 'maize', label: 'मकै', labelEn: 'Maize', emoji: '🌽' },
  { value: 'potato', label: 'आलु', labelEn: 'Potato', emoji: '🥔' },
  { value: 'tomato', label: 'गोलभेडा', labelEn: 'Tomato', emoji: '🍅' },
  { value: 'vegetables', label: 'तरकारी', labelEn: 'Vegetables', emoji: '🥬' },
];

const severityColors: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  low: 'bg-success/10 text-success border-success/30',
};

const severityLabels: Record<string, string> = {
  high: 'गम्भीर',
  medium: 'मध्यम',
  low: 'सामान्य',
};

export default function TreatmentLibrary() {
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Fetch all treatments
  const { data: treatments, isLoading } = useQuery({
    queryKey: ['crop-treatments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crop_treatments')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as CropTreatment[];
    },
  });

  // Filter treatments based on crop and search
  const filteredTreatments = useMemo(() => {
    if (!treatments) return [];
    
    return treatments.filter(treatment => {
      const matchesCrop = selectedCrop === 'all' || treatment.crop_name === selectedCrop;
      const matchesSearch = searchQuery === '' || 
        treatment.disease_or_pest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        treatment.disease_or_pest_name_ne?.includes(searchQuery) ||
        treatment.treatment_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        treatment.treatment_title_ne?.includes(searchQuery);
      
      return matchesCrop && matchesSearch;
    });
  }, [treatments, selectedCrop, searchQuery]);

  // Group treatments by crop
  const groupedTreatments = useMemo(() => {
    const grouped: Record<string, CropTreatment[]> = {};
    filteredTreatments.forEach(treatment => {
      if (!grouped[treatment.crop_name]) {
        grouped[treatment.crop_name] = [];
      }
      grouped[treatment.crop_name].push(treatment);
    });
    return grouped;
  }, [filteredTreatments]);

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const getCropLabel = (cropName: string) => {
    const crop = CROP_CATEGORIES.find(c => c.value === cropName);
    return crop ? `${crop.emoji} ${crop.label}` : cropName;
  };

  return (
    <>
      <Helmet>
        <title>उपचार पुस्तकालय | कृषि मित्र</title>
        <meta name="description" content="बाली रोग र कीराको उपचार विधिहरू - भिडियो ट्युटोरियल सहित" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Header />

        <main className="container mx-auto px-4 pt-20 sm:pt-24 pb-20">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">उपचार पुस्तकालय</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              बाली उपचार विधि
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              विभिन्न बालीका रोग र कीराहरूको उपचार विधि - भिडियो ट्युटोरियल र चरणबद्ध निर्देशनसहित
            </p>
          </motion.div>

          {/* Search and Filter */}
          <div className="mb-8 space-y-4">
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="रोग वा कीरा खोज्नुहोस्..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Crop Filter Tabs */}
            <Tabs value={selectedCrop} onValueChange={setSelectedCrop} className="w-full">
              <TabsList className="flex flex-wrap justify-center gap-2 h-auto bg-transparent p-0">
                {CROP_CATEGORIES.map(crop => (
                  <TabsTrigger
                    key={crop.value}
                    value={crop.value}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-full border"
                  >
                    {crop.emoji} {crop.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-primary">{treatments?.length || 0}</div>
              <div className="text-sm text-muted-foreground">कुल उपचार</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-primary">
                {treatments?.filter(t => t.youtube_video_url).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">भिडियो ट्युटोरियल</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-primary">
                {new Set(treatments?.map(t => t.crop_name)).size || 0}
              </div>
              <div className="text-sm text-muted-foreground">बाली प्रकार</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-primary">
                {treatments?.filter(t => t.organic_treatment).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">जैविक उपचार</div>
            </Card>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {/* No Results */}
          {!isLoading && filteredTreatments.length === 0 && (
            <div className="text-center py-12">
              <Leaf className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">कुनै उपचार भेटिएन</h3>
              <p className="text-muted-foreground">खोज परिवर्तन गर्नुहोस् वा अर्को बाली छान्नुहोस्</p>
            </div>
          )}

          {/* Treatment Cards */}
          <div className="space-y-6">
            {selectedCrop === 'all' ? (
              // Grouped view
              Object.entries(groupedTreatments).map(([cropName, cropTreatments]) => (
                <motion.div
                  key={cropName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    {getCropLabel(cropName)}
                    <Badge variant="secondary">{cropTreatments.length}</Badge>
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {cropTreatments.map(treatment => (
                      <TreatmentCard
                        key={treatment.id}
                        treatment={treatment}
                        isExpanded={expandedCards.has(treatment.id)}
                        onToggle={() => toggleCard(treatment.id)}
                        getYouTubeEmbedUrl={getYouTubeEmbedUrl}
                      />
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              // Flat view for selected crop
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTreatments.map(treatment => (
                  <TreatmentCard
                    key={treatment.id}
                    treatment={treatment}
                    isExpanded={expandedCards.has(treatment.id)}
                    onToggle={() => toggleCard(treatment.id)}
                    getYouTubeEmbedUrl={getYouTubeEmbedUrl}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        <Footer />
        <FloatingVoiceButton />
      </div>
    </>
  );
}

// Treatment Card Component
function TreatmentCard({ 
  treatment, 
  isExpanded, 
  onToggle,
  getYouTubeEmbedUrl 
}: { 
  treatment: CropTreatment; 
  isExpanded: boolean;
  onToggle: () => void;
  getYouTubeEmbedUrl: (url: string) => string | null;
}) {
  const [showVideo, setShowVideo] = useState(false);
  const rawSteps = treatment.treatment_steps_ne || treatment.treatment_steps || [];
  const steps = Array.isArray(rawSteps) ? rawSteps as TreatmentStep[] : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {treatment.severity_level && (
                  <Badge className={severityColors[treatment.severity_level]}>
                    {severityLabels[treatment.severity_level] || treatment.severity_level}
                  </Badge>
                )}
                {treatment.youtube_video_url && (
                  <Badge variant="outline" className="text-red-500 border-red-500/30">
                    <Youtube className="w-3 h-3 mr-1" />
                    भिडियो
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg leading-tight">
                {treatment.disease_or_pest_name_ne || treatment.disease_or_pest_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {treatment.treatment_title_ne || treatment.treatment_title}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Info */}
          <div className="flex flex-wrap gap-2 text-xs">
            {treatment.estimated_recovery_days && (
              <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full">
                <Clock className="w-3 h-3" />
                {treatment.estimated_recovery_days} दिन
              </div>
            )}
            {treatment.best_season && (
              <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full">
                <Sprout className="w-3 h-3" />
                {treatment.best_season}
              </div>
            )}
          </div>

          {/* YouTube Video */}
          {treatment.youtube_video_url && (
            <div className="rounded-lg overflow-hidden bg-muted aspect-video relative">
              {showVideo ? (
                <iframe
                  src={getYouTubeEmbedUrl(treatment.youtube_video_url) || ''}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button
                  onClick={() => setShowVideo(true)}
                  className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-muted/80 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                  <span className="text-sm font-medium">भिडियो हेर्नुहोस्</span>
                </button>
              )}
            </div>
          )}

          {/* Treatment Summary */}
          <div className="space-y-2">
            {treatment.chemical_treatment_ne || treatment.chemical_treatment ? (
              <div className="p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <Pill className="w-4 h-4 text-primary" />
                  रासायनिक उपचार
                </div>
                <p className="text-sm text-muted-foreground">
                  {treatment.chemical_treatment_ne || treatment.chemical_treatment}
                </p>
              </div>
            ) : null}

            {treatment.organic_treatment_ne || treatment.organic_treatment ? (
              <div className="p-3 bg-success/5 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium mb-1 text-success">
                  <Leaf className="w-4 h-4" />
                  जैविक उपचार
                </div>
                <p className="text-sm text-muted-foreground">
                  {treatment.organic_treatment_ne || treatment.organic_treatment}
                </p>
              </div>
            ) : null}
          </div>

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full justify-between"
          >
            <span>चरणबद्ध निर्देशन</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          {/* Expanded Steps */}
          <AnimatePresence>
            {isExpanded && steps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {steps.map((step: TreatmentStep, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{step.step}</p>
                      {step.duration && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {step.duration}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* External Link */}
          {treatment.youtube_video_url && (
            <a
              href={treatment.youtube_video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              YouTube मा हेर्नुहोस्
            </a>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
