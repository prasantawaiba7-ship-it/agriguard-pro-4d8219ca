import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Beaker, Leaf, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Field {
  id: string;
  name: string;
  area: number | null;
  area_unit: string;
}

interface NPKRecommendation {
  nitrogen_kg_per_ropani: number;
  phosphorus_kg_per_ropani: number;
  potassium_kg_per_ropani: number;
  urea_kg: number;
  dap_kg: number;
  mop_kg: number;
  advice_ne: string;
  advice_en: string;
  ph_status: string;
  organic_matter_status: string;
}

interface SoilAdvisoryCardProps {
  fields: Field[];
}

const crops = [
  { value: "धान", label: "धान (Rice)" },
  { value: "मकै", label: "मकै (Maize)" },
  { value: "गहुँ", label: "गहुँ (Wheat)" },
  { value: "आलु", label: "आलु (Potato)" },
  { value: "गोलभेंडा", label: "गोलभेंडा (Tomato)" },
  { value: "काउली", label: "काउली (Cauliflower)" },
];

export function SoilAdvisoryCard({ fields }: SoilAdvisoryCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedField, setSelectedField] = useState<string>("");
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [areaRopani, setAreaRopani] = useState<string>("1");
  const [recommendation, setRecommendation] = useState<NPKRecommendation | null>(null);
  const [hasSoilData, setHasSoilData] = useState<boolean | null>(null);

  const getAdvisory = async () => {
    if (!selectedField || !selectedCrop) {
      toast({ title: "खेत र बाली छान्नुहोस्", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("soil-advisory", {
        body: {
          field_id: selectedField,
          crop_name: selectedCrop,
          area_ropani: parseFloat(areaRopani) || 1,
        },
      });

      if (error) throw error;

      setRecommendation(data.recommendation);
      setHasSoilData(data.has_soil_data);
    } catch (error: any) {
      console.error("Error getting soil advisory:", error);
      toast({ title: "त्रुटि भयो", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-secondary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Beaker className="w-5 h-5 text-secondary" />
          माटो र मल सल्लाह
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Form */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>खेत</Label>
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger>
                <SelectValue placeholder="खेत छान्नुहोस्" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>बाली</Label>
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger>
                <SelectValue placeholder="बाली छान्नुहोस्" />
              </SelectTrigger>
              <SelectContent>
                {crops.map((crop) => (
                  <SelectItem key={crop.value} value={crop.value}>
                    {crop.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>क्षेत्रफल (रोपनी)</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={areaRopani}
              onChange={(e) => setAreaRopani(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={getAdvisory} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              गणना गर्दै...
            </>
          ) : (
            <>
              <Leaf className="w-4 h-4 mr-2" />
              मल सिफारिस हेर्नुहोस्
            </>
          )}
        </Button>

        {/* Results */}
        {recommendation && (
          <div className="mt-6 space-y-4">
            {/* Data Status */}
            <div className="flex items-center gap-2">
              {hasSoilData ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  माटो परीक्षण डाटा उपलब्ध
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  अनुमानित मान प्रयोग गरियो
                </Badge>
              )}
            </div>

            {/* NPK Requirements */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10 text-center">
                <div className="text-2xl font-bold text-blue-600">{recommendation.nitrogen_kg_per_ropani}</div>
                <div className="text-xs text-muted-foreground">N (kg/रोपनी)</div>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/10 text-center">
                <div className="text-2xl font-bold text-orange-600">{recommendation.phosphorus_kg_per_ropani}</div>
                <div className="text-xs text-muted-foreground">P (kg/रोपनी)</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-center">
                <div className="text-2xl font-bold text-purple-600">{recommendation.potassium_kg_per_ropani}</div>
                <div className="text-xs text-muted-foreground">K (kg/रोपनी)</div>
              </div>
            </div>

            {/* Fertilizer Amounts */}
            <div className="p-4 rounded-xl bg-muted/50">
              <h4 className="font-semibold mb-2">मल मात्रा ({areaRopani} रोपनीको लागि):</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>युरिया:</span>
                  <span className="font-medium">{recommendation.urea_kg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>डीएपी:</span>
                  <span className="font-medium">{recommendation.dap_kg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>एमओपी:</span>
                  <span className="font-medium">{recommendation.mop_kg} kg</span>
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">pH: {recommendation.ph_status}</Badge>
              <Badge variant="secondary">जैविक पदार्थ: {recommendation.organic_matter_status}</Badge>
            </div>

            {/* Advice */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">सिफारिस:</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{recommendation.advice_ne}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
