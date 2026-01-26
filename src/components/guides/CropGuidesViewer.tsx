import { useState, useEffect, useRef } from 'react';
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
import { BookOpen, ChevronLeft, Search, Leaf, Loader2, ChevronDown, ChevronUp, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

export function CropGuidesViewer() {
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
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-primary/10 text-primary">
            <Leaf className="h-4 w-4 md:h-5 md:w-5" />
            <span className="font-medium text-sm md:text-base">
              {language === 'ne' ? 'खेती गाइड' : 'Farming Guide'}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
            {language === 'ne' ? 'बाली छान्नुहोस्' : 'Select a Crop'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto px-4">
            {language === 'ne' 
              ? 'तपाईंले खेती गर्न चाहनुभएको बालीको पूर्ण गाइड हेर्नुहोस्'
              : 'View complete farming guide for your chosen crop'}
          </p>
        </div>

        {/* Search - Full width on mobile */}
        <div className="relative w-full max-w-md mx-auto px-2 md:px-0">
          <Search className="absolute left-5 md:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={language === 'ne' ? 'बाली खोज्नुहोस्...' : 'Search crops...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 md:h-10 text-base md:text-sm"
          />
        </div>

        {/* Crops Grid - Responsive columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4 px-1 md:px-0">
          <AnimatePresence mode="popLayout">
            {filteredCrops.map((crop, index) => {
              const cropGuides = guides.filter(g => g.crop_name === crop);
              const category = getCropCategory(crop);
              const imageUrl = getCropImage(crop);
              
              return (
                <motion.div
                  key={crop}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card 
                    className="cursor-pointer group hover:shadow-lg hover:border-primary/50 transition-all duration-300 overflow-hidden active:scale-95 touch-manipulation"
                    onClick={() => {
                      setSelectedCrop(crop);
                      setActiveSection(null);
                      setExpandedSections(new Set());
                      setAiSummary(null);
                      setFarmerQuestion('');
                    }}
                  >
                    {/* Image or Emoji Header */}
                    <div className="aspect-square sm:aspect-[4/3] bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center relative overflow-hidden">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={crop}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform">
                          {getCategoryEmoji(category)}
                        </span>
                      )}
                      <Badge 
                        variant="secondary" 
                        className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-[10px] sm:text-xs px-1.5 py-0.5"
                      >
                        {cropGuides.length} {language === 'ne' ? 'विषय' : 'topics'}
                      </Badge>
                    </div>
                    
                    <CardContent className="p-2 sm:p-3 md:p-4">
                      <h3 className="font-semibold text-center text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors">
                        {crop}
                      </h3>
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
            setSelectedCrop(null);
            setAiSummary(null);
            setFarmerQuestion('');
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

      {/* AI Summary Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm md:text-base">
              {language === 'ne' ? 'AI सारांश' : 'AI Summary'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQueryForm(!showQueryForm)}
              className="ml-auto h-8 px-2"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              <span className="text-xs">{language === 'ne' ? 'प्रश्न सोध्नुहोस्' : 'Ask'}</span>
            </Button>
          </div>

          {/* Query Form */}
          <AnimatePresence>
            {showQueryForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="flex gap-2">
                  <Textarea
                    placeholder={language === 'ne' ? 'तपाईंको प्रश्न लेख्नुहोस्... (जस्तै: पात पहेंलो भयो के गर्ने?)' : 'Type your question...'}
                    value={farmerQuestion}
                    onChange={(e) => setFarmerQuestion(e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                  />
                  <Button 
                    onClick={handleAskQuestion} 
                    disabled={!farmerQuestion.trim() || isGeneratingSummary}
                    className="self-end"
                    size="sm"
                  >
                    {isGeneratingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : language === 'ne' ? 'पठाउनुहोस्' : 'Send'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary Content */}
          {isGeneratingSummary ? (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                {language === 'ne' ? 'सारांश तयार पार्दै...' : 'Generating summary...'}
              </span>
            </div>
          ) : aiSummary ? (
            <div className="prose prose-sm max-w-none text-foreground">
              <div className="whitespace-pre-line text-sm md:text-base leading-relaxed">
                {aiSummary}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              {language === 'ne' 
                ? 'तलको गाइड हेर्नुहोस् वा माथिको प्रश्न बटन थिचेर आफ्नो प्रश्न सोध्नुहोस्।' 
                : 'View the guide below or ask a specific question above.'}
            </p>
          )}
        </CardContent>
      </Card>

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
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
