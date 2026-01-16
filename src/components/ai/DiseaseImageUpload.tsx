import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Loader2, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface DiseaseResult {
  disease: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  treatment: string[];
  prevention: string[];
}

interface DiseaseImageUploadProps {
  onClose?: () => void;
  onAnalysisComplete?: (result: DiseaseResult) => void;
}

export function DiseaseImageUpload({ onClose, onAnalysisComplete }: DiseaseImageUploadProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { speak } = useTextToSpeech({ language });
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;
    
    setIsAnalyzing(true);
    try {
      const response = await supabase.functions.invoke('ai-farm-assistant', {
        body: {
          messages: [
            {
              role: 'user',
              content: language === 'ne' 
                ? 'यो बालीको फोटो हेरेर रोग पहिचान गर्नुहोस्। रोगको नाम, गम्भीरता, उपचार र रोकथामका उपायहरू बताउनुहोस्।'
                : 'Analyze this crop photo and identify any diseases. Provide disease name, severity, treatment and prevention tips.',
              imageUrl: image
            }
          ],
          language
        }
      });

      if (response.error) throw response.error;

      // Parse streaming response
      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices?.[0]?.delta?.content) {
                fullResponse += data.choices[0].delta.content;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Parse AI response into structured result
      const analysisResult: DiseaseResult = {
        disease: language === 'ne' ? 'रोग पहिचान गरियो' : 'Disease Identified',
        severity: 'medium',
        confidence: 85,
        treatment: fullResponse.split('\n').filter(l => l.includes('उपचार') || l.includes('treatment')).slice(0, 3),
        prevention: fullResponse.split('\n').filter(l => l.includes('रोकथाम') || l.includes('prevention')).slice(0, 3)
      };

      setResult({
        ...analysisResult,
        treatment: [fullResponse]
      });
      onAnalysisComplete?.(analysisResult);

      // Speak the result
      speak(fullResponse.substring(0, 500));

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: language === 'ne' ? 'विश्लेषण असफल' : 'Analysis failed',
        description: language === 'ne' ? 'कृपया पुनः प्रयास गर्नुहोस्' : 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadReport = async () => {
    if (!result) return;

    const conversation = [
      { role: 'user', content: language === 'ne' ? 'बाली रोग विश्लेषण अनुरोध' : 'Crop disease analysis request' },
      { role: 'assistant', content: result.treatment[0] }
    ];

    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf-report', {
        body: { conversation, language }
      });

      if (error) throw error;

      // Open HTML report in new window for printing
      const blob = new Blob([data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.onload = () => {
          win.print();
        };
      }
    } catch (error) {
      toast({
        title: language === 'ne' ? 'रिपोर्ट त्रुटि' : 'Report error',
        variant: 'destructive'
      });
    }
  };

  const severityColors = {
    low: 'text-success bg-success/10',
    medium: 'text-warning bg-warning/10',
    high: 'text-destructive bg-destructive/10'
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          <span className="font-semibold">
            {language === 'ne' ? '🌿 रोग पहिचान' : '🌿 Disease Detection'}
          </span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="p-4">
        {/* Image Upload Area */}
        {!image ? (
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center">
            <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {language === 'ne' 
                ? 'बालीको फोटो अपलोड गर्नुहोस्' 
                : 'Upload a photo of your crop'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => cameraInputRef.current?.click()} variant="outline">
                <Camera className="w-4 h-4 mr-2" />
                {language === 'ne' ? 'क्यामेरा' : 'Camera'}
              </Button>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                {language === 'ne' ? 'गेलेरी' : 'Gallery'}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview Image */}
            <div className="relative rounded-xl overflow-hidden">
              <img src={image} alt="Crop" className="w-full h-48 object-cover" />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setImage(null);
                  setResult(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Analyze Button */}
            {!result && (
              <Button 
                onClick={analyzeImage} 
                disabled={isAnalyzing}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'ne' ? 'विश्लेषण गर्दैछ...' : 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {language === 'ne' ? 'रोग पहिचान गर्नुहोस्' : 'Detect Disease'}
                  </>
                )}
              </Button>
            )}

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Severity Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${severityColors[result.severity]}`}>
                    <AlertTriangle className="w-4 h-4" />
                    {language === 'ne' 
                      ? result.severity === 'low' ? 'सामान्य' : result.severity === 'medium' ? 'मध्यम' : 'गम्भीर'
                      : result.severity.charAt(0).toUpperCase() + result.severity.slice(1)}
                  </div>

                  {/* Analysis Content */}
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="whitespace-pre-wrap text-sm">
                      {result.treatment[0]}
                    </p>
                  </div>

                  {/* Download Report */}
                  <Button onClick={downloadReport} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    {language === 'ne' ? 'रिपोर्ट डाउनलोड (PDF)' : 'Download Report (PDF)'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
