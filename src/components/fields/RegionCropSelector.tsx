import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCrops, Crop } from '@/hooks/useCrops';
import { Search, ChevronLeft, Leaf, ImageOff, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Region groups with Nepali labels
const REGION_GROUPS = [
  { value: 'all', label: 'सबै बाली', emoji: '🌱' },
  { value: 'purbi', label: 'पूर्वी बाली', emoji: '🌄' },
  { value: 'madhya', label: 'मध्य बाली', emoji: '🏔️' },
  { value: 'paschimi', label: 'पश्चिम बाली', emoji: '🌅' },
  { value: 'karnali', label: 'कर्णाली बाली', emoji: '⛰️' },
  { value: 'sudurpashchim', label: 'सुदूरपश्चिम बाली', emoji: '🏞️' },
  { value: 'terai', label: 'तराई बाली', emoji: '🌾' },
  { value: 'pahadi', label: 'पहाडी बाली', emoji: '🌿' },
  { value: 'raithane', label: 'रैथाने बाली', emoji: '🌻' },
];

const CATEGORY_LABELS: Record<string, string> = {
  vegetable: 'तरकारी',
  fruit: 'फलफूल',
  grain: 'अन्न',
  spice: 'मसला',
  pulse: 'दलहन',
  oilseed: 'तेलहन',
  cash_crop: 'नगदे बाली',
  other: 'अन्य',
};

interface RegionCropSelectorProps {
  onCropSelect: (crop: Crop) => void;
  selectedCropId?: number | null;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

export function RegionCropSelector({
  onCropSelect,
  selectedCropId,
  showBackButton = false,
  onBack,
  title = 'बाली छान्नुहोस्',
  subtitle = 'तपाईंको क्षेत्र अनुसार बाली छान्नुहोस्',
}: RegionCropSelectorProps) {
  const { activeCrops, isLoading } = useCrops();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter crops by region and search
  const filteredCrops = useMemo(() => {
    let crops = activeCrops;

    // Filter by region if selected (and not 'all')
    if (selectedRegion && selectedRegion !== 'all') {
      crops = crops.filter(c => 
        c.region_group === selectedRegion || c.region_group === 'all' || !c.region_group
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      crops = crops.filter(c =>
        c.name_ne.toLowerCase().includes(query) ||
        c.name_en.toLowerCase().includes(query) ||
        (c.category && c.category.toLowerCase().includes(query))
      );
    }

    return crops;
  }, [activeCrops, selectedRegion, searchQuery]);

  // Group crops by category
  const cropsByCategory = useMemo(() => {
    return filteredCrops.reduce((acc, crop) => {
      const cat = crop.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(crop);
      return acc;
    }, {} as Record<string, Crop[]>);
  }, [filteredCrops]);

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'vegetable': return '🥬';
      case 'fruit': return '🍎';
      case 'grain': return '🌾';
      case 'spice': return '🌶️';
      case 'pulse': return '🫘';
      case 'oilseed': return '🌻';
      case 'cash_crop': return '💰';
      default: return '🌿';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Step 1: Region selection
  if (!selectedRegion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {showBackButton && onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            फिर्ता
          </Button>
        )}

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <MapPin className="h-4 w-4" />
            <span className="font-medium text-sm">क्षेत्र छान्नुहोस्</span>
          </div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {REGION_GROUPS.map((region, index) => (
            <motion.div
              key={region.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 transition-all active:scale-95 touch-manipulation"
                onClick={() => setSelectedRegion(region.value)}
              >
                <CardContent className="p-4 text-center">
                  <span className="text-3xl mb-2 block">{region.emoji}</span>
                  <span className="font-medium text-sm">{region.label}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Step 2: Crop selection
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedRegion(null)}
          className="-ml-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          क्षेत्र
        </Button>
        <div className="flex-1">
          <h2 className="font-bold">
            {REGION_GROUPS.find(r => r.value === selectedRegion)?.label || 'बाली छान्नुहोस्'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {filteredCrops.length} बाली उपलब्ध
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="बाली खोज्नुहोस्..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {/* Crops by category */}
      <ScrollArea className="h-[400px] sm:h-[500px]">
        <div className="space-y-6 pr-4">
          {Object.entries(cropsByCategory).map(([category, crops]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3 sticky top-0 bg-background py-2">
                <span>{getCategoryEmoji(category)}</span>
                <span>{CATEGORY_LABELS[category] || category}</span>
                <Badge variant="secondary" className="ml-auto">{crops.length}</Badge>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                  {crops.map((crop, index) => (
                    <motion.div
                      key={crop.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Card
                        className={`cursor-pointer group hover:shadow-lg hover:border-primary/50 transition-all active:scale-95 touch-manipulation ${
                          selectedCropId === crop.id ? 'ring-2 ring-primary border-primary' : ''
                        }`}
                        onClick={() => onCropSelect(crop)}
                      >
                        <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
                          {crop.image_url ? (
                            <img
                              src={crop.image_url}
                              alt={crop.name_ne}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-4xl">{getCategoryEmoji(crop.category || 'other')}</span>
                            </div>
                          )}
                          {selectedCropId === crop.id && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <div className="bg-primary text-primary-foreground rounded-full p-1">
                                <Leaf className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-2 text-center">
                          <p className="font-medium text-sm line-clamp-1">{crop.name_ne}</p>
                          <p className="text-xs text-muted-foreground">{crop.name_en}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}

          {filteredCrops.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Leaf className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>कुनै बाली फेला परेन</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
