import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TourStep {
  targetSelector: string;
  title: string;
  text: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="page-title"]',
    title: 'पेज के हो?',
    text: [
      "यो 'मेरो खेत' पेजबाट तपाईंका सबै खेत र बालीको अवस्था हेर्न मिल्छ।",
      "आज के गर्नु, कुन खेतमा के काम छ — सबै जानकारी यहाँ देखिन्छ।",
    ],
  },
  {
    targetSelector: '[data-tour="tabs"]',
    title: 'ट्याबहरू (खेतहरू / गाइड)',
    text: [
      '`खेतहरू` मा तपाईंका सबै खेतको सूची देखिन्छ।',
      '`गाइड` मा बालीको विस्तृत खेती गाइड पढ्न/सुनिन सकिन्छ।',
    ],
  },
  {
    targetSelector: '[data-tour="today-summary"]',
    title: 'आजको सारांश कार्ड',
    text: [
      "यहाँ आजका मुख्य सल्लाह देखिन्छन् – जस्तै सिंचाइ, मल, सावधानी।",
      "पहिले यो कार्ड पढेर 'आज के गर्ने?' थाहा पाउनुहोस्।",
    ],
  },
  {
    targetSelector: '[data-tour="field-card"]',
    title: 'एउटा खेत card के हो?',
    text: [
      'यो card तपाईंको एउटा खेत हो — नाम, बाली, ठाउँ र आजको सल्लाह देखिन्छ।',
      'माथिको हरियो बिन्दुले खेत सामान्य अवस्थामा छ भनेर देखाउँछ।',
    ],
  },
  {
    targetSelector: '[data-tour="field-card"]',
    title: 'खेत खोल्दा के देखिन्छ?',
    text: [
      'यो cardमा थिच्दा सो खेतको विस्तृत पेज खुल्छ।',
      "त्यहाँ कति मल/बिउ चाहिन्छ, कुन दिन के काम गर्ने, रोग–गाइड सबै हुन्छ।",
    ],
  },
  {
    targetSelector: '[data-tour="add-field-btn"]',
    title: 'नयाँ खेत कसरी थप्ने?',
    text: [
      'नयाँ खेत राख्न यहाँ थिच्नुहोस्।',
      "क्षेत्रफल, बाली र ठाउँ हाल्यो भने app ले मल, बिउ र कामको तालिका तयार गर्छ।",
    ],
  },
  {
    targetSelector: '[data-tour="guide-tab"]',
    title: 'गाइड कहिले प्रयोग गर्ने?',
    text: [
      "बाली बारे विस्तारमा जान्न 'गाइड' ट्याब खोल्नुहोस्।",
      'रोग, मल, सिंचाइ, कटान र भण्डारण सबै खण्ड यहाँ उपलब्ध हुन्छ।',
    ],
  },
];

const TOUR_SEEN_KEY = 'kisan-fields-tour-seen';

export function FieldsGuidedTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});

  // Show first-time toast hint
  useEffect(() => {
    const seen = localStorage.getItem(TOUR_SEEN_KEY);
    if (!seen) {
      const timer = setTimeout(() => {
        toast.info("पहिलो पटक हुनुहुन्छ? '?' थिचेर सानो घुम्ती सिकाइ हेर्नुहोस्।", {
          duration: 6000,
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const positionTooltip = useCallback(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(step.targetSelector);
    if (!el) {
      setTooltipStyle({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' });
      setHighlightStyle({ display: 'none' });
      return;
    }

    const rect = el.getBoundingClientRect();
    const pad = 8;

    setHighlightStyle({
      position: 'fixed',
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
      borderRadius: 12,
    });

    const tooltipW = Math.min(320, window.innerWidth - 32);
    let top = rect.bottom + 14;
    let left = rect.left + rect.width / 2 - tooltipW / 2;

    if (left < 16) left = 16;
    if (left + tooltipW > window.innerWidth - 16) left = window.innerWidth - 16 - tooltipW;
    if (top + 220 > window.innerHeight) top = rect.top - 220;

    setTooltipStyle({ position: 'fixed', top, left, width: tooltipW });

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [isOpen, currentStep]);

  useEffect(() => {
    positionTooltip();
    window.addEventListener('resize', positionTooltip);
    return () => window.removeEventListener('resize', positionTooltip);
  }, [positionTooltip]);

  const next = () => {
    if (currentStep < TOUR_STEPS.length - 1) setCurrentStep(s => s + 1);
    else close();
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const close = () => {
    setIsOpen(false);
    setCurrentStep(0);
    localStorage.setItem(TOUR_SEEN_KEY, 'true');
  };

  const open = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <>
      {/* Help trigger */}
      <button
        onClick={open}
        className="inline-flex items-center gap-1.5 text-xs text-primary font-medium px-2.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 active:scale-95 transition-all"
        aria-label="यो पेज कसरी चलाउने?"
      >
        <HelpCircle className="h-4 w-4" />
        <span className="hidden sm:inline">कसरी चलाउने?</span>
        <span className="sm:hidden">?</span>
      </button>

      {/* Tour overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={close} />

          {/* Highlight ring */}
          <div
            className="absolute z-[101] border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] pointer-events-none transition-all duration-300 ease-out"
            style={highlightStyle}
          />

          {/* Tooltip card */}
          <div
            className="z-[102] bg-card rounded-xl shadow-2xl border p-4 transition-all duration-300 ease-out"
            style={tooltipStyle}
          >
            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Progress dots */}
            <div className="flex items-center gap-1 mb-2.5">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === currentStep ? 'w-6 bg-primary' : i < currentStep ? 'w-2 bg-primary/40' : 'w-1.5 bg-muted-foreground/25'
                  )}
                />
              ))}
            </div>

            {/* Step content */}
            <h4 className="font-bold text-sm mb-1.5 text-foreground pr-6">{step.title}</h4>
            <div className="space-y-1 mb-4">
              {step.text.map((line, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                {currentStep + 1} / {TOUR_STEPS.length}
              </span>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button variant="ghost" size="sm" onClick={prev} className="gap-1 h-8 px-3 text-xs">
                    <ChevronLeft className="h-3.5 w-3.5" />
                    अघिल्लो
                  </Button>
                )}
                <Button size="sm" onClick={next} className="gap-1 h-8 px-4 text-xs">
                  {isLast ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      बुझियो
                    </>
                  ) : (
                    <>
                      अर्को
                      <ChevronRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
