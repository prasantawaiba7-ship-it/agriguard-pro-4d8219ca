import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle2, Pill, Shield, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

interface DiseaseAnalysis {
  isHealthy: boolean;
  detectedIssue: string;
  confidence: number;
  severity?: 'mild' | 'moderate' | 'severe';
  affectedPart?: string;
  symptoms?: string[];
  causes?: string[];
  immediateActions?: Array<{
    action: string;
    materials: string;
    frequency: string;
  }>;
  organicTreatment?: {
    name: string;
    preparation: string;
    application: string;
  };
  chemicalTreatment?: {
    name: string;
    dosage: string;
    precautions: string[];
  };
  preventiveMeasures?: string[];
  whenToSeekHelp?: string;
  estimatedRecoveryTime?: string;
}

export function DiseaseDetector() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DiseaseAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-crop-disease`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            imageUrl: selectedImage,
            language
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();
      setAnalysis(result);

      toast({
        title: result.isHealthy ? "Crop looks healthy!" : "Issue detected",
        description: result.detectedIssue,
        variant: result.isHealthy ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : 'Failed to analyze image',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const severityColors = {
    mild: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    moderate: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    severe: 'bg-red-500/10 text-red-600 border-red-500/20'
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          {t('scanForDisease')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">{language === 'ne' ? 'बाली छान्नुहोस्' : 'Select Crop'}</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {[
              { label: 'धान', value: 'Rice', emoji: '🌾' },
              { label: 'गहुँ', value: 'Wheat', emoji: '🌾' },
              { label: 'मकै', value: 'Maize', emoji: '🌽' },
              { label: 'आलु', value: 'Potato', emoji: '🥔' },
              { label: 'गोलभेडा', value: 'Tomato', emoji: '🍅' }
            ].map((crop) => (
              <button
                key={crop.value}
                onClick={() => setSelectedImage(null) /* just placeholder for state logic if needed */}
                className="p-2 rounded-xl border bg-muted/20 border-border/50 hover:bg-muted/40 flex flex-col items-center gap-1 transition-all"
              >
                <span className="text-xl">{crop.emoji}</span>
                <span className="text-[10px] font-medium">{language === 'ne' ? crop.label : crop.value}</span>
              </button>
            ))}
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          capture="environment"
          className="hidden"
        />

        {!selectedImage ? (
          <div
            className="border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-primary/5"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">{t('uploadImage')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Take a close-up photo of the affected leaf, stem, or plant part
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="hero">
                <Camera className="w-4 h-4" />
                {t('takePhoto')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Selected crop"
                className="w-full rounded-xl max-h-64 object-cover"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={clearImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {!analysis && (
              <Button
                className="w-full"
                onClick={analyzeImage}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('analyzing')}
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Analyze Image
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Result Header */}
            <div className={`p-4 rounded-xl ${
              analysis.isHealthy 
                ? 'bg-success/10 border border-success/20' 
                : 'bg-destructive/10 border border-destructive/20'
            }`}>
              <div className="flex items-center gap-3">
                {analysis.isHealthy ? (
                  <CheckCircle2 className="w-8 h-8 text-success" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                )}
                <div>
                  <h3 className="font-semibold text-lg">
                    {analysis.isHealthy ? t('healthyCrop') : t('diseaseDetected')}
                  </h3>
                  <p className="text-sm text-muted-foreground">{analysis.detectedIssue}</p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                <Badge variant="outline">
                  Confidence: {Math.round(analysis.confidence * 100)}%
                </Badge>
                {analysis.severity && (
                  <Badge variant="outline" className={severityColors[analysis.severity]}>
                    {analysis.severity.charAt(0).toUpperCase() + analysis.severity.slice(1)}
                  </Badge>
                )}
                {analysis.affectedPart && (
                  <Badge variant="outline">{analysis.affectedPart}</Badge>
                )}
              </div>
            </div>

            {/* Symptoms */}
            {analysis.symptoms && analysis.symptoms.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">🔍 Symptoms Observed</h4>
                <ul className="text-sm space-y-1">
                  {analysis.symptoms.map((symptom, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary">•</span>
                      {symptom}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Immediate Actions */}
            {analysis.immediateActions && analysis.immediateActions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-primary" />
                  {t('treatment')} Steps
                </h4>
                <div className="space-y-3">
                  {analysis.immediateActions.map((action, i) => (
                    <div key={i} className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium text-sm">{i + 1}. {action.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Materials: {action.materials} | {action.frequency}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Organic Treatment */}
            {analysis.organicTreatment && (
              <div className="p-4 bg-success/5 rounded-xl border border-success/20">
                <h4 className="font-semibold mb-2 text-success">🌿 Organic Treatment</h4>
                <p className="font-medium text-sm">{analysis.organicTreatment.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Preparation:</strong> {analysis.organicTreatment.preparation}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Application:</strong> {analysis.organicTreatment.application}
                </p>
              </div>
            )}

            {/* Prevention */}
            {analysis.preventiveMeasures && analysis.preventiveMeasures.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Prevention Tips
                </h4>
                <ul className="text-sm space-y-1">
                  {analysis.preventiveMeasures.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary">✓</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* When to seek help */}
            {analysis.whenToSeekHelp && (
              <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                <p className="text-sm">
                  <strong>⚠️ Consult Expert:</strong> {analysis.whenToSeekHelp}
                </p>
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={clearImage}>
              Scan Another Image
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
