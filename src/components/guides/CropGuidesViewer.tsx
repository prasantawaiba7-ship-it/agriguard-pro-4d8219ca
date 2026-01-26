import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useCropGuides, CropGuide, GuideSection, SECTION_LABELS } from '@/hooks/useCropGuides';
import { useLanguage } from '@/hooks/useLanguage';
import { BookOpen, ChevronLeft } from 'lucide-react';

export function CropGuidesViewer() {
  const { language } = useLanguage();
  const { guides, crops, isLoading, getLocalizedContent } = useCropGuides();
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (crops.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>कुनै guide उपलब्ध छैन।</p>
          <p className="text-sm">Admin ले content थप्नु पर्छ।</p>
        </CardContent>
      </Card>
    );
  }

  if (!selectedCrop) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {language === 'ne' ? 'कृषि ज्ञान' : 'Crop Guides'}
        </h2>
        <p className="text-muted-foreground">
          {language === 'ne' ? 'बाली छान्नुहोस्:' : 'Select a crop:'}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {crops.map((crop) => {
            const cropGuides = guides.filter(g => g.crop_name === crop);
            return (
              <Card 
                key={crop} 
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary"
                onClick={() => setSelectedCrop(crop)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">🌾</div>
                  <h3 className="font-medium">{crop}</h3>
                  <Badge variant="secondary" className="mt-2">
                    {cropGuides.length} {language === 'ne' ? 'विषय' : 'topics'}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedCrop(null)}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {language === 'ne' ? 'फिर्ता' : 'Back'}
        </Button>
        <h2 className="text-xl font-semibold">{selectedCrop}</h2>
      </div>

      {filteredGuides.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            यो बालीको लागि guide उपलब्ध छैन।
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {(Object.keys(SECTION_LABELS) as GuideSection[]).map((section) => {
            const sectionGuides = groupedGuides[section];
            if (!sectionGuides || sectionGuides.length === 0) return null;

            const sectionLabel = SECTION_LABELS[section];

            return (
              <AccordionItem key={section} value={section} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{sectionLabel.icon}</span>
                    <span>{language === 'ne' ? sectionLabel.ne : sectionLabel.en}</span>
                    <Badge variant="outline" className="ml-2">
                      {sectionGuides.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {sectionGuides.map((guide) => {
                      const { title, content } = getLocalizedContent(guide);
                      return (
                        <div key={guide.id} className="border-l-2 border-primary pl-4">
                          <h4 className="font-medium mb-2">{title}</h4>
                          <div className="text-sm text-muted-foreground whitespace-pre-line">
                            {content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
