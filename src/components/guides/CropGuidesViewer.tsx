import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useCropGuides, CropGuide, GuideSection, SECTION_LABELS } from '@/hooks/useCropGuides';
import { useLanguage } from '@/hooks/useLanguage';
import { useCrops } from '@/hooks/useCrops';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, ChevronLeft, Search, Leaf, Loader2, ChevronDown, ChevronUp, Sparkles, MessageSquare, ArrowRight, ImageOff, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { MarketPriceSummaryCard } from './MarketPriceSummaryCard';
import { QuickRatingButton } from '@/components/feedback/QuickRatingButton';

export function CropGuidesViewer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const { guides, crops: guideCrops, isLoading, getLocalizedContent } = useCropGuides();
  const { activeCrops } = useCrops();
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<GuideSection | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const guideContentRef = useRef<HTMLDivElement>(null);
  
  // AI Summary state
  const [farmerQuestion, setFarmerQuestion] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showQueryForm, setShowQueryForm] = useState(false);

  // Per-section Q&A state
  const [sectionQuestion, setSectionQuestion] = useState<Record<string, string>>({});
  const [sectionAnswer, setSectionAnswer] = useState<Record<string, string>>({});
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({});
  const [showSectionAsk, setShowSectionAsk] = useState<Record<string, boolean>>({});
  

  const filteredGuides = selectedCrop 
    ? guides.filter(g => g.crop_name === selectedCrop)
    : [];

  // Group guides by section
  const groupedGuides = filteredGuides.reduce((acc, guide) => {
    if (!acc[guide.section]) {
      acc[guide.section] = [];
    }
    acc[guide.section].push(guide);
    return acc;
  }, {} as Record<string, CropGuide[]>);

  // Get available sections for the selected crop
  const availableSections = (Object.keys(SECTION_LABELS) as GuideSection[])
    .filter(section => groupedGuides[section]?.length > 0);

  // Filter crops for display
  const filteredCrops = guideCrops.filter(crop => 
    crop.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get crop image from crops table if available
  const getCropImage = (cropName: string) => {
    const crop = activeCrops.find(c => 
      c.name_ne === cropName || c.name_en.toLowerCase() === cropName.toLowerCase()
    );
    return crop?.image_url;
  };

  // Get crop category
  const getCropCategory = (cropName: string) => {
    const crop = activeCrops.find(c => 
      c.name_ne === cropName || c.name_en.toLowerCase() === cropName.toLowerCase()
    );
    return crop?.category || 'other';
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'vegetable': return '🥬';
      case 'fruit': return '🍎';
      case 'grain': return '🌾';
      case 'spice': return '🌶️';
      case 'pulse': return '🫘';
      default: return '🌿';
    }
  };

  // Scroll to top when crop is selected
  useEffect(() => {
    if (selectedCrop && guideContentRef.current) {
      guideContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedCrop]);

  // Auto-generate summary when crop is selected
  useEffect(() => {
    if (selectedCrop && filteredGuides.length > 0) {
      generateAISummary();
    }
  }, [selectedCrop]);

  // Toggle section expansion for mobile accordion
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Generate AI Summary
  const generateAISummary = async (customQuestion?: string) => {
    if (!selectedCrop) return;
    
    setIsGeneratingSummary(true);
    setAiSummary(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('guide-query', {
        body: {
          crop_name: selectedCrop,
          question: customQuestion || farmerQuestion || null,
          language: language
        }
      });

      if (error) throw error;
      
      if (data?.summary) {
        setAiSummary(data.summary);
      } else if (data?.error) {
        console.warn('Guide query warning:', data.error);
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
      toast.error(language === 'ne' ? 'सारांश बनाउन असफल' : 'Failed to generate summary');
    } finally {
    setIsGeneratingSummary(false);
    }
  };

  const handleAskQuestion = () => {
    if (farmerQuestion.trim()) {
      generateAISummary(farmerQuestion.trim());
      setShowQueryForm(false);
    }
  };

  // Per-section AI Q&A
  const handleSectionAsk = async (section: GuideSection) => {
    const q = sectionQuestion[section]?.trim();
    if (!q || !selectedCrop) return;

    setSectionLoading(prev => ({ ...prev, [section]: true }));
    setSectionAnswer(prev => ({ ...prev, [section]: '' }));

    try {
      const sectionLabel = SECTION_LABELS[section];
      const sectionName = language === 'ne' ? sectionLabel.ne : sectionLabel.en;

      const { data, error } = await supabase.functions.invoke('guide-query', {
        body: {
          crop_name: selectedCrop,
          question: `"${sectionName}" विषयमा मेरो प्रश्न: ${q}`,
          language
        }
      });

      if (error) throw error;
      if (data?.summary) {
        setSectionAnswer(prev => ({ ...prev, [section]: data.summary }));
      }
    } catch (err) {
      console.error('Section Q&A error:', err);
      toast.error(language === 'ne' ? 'जवाफ लोड गर्न सकिएन' : 'Failed to load answer');
    } finally {
      setSectionLoading(prev => ({ ...prev, [section]: false }));
    }
  };

  // Reusable Section Q&A UI
  const renderSectionQA = (section: GuideSection) => {
    const isOpen = showSectionAsk[section];
    const answer = sectionAnswer[section];
    const loading = sectionLoading[section];
    const question = sectionQuestion[section] || '';

    return (
      <div className="mt-4 pt-3 border-t border-dashed border-primary/20">
        <button
          onClick={() => setShowSectionAsk(prev => ({ ...prev, [section]: !prev[section] }))}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors touch-manipulation"
        >
          <MessageSquare className="h-4 w-4" />
          {language === 'ne' ? 'यस विषयमा प्रश्न सोध्नुहोस्' : 'Ask about this topic'}
          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <Textarea
                    placeholder={language === 'ne' ? 'जस्तै: कति दिनमा सिँचाइ गर्ने?' : 'e.g., How often to irrigate?'}
                    value={question}
                    onChange={(e) => setSectionQuestion(prev => ({ ...prev, [section]: e.target.value }))}
                    className="min-h-[50px] text-sm resize-none bg-background"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSectionAsk(section);
                      }
                    }}
                  />
                  <Button
                    onClick={() => handleSectionAsk(section)}
                    disabled={!question.trim() || loading}
                    size="default"
                    className="self-end shrink-0"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>

                {loading && (
                  <div className="flex items-center gap-2 py-3 justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {language === 'ne' ? 'जवाफ तयार पार्दै...' : 'Generating answer...'}
                    </span>
                  </div>
                )}

                {answer && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/5 border border-primary/15 rounded-lg p-3 sm:p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-primary">
                        {language === 'ne' ? 'AI जवाफ' : 'AI Answer'}
                      </span>
                    </div>
                    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground whitespace-pre-line leading-relaxed">
                      {answer}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 md:p-12 gap-4">
        <Loader2 className="h-8 w-8 md:h-10 md:w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm md:text-base">
          {language === 'ne' ? 'लोड हुँदैछ...' : 'Loading guides...'}
        </p>
      </div>
    );
  }

  if (guideCrops.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 md:p-12 text-center">
          <div className="mx-auto w-14 h-14 md:w-16 md:h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base md:text-lg font-semibold mb-2">
            {language === 'ne' ? 'कुनै गाइड उपलब्ध छैन' : 'No Guides Available'}
          </h3>
          <p className="text-muted-foreground text-sm md:text-base">
            {language === 'ne' 
              ? 'Admin ले खेती गाइड थप्नु पर्छ।' 
              : 'Admin needs to add crop guides.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Crop selection screen
  if (!selectedCrop) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4 md:space-y-6"
      >
        {/* Header - Enhanced */}
        <div className="text-center space-y-3 px-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/20"
          >
            <Leaf className="h-5 w-5" />
            <span className="font-semibold text-sm md:text-base">
              {language === 'ne' ? 'खेती गाइड' : 'Farming Guide'}
            </span>
          </motion.div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {language === 'ne' ? 'बाली छान्नुहोस्' : 'Select a Crop'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
            {language === 'ne' 
              ? 'तपाईंले खेती गर्न चाहनुभएको बालीको पूर्ण गाइड र AI सल्लाह पाउनुहोस्'
              : 'Get complete guide and AI advice for your chosen crop'}
          </p>
        </div>

        {/* Search - Enhanced */}
        <div className="relative w-full max-w-md mx-auto px-2 md:px-0">
          <Search className="absolute left-5 md:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={language === 'ne' ? 'बाली खोज्नुहोस्...' : 'Search crops...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 md:h-11 text-base border-2 focus:border-primary shadow-sm"
          />
        </div>

        {/* Crops Grid - Enhanced Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 px-1 md:px-0">
          <AnimatePresence mode="popLayout">
            {filteredCrops.map((crop, index) => {
              const cropGuides = guides.filter(g => g.crop_name === crop);
              const category = getCropCategory(crop);
              const imageUrl = getCropImage(crop);
              
              return (
                <motion.div
                  key={crop}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                >
                  <Card 
                    className="cursor-pointer group hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden active:scale-95 touch-manipulation border-2"
                    onClick={() => {
                      setSelectedCrop(crop);
                      setActiveSection(null);
                      setExpandedSections(new Set());
                      setAiSummary(null);
                      setFarmerQuestion('');
                    }}
                  >
                    {/* Image or Emoji Header - Enhanced gradient */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 flex items-center justify-center relative overflow-hidden">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={crop}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            // Hide broken images
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`absolute inset-0 flex items-center justify-center ${imageUrl ? 'hidden' : ''}`}
                      >
                        <span className="text-5xl sm:text-6xl group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">
                          {getCategoryEmoji(category)}
                        </span>
                      </div>
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Badge 
                        className="absolute top-2 right-2 text-[10px] sm:text-xs px-2 py-0.5 bg-background/90 backdrop-blur-sm border shadow-sm"
                      >
                        {cropGuides.length} {language === 'ne' ? 'विषय' : 'topics'}
                      </Badge>
                    </div>
                    
                    <CardContent className="p-3 sm:p-4 bg-gradient-to-b from-background to-muted/30">
                      <h3 className="font-bold text-center text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors">
                        {crop}
                      </h3>
                      <p className="text-xs text-center text-muted-foreground mt-1 group-hover:text-primary/70 transition-colors">
                        {language === 'ne' ? 'गाइड हेर्नुहोस्' : 'View guide'} →
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredCrops.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {language === 'ne' ? 'कुनै बाली फेला परेन' : 'No crops found'}
          </div>
        )}
      </motion.div>
    );
  }

  // Guide detail view
  return (
    <motion.div 
      ref={guideContentRef}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4 md:space-y-6"
    >
      {/* Back Button & Header - Stacked on mobile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            // Clear selection states
            setSelectedCrop(null);
            setAiSummary(null);
            setFarmerQuestion('');
            
            // If we came from a specific location, navigate back
            // Otherwise just clear the selection (stay on same page)
            if (location.state?.from) {
              navigate(location.state.from, { replace: true });
            }
          }}
          className="self-start -ml-2 h-10 px-3 touch-manipulation"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {language === 'ne' ? 'फिर्ता' : 'Back'}
        </Button>
        
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {getCropImage(selectedCrop) ? (
              <img 
                src={getCropImage(selectedCrop)} 
                alt={selectedCrop}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl md:text-3xl">{getCategoryEmoji(getCropCategory(selectedCrop))}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-xl lg:text-2xl font-bold truncate">{selectedCrop}</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {availableSections.length} {language === 'ne' ? 'खण्डहरू उपलब्ध' : 'sections available'}
            </p>
          </div>
        </div>
      </div>

      {/* AI Summary Section - Enhanced Design */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg overflow-hidden">
        <CardContent className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-base md:text-lg">
                  {language === 'ne' ? 'AI सारांश' : 'AI Summary'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {language === 'ne' ? 'तपाईंको बालीको लागि सल्लाह' : 'Advice for your crop'}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQueryForm(!showQueryForm)}
                className="gap-1.5"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">{language === 'ne' ? 'प्रश्न' : 'Ask'}</span>
              </Button>
            </div>
          </div>

          {/* Query Form - Enhanced */}
          <AnimatePresence>
            {showQueryForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    {language === 'ne' ? 'तपाईंको प्रश्न:' : 'Your question:'}
                  </label>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={language === 'ne' ? 'जस्तै: पात पहेँलो भयो के गर्ने?' : 'e.g., What to do for yellow leaves?'}
                      value={farmerQuestion}
                      onChange={(e) => setFarmerQuestion(e.target.value)}
                      className="min-h-[60px] text-sm resize-none bg-background"
                    />
                    <Button 
                      onClick={handleAskQuestion} 
                      disabled={!farmerQuestion.trim() || isGeneratingSummary}
                      className="self-end"
                      size="default"
                    >
                      {isGeneratingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary Content - Enhanced */}
          {isGeneratingSummary ? (
            <div className="flex items-center gap-3 py-6 justify-center">
              <div className="relative">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="h-8 w-8 text-primary/30" />
                </div>
              </div>
              <span className="text-base text-muted-foreground font-medium">
                {language === 'ne' ? 'सारांश तयार पार्दै...' : 'Generating summary...'}
              </span>
            </div>
          ) : aiSummary ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-primary/10"
            >
              <div className="prose prose-sm max-w-none text-foreground">
                <div className="whitespace-pre-line text-sm md:text-base leading-relaxed">
                  {aiSummary}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-4 px-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-muted-foreground text-sm">
                <Sparkles className="h-4 w-4" />
                {language === 'ne' 
                  ? 'तलको गाइड हेर्नुहोस् वा प्रश्न सोध्नुहोस्' 
                  : 'View guide below or ask a question'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Price Summary Card */}
      <MarketPriceSummaryCard 
        cropName={selectedCrop} 
        language={language}
      />

      {filteredGuides.length === 0 ? (
        <Card>
          <CardContent className="p-6 md:p-8 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm md:text-base">{language === 'ne' ? 'यो बालीको लागि गाइड उपलब्ध छैन।' : 'No guide available for this crop.'}</p>
          </CardContent>
        </Card>
      ) : isMobile ? (
        /* Mobile: Accordion View */
        <div className="space-y-2">
          {availableSections.map((section) => {
            const sectionGuides = groupedGuides[section] || [];
            const label = SECTION_LABELS[section];
            const isExpanded = expandedSections.has(section);
            
            return (
              <Collapsible 
                key={section} 
                open={isExpanded}
                onOpenChange={() => toggleSection(section)}
              >
                <Card className="overflow-hidden">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/50 transition-colors touch-manipulation">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                          {label.icon}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-sm md:text-base">
                            {language === 'ne' ? label.ne : label.en}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {sectionGuides.length} {language === 'ne' ? 'चरणहरू' : 'steps'}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-3 pb-3 md:px-4 md:pb-4 pt-1 border-t">
                      <div className="space-y-4 mt-3">
                        {sectionGuides.map((guide, idx) => {
                          const { title, content } = getLocalizedContent(guide);
                          return (
                            <div 
                              key={guide.id}
                              className="relative pl-7"
                            >
                              {/* Step indicator line */}
                              {idx < sectionGuides.length - 1 && (
                                <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-border" />
                              )}
                              
                              {/* Step number */}
                              <div className="absolute left-0 top-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                                {idx + 1}
                              </div>

                              {/* Content */}
                              <div className="space-y-1.5">
                                <h4 className="font-semibold text-sm leading-snug">
                                  {title}
                                </h4>
                                <div className="text-muted-foreground text-sm whitespace-pre-line leading-relaxed">
                                  {content}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {renderSectionQA(section)}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      ) : (
        /* Tablet/Desktop: Tabs View */
        <div className="w-full">
          {/* Scrollable Section Tabs */}
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="inline-flex gap-1 p-1 bg-muted/50 rounded-lg">
              {availableSections.map((section) => {
                const label = SECTION_LABELS[section];
                const isActive = (activeSection || availableSections[0]) === section;
                
                return (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-md text-sm font-medium transition-all touch-manipulation ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="text-base">{label.icon}</span>
                    <span className="hidden md:inline">
                      {language === 'ne' ? label.ne : label.en}
                    </span>
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Tab Content */}
          {availableSections.map((section) => {
            const sectionGuides = groupedGuides[section] || [];
            const label = SECTION_LABELS[section];
            const isActive = (activeSection || availableSections[0]) === section;
            
            if (!isActive) return null;
            
            return (
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <Card>
                  <CardContent className="p-4 md:p-6">
                    {/* Section Header */}
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center text-xl md:text-2xl">
                        {label.icon}
                      </div>
                      <div>
                        <h2 className="text-base md:text-lg font-semibold">
                          {language === 'ne' ? label.ne : label.en}
                        </h2>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {sectionGuides.length} {language === 'ne' ? 'चरणहरू' : 'steps'}
                        </p>
                      </div>
                    </div>

                    {/* Guide Steps */}
                    <div className="space-y-5 md:space-y-6">
                      {sectionGuides.map((guide, idx) => {
                        const { title, content } = getLocalizedContent(guide);
                        return (
                          <motion.div 
                            key={guide.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className="relative pl-8 md:pl-10 pb-5 last:pb-0"
                          >
                            {/* Step indicator line */}
                            {idx < sectionGuides.length - 1 && (
                              <div className="absolute left-[11px] md:left-[15px] top-7 md:top-8 bottom-0 w-0.5 bg-border" />
                            )}
                            
                            {/* Step number */}
                            <div className="absolute left-0 top-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground text-sm md:text-base font-medium flex items-center justify-center">
                              {idx + 1}
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                              <h3 className="font-semibold text-base md:text-lg leading-snug">
                                {title}
                              </h3>
                              <div className="text-muted-foreground text-sm md:text-base whitespace-pre-line leading-relaxed">
                                {content}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    {renderSectionQA(section)}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Feedback Section for Guides - always shown when crop selected */}
      <Card className="border-dashed border-primary/30 bg-primary/5 mt-6">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">
                {language === 'ne' ? 'यो गाइड कस्तो लाग्यो?' : 'How was this guide?'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {language === 'ne' ? 'तपाईंको प्रतिक्रियाले हामीलाई सुधार गर्न मद्दत गर्छ' : 'Your feedback helps us improve'}
              </p>
            </div>
          </div>
          <QuickRatingButton
            feedbackType="guide_usefulness"
            targetType="guide"
            targetId={selectedCrop || undefined}
            variant="stars"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
