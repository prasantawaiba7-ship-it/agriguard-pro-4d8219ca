import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Sparkles, Loader2, ChevronDown, ChevronUp, RefreshCw, MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

// Stage options
const STAGE_OPTIONS = [
  { value: 'general', label: 'सामान्य जानकारी' },
  { value: 'before_sowing', label: 'रोप्नु अघि' },
  { value: 'sowing', label: 'रोप्ने बेला' },
  { value: 'seedling', label: 'बिरुवा अवस्था' },
  { value: 'vegetative', label: 'बढ्दो अवस्था' },
  { value: 'flowering', label: 'फूल लाग्ने बेला' },
  { value: 'fruiting', label: 'फल लाग्ने बेला' },
  { value: 'pre_harvest', label: 'कटानी अघि' },
  { value: 'post_harvest', label: 'कटानी पछि' },
];

// Problem type options
const PROBLEM_OPTIONS = [
  { value: 'general', label: 'सामान्य सल्लाह' },
  { value: 'disease', label: 'रोग समस्या' },
  { value: 'pest', label: 'किरा समस्या' },
  { value: 'fertilizer', label: 'मल सम्बन्धी' },
  { value: 'irrigation', label: 'सिँचाइ सम्बन्धी' },
  { value: 'weather', label: 'मौसम सम्बन्धी' },
  { value: 'market', label: 'बजार सम्बन्धी' },
];

interface GuideSection {
  id: string;
  section: string;
  title: string;
  title_ne: string | null;
  content: string;
  content_ne: string | null;
  step_number: number;
  media_url: string | null;
}

interface CropGuideCardProps {
  cropId: number;
  cropName: string;
  cropNameEn?: string;
  cropImage?: string | null;
}

export function CropGuideCard({
  cropId,
  cropName,
  cropNameEn,
  cropImage,
}: CropGuideCardProps) {
  const [stage, setStage] = useState('general');
  const [problemType, setProblemType] = useState('general');
  const [customQuestion, setCustomQuestion] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [sections, setSections] = useState<Record<string, GuideSection[]>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchGuide = async () => {
    setIsLoading(true);
    setError(null);
    setSummary(null);
    setSteps([]);
    setSections({});

    try {
      const { data, error: apiError } = await supabase.functions.invoke('guide-query', {
        body: {
          crop_id: cropId,
          stage: stage !== 'general' ? stage : undefined,
          problem_type: problemType !== 'general' ? problemType : undefined,
          question: customQuestion.trim() || undefined,
          language: 'ne',
        },
      });

      if (apiError) throw apiError;

      if (data?.error && !data?.sections) {
        setError(data.error);
        return;
      }

      setSummary(data?.summary || null);
      setSteps(data?.steps || []);
      setSections(data?.sections || {});
      
      // Auto-expand first section
      const firstSection = Object.keys(data?.sections || {})[0];
      if (firstSection) {
        setExpandedSections(new Set([firstSection]));
      }
    } catch (err) {
      console.error('Guide fetch error:', err);
      setError('गाइड लोड गर्न असफल भयो। पछि प्रयास गर्नुहोस्।');
      toast.error('गाइड लोड गर्न असफल');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getSectionLabel = (section: string) => {
    const labels: Record<string, { label: string; icon: string }> = {
      introduction: { label: 'परिचय', icon: '📖' },
      climate: { label: 'जलवायु', icon: '🌤️' },
      soil: { label: 'माटो', icon: '🏔️' },
      land_preparation: { label: 'भूमि तयारी', icon: '🚜' },
      sowing: { label: 'रोपाइँ', icon: '🌱' },
      fertilizer: { label: 'मल', icon: '🧪' },
      irrigation: { label: 'सिँचाइ', icon: '💧' },
      pests: { label: 'किरा', icon: '🐛' },
      diseases: { label: 'रोग', icon: '🦠' },
      harvest: { label: 'कटानी', icon: '🌾' },
      storage: { label: 'भण्डारण', icon: '🏠' },
      market: { label: 'बजार', icon: '💰' },
      tips: { label: 'सुझाव', icon: '💡' },
    };
    return labels[section] || { label: section, icon: '📄' };
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
        <div className="flex items-center gap-3">
          {cropImage ? (
            <img
              src={cropImage}
              alt={cropName}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-lg">{cropName}</CardTitle>
            {cropNameEn && (
              <p className="text-sm text-muted-foreground">{cropNameEn}</p>
            )}
          </div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI गाइड
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Stage and problem selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">अवस्था</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {STAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">विषय</Label>
            <Select value={problemType} onValueChange={setProblemType}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {PROBLEM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced options toggle */}
        <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full gap-1 text-xs">
              <MessageSquare className="h-3 w-3" />
              थप प्रश्न राख्नुहोस्
              {showAdvancedOptions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Textarea
              placeholder="जस्तै: पात पहेँलो भयो के गर्ने?"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Fetch button */}
        <Button 
          onClick={fetchGuide} 
          disabled={isLoading}
          className="w-full gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              लोड हुँदैछ...
            </>
          ) : summary ? (
            <>
              <RefreshCw className="h-4 w-4" />
              पुनः लोड गर्नुहोस्
            </>
          ) : (
            <>
              <BookOpen className="h-4 w-4" />
              गाइड हेर्नुहोस्
            </>
          )}
        </Button>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* AI Summary */}
        <AnimatePresence>
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Summary text */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">AI सारांश</span>
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {summary}
                </div>
              </div>

              {/* Steps list */}
              {steps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    के गर्नुहोस्:
                  </h4>
                  <ul className="space-y-1.5">
                    {steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="font-medium text-primary">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detailed sections */}
              {Object.keys(sections).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">विस्तृत जानकारी:</h4>
                  {Object.entries(sections).map(([sectionKey, sectionGuides]) => {
                    const { label, icon } = getSectionLabel(sectionKey);
                    const isExpanded = expandedSections.has(sectionKey);
                    
                    return (
                      <Collapsible
                        key={sectionKey}
                        open={isExpanded}
                        onOpenChange={() => toggleSection(sectionKey)}
                      >
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                            <span className="flex items-center gap-2 font-medium text-sm">
                              <span>{icon}</span>
                              {label}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {sectionGuides.length}
                              </Badge>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-3 space-y-3">
                            {sectionGuides.map((guide) => (
                              <div key={guide.id} className="text-sm">
                                <h5 className="font-medium mb-1">
                                  {guide.title_ne || guide.title}
                                </h5>
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                  {guide.content_ne || guide.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
