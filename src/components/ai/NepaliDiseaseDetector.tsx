import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Upload, X, Loader2, AlertTriangle, CheckCircle2, 
  Download, Leaf, Bug, Shield, Pill, BookOpen, ChevronDown,
  Droplets, ThermometerSun, Wind, Mic, MicOff, Share2, 
  MessageCircle, Phone, History, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useAuth } from '@/hooks/useAuth';
import { 
  useDiseaseHistory, 
  useSaveDiseaseDetection, 
  generateShareText, 
  shareViaWhatsApp, 
  shareViaSMS 
} from '@/hooks/useDiseaseDetection';

// Nepali crop types
const CROP_TYPES = [
  { value: 'rice', label: 'धान', emoji: '🌾' },
  { value: 'wheat', label: 'गहुँ', emoji: '🌾' },
  { value: 'maize', label: 'मकै', emoji: '🌽' },
  { value: 'potato', label: 'आलु', emoji: '🥔' },
  { value: 'tomato', label: 'गोलभेडा', emoji: '🍅' },
  { value: 'pepper', label: 'खुर्सानी', emoji: '🌶️' },
  { value: 'bean', label: 'सिमी', emoji: '🫘' },
];

// Disease database in Nepali
const DISEASE_DATABASE: Record<string, DiseaseInfo[]> = {
  rice: [
    {
      name: 'ब्लास्ट रोग (Blast)',
      symptoms: ['पातमा हल्का खैरो दाग', 'दागको बीचमा सेतो र किनारा खैरो', 'गाँठमा कालो दाग'],
      treatment: 'ट्राइसाइक्लाजोल ०.०६% छर्ने, बियर्ड कार्बेन्डाजिम २ ग्राम/लिटर पानीमा मिसाई छर्ने',
      prevention: ['रोग प्रतिरोधी बिउ प्रयोग', 'नाइट्रोजन मल कम प्रयोग', 'खेतमा पानी व्यवस्थापन'],
      severity: 'high'
    },
    {
      name: 'खैरो धब्बे रोग (Brown Spot)',
      symptoms: ['पातमा खैरो गोलाकार दाग', 'दागमा पहेंलो किनारा', 'बिरुवा कमजोर हुने'],
      treatment: 'म्यान्कोजेब २.५ ग्राम/लिटर पानीमा मिसाई छर्ने',
      prevention: ['सन्तुलित मल प्रयोग', 'पोटास मल प्रयोग', 'खेत सरसफाइ'],
      severity: 'medium'
    }
  ],
  wheat: [
    {
      name: 'रातो रस्ट (Red Rust)',
      symptoms: ['पातमा रातो खैरो धुलो जस्तो दाग', 'पातको तल्लो भागमा बढी', 'पात सुक्ने'],
      treatment: 'प्रोपिकोनाजोल १ मिलि/लिटर पानीमा छर्ने',
      prevention: ['रोग प्रतिरोधी जात', 'समयमै बाली लगाउने', 'संक्रमित बालीको अवशेष नष्ट गर्ने'],
      severity: 'high'
    },
    {
      name: 'पहेंलो रस्ट (Yellow Rust)',
      symptoms: ['पातमा पहेंलो धारीदार दाग', 'पात पहेंलो हुने', 'दाना कम हुने'],
      treatment: 'टेबुकोनाजोल १ मिलि/लिटर पानीमा छर्ने',
      prevention: ['प्रतिरोधी बिउ', 'चिसो मौसममा सावधानी', 'बाली चक्र अपनाउने'],
      severity: 'medium'
    }
  ],
  maize: [
    {
      name: 'टर्सिकम पात झुल्सा (Turcicum Leaf Blight)',
      symptoms: ['पातमा लामो खैरो दाग', 'पात सुक्ने', 'बाली कमजोर हुने'],
      treatment: 'म्यान्कोजेब २.५ ग्राम/लिटर पानीमा छर्ने',
      prevention: ['प्रतिरोधी जात', 'बाली चक्र', 'संक्रमित पात हटाउने'],
      severity: 'medium'
    },
    {
      name: 'मकैको भुण्डी (Stem Borer)',
      symptoms: ['डाँठमा प्वाल', 'पात पहेंलो हुने', 'मध्य पात सुक्ने'],
      treatment: 'कार्बोफुरान ३जी दाना डाँठमा हाल्ने',
      prevention: ['समयमै बाली लगाउने', 'खेत सरसफाइ', 'संक्रमित डाँठ नष्ट गर्ने'],
      severity: 'high'
    }
  ],
  potato: [
    {
      name: 'डढुवा रोग (Late Blight)',
      symptoms: ['पातमा कालो खैरो दाग', 'पात कुहिने', 'आलुमा कालो दाग'],
      treatment: 'रिडोमिल गोल्ड २.५ ग्राम/लिटर पानीमा छर्ने',
      prevention: ['प्रमाणित बिउ', 'पानी जमाव नहुने', 'रोगी बिरुवा उखेल्ने'],
      severity: 'high'
    },
    {
      name: 'अगेती झुल्सा (Early Blight)',
      symptoms: ['पातमा गोलाकार दाग', 'दागमा गोलाकार रिंग', 'तल्लो पात पहिले असर'],
      treatment: 'म्यान्कोजेब २.५ ग्राम/लिटर पानीमा छर्ने',
      prevention: ['बाली चक्र अपनाउने', 'सन्तुलित मल', 'रोगी पात हटाउने'],
      severity: 'medium'
    }
  ],
  tomato: [
    {
      name: 'ढुसी रोग (Powdery Mildew)',
      symptoms: ['पातमा सेतो धुलो', 'पात कुर्चिने', 'फलफूल कम हुने'],
      treatment: 'सल्फर ३ ग्राम/लिटर पानीमा छर्ने वा हेक्साकोनाजोल १ मिलि/लिटर',
      prevention: ['हावा चल्ने ठाउँमा रोप्ने', 'पानी कम दिने', 'रोगी पात हटाउने'],
      severity: 'medium'
    },
    {
      name: 'पातको मोडाइ भाइरस (Leaf Curl Virus)',
      symptoms: ['पात मोडिने', 'पात सानो हुने', 'बिरुवाको वृद्धि रोकिने'],
      treatment: 'भाइरसको प्रत्यक्ष उपचार छैन, सेतो झिंगा नियन्त्रण गर्ने - इमिडाक्लोप्रिड ०.५ मिलि/लिटर',
      prevention: ['रोग मुक्त बिउ', 'सेतो झिंगा नियन्त्रण', 'संक्रमित बिरुवा उखेल्ने'],
      severity: 'high'
    }
  ],
  pepper: [
    {
      name: 'फल कुहाउने रोग (Fruit Rot)',
      symptoms: ['फलमा कालो दाग', 'फल कुहिने', 'फलमा ढुसी'],
      treatment: 'कार्बेन्डाजिम २ ग्राम/लिटर पानीमा छर्ने',
      prevention: ['पानी जमाव नहुने', 'रोगी फल हटाउने', 'हावा चल्ने'],
      severity: 'medium'
    },
    {
      name: 'लाही कीरा (Aphids)',
      symptoms: ['पातमा सानो हरियो/कालो कीरा', 'पात मोडिने', 'बिरुवा कमजोर'],
      treatment: 'इमिडाक्लोप्रिड ०.५ मिलि/लिटर पानीमा छर्ने',
      prevention: ['पहेंलो ट्र्याप राख्ने', 'प्राकृतिक शत्रु संरक्षण', 'नियमित निरीक्षण'],
      severity: 'low'
    }
  ],
  bean: [
    {
      name: 'पातको खैरो दाग (Angular Leaf Spot)',
      symptoms: ['पातमा कोणीय खैरो दाग', 'पात झर्ने', 'बाली कमजोर'],
      treatment: 'कपर अक्सीक्लोराइड ३ ग्राम/लिटर पानीमा छर्ने',
      prevention: ['स्वस्थ बिउ', 'बाली चक्र', 'खेत सरसफाइ'],
      severity: 'medium'
    },
    {
      name: 'मुसा रोग (Root Rot)',
      symptoms: ['जरा कुहिने', 'बिरुवा ओइलाउने', 'पात पहेंलो हुने'],
      treatment: 'कार्बेन्डाजिम २ ग्राम/लिटर पानीमा जरामा हाल्ने',
      prevention: ['राम्रो निकास', 'बाली चक्र', 'अधिक पानी नदिने'],
      severity: 'high'
    }
  ]
};

// Prevention tips in Nepali
const PREVENTION_TIPS = [
  { icon: Leaf, tip: 'रोग प्रतिरोधी बिउ प्रयोग गर्नुहोस्' },
  { icon: Droplets, tip: 'पानी व्यवस्थापन राम्रो गर्नुहोस्' },
  { icon: ThermometerSun, tip: 'मौसम अनुसार बाली लगाउनुहोस्' },
  { icon: Wind, tip: 'हावा चल्ने ठाउँमा रोप्नुहोस्' },
  { icon: Shield, tip: 'नियमित निरीक्षण गर्नुहोस्' },
  { icon: Bug, tip: 'कीरा नियन्त्रणमा ध्यान दिनुहोस्' },
];

interface DiseaseInfo {
  name: string;
  symptoms: string[];
  treatment: string;
  prevention: string[];
  severity: 'low' | 'medium' | 'high';
}

interface AnalysisResult {
  isHealthy: boolean;
  detectedIssue: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  symptoms: string[];
  treatment: string;
  organicTreatment?: string;
  prevention: string[];
  affectedPart?: string;
  whenToSeekHelp?: string;
}

export function NepaliDiseaseDetector() {
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [image, setImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('detect');
  const [symptomDescription, setSymptomDescription] = useState('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { speak } = useTextToSpeech({ language: 'ne' });
  const { user } = useAuth();
  
  // Database hooks
  const { data: diseaseHistory, isLoading: historyLoading } = useDiseaseHistory();
  const saveDetection = useSaveDiseaseDetection();

  // Voice input for symptom description
  const { 
    isListening, 
    isSupported: voiceSupported, 
    transcript, 
    startListening, 
    stopListening,
    resetTranscript 
  } = useVoiceInput({
    language: 'ne',
    continuous: true,
    onResult: (text) => {
      setSymptomDescription(prev => prev ? `${prev} ${text}` : text);
    },
    onError: (error) => {
      toast({
        title: 'आवाज इनपुट त्रुटि',
        description: error,
        variant: 'destructive'
      });
    }
  });

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
      toast({
        title: '🎤 बोल्न सुरु गर्नुहोस्',
        description: 'लक्षणहरू नेपालीमा बोल्नुहोस्...'
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'फाइल ठूलो भयो',
        description: '१० MB भन्दा सानो फाइल छान्नुहोस्',
        variant: 'destructive'
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  }, []);

  const analyzeImage = async () => {
    if (!image) {
      toast({
        title: 'फोटो छान्नुहोस्',
        description: 'पहिले बालीको फोटो अपलोड गर्नुहोस्',
        variant: 'destructive'
      });
      return;
    }

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
            imageUrl: image,
            cropType: selectedCrop,
            description: symptomDescription || undefined,
            language: 'ne'
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('सेवा व्यस्त छ। कृपया केही समय पछि प्रयास गर्नुहोस्।');
        }
        throw new Error('विश्लेषण असफल भयो');
      }

      const data = await response.json();
      
      const analysisResult: AnalysisResult = {
        isHealthy: data.isHealthy ?? false,
        detectedIssue: data.detectedIssue || 'रोग पहिचान गरियो',
        confidence: data.confidence || 0.85,
        severity: data.severity || 'medium',
        symptoms: data.symptoms || [],
        treatment: data.chemicalTreatment?.name 
          ? `${data.chemicalTreatment.name} - ${data.chemicalTreatment.dosage}`
          : data.immediateActions?.[0]?.action || 'विशेषज्ञसँग सल्लाह लिनुहोस्',
        organicTreatment: data.organicTreatment 
          ? `${data.organicTreatment.name}: ${data.organicTreatment.preparation}`
          : undefined,
        prevention: data.preventiveMeasures || [],
        affectedPart: data.affectedPart,
        whenToSeekHelp: data.whenToSeekHelp
      };

      setResult(analysisResult);

      // Save to database if user is logged in
      if (user && image && !analysisResult.isHealthy) {
        saveDetection.mutate({
          imageUrl: image.substring(0, 500), // Store truncated data URL or use storage
          detectedDisease: analysisResult.detectedIssue,
          severity: analysisResult.severity,
          confidence: analysisResult.confidence,
          treatment: analysisResult.treatment,
          organicTreatment: analysisResult.organicTreatment,
          prevention: analysisResult.prevention,
        });
      }

      // Speak the result
      const speechText = analysisResult.isHealthy 
        ? 'तपाईंको बाली स्वस्थ देखिन्छ।'
        : `रोग पहिचान: ${analysisResult.detectedIssue}। उपचार: ${analysisResult.treatment}`;
      speak(speechText);

      toast({
        title: analysisResult.isHealthy ? '✅ बाली स्वस्थ छ!' : '⚠️ रोग पहिचान भयो',
        description: analysisResult.detectedIssue,
        variant: analysisResult.isHealthy ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'विश्लेषण असफल',
        description: error instanceof Error ? error.message : 'कृपया पुनः प्रयास गर्नुहोस्',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;

    const cropLabel = CROP_TYPES.find(c => c.value === selectedCrop)?.label || 'बाली';
    const date = new Date().toLocaleDateString('ne-NP');
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="ne">
<head>
  <meta charset="UTF-8">
  <title>बाली रोग विश्लेषण रिपोर्ट</title>
  <style>
    body { 
      font-family: 'Noto Sans Devanagari', Arial, sans-serif; 
      padding: 40px; 
      max-width: 800px; 
      margin: 0 auto;
      color: #333;
    }
    .header { 
      text-align: center; 
      border-bottom: 3px solid #16a34a; 
      padding-bottom: 20px; 
      margin-bottom: 30px;
    }
    .header h1 { color: #16a34a; margin-bottom: 10px; }
    .severity-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
      margin: 10px 0;
    }
    .severity-low { background: #dcfce7; color: #166534; }
    .severity-medium { background: #fef3c7; color: #92400e; }
    .severity-high { background: #fee2e2; color: #991b1b; }
    .section { 
      margin: 25px 0; 
      padding: 20px; 
      background: #f9fafb; 
      border-radius: 10px;
      border-left: 4px solid #16a34a;
    }
    .section h3 { color: #16a34a; margin-bottom: 15px; }
    .section ul { padding-left: 20px; }
    .section li { margin: 8px 0; line-height: 1.6; }
    .treatment-box {
      background: #ecfdf5;
      border: 1px solid #16a34a;
      padding: 15px;
      border-radius: 8px;
      margin-top: 10px;
    }
    .footer { 
      text-align: center; 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    @media print {
      body { padding: 20px; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌿 बाली रोग विश्लेषण रिपोर्ट</h1>
    <p>मिति: ${date}</p>
    <p>बाली: ${cropLabel}</p>
  </div>
  
  <div class="section">
    <h3>📋 निदान</h3>
    <p><strong>पहिचान:</strong> ${result.detectedIssue}</p>
    <p><strong>विश्वासनियता:</strong> ${Math.round(result.confidence * 100)}%</p>
    <span class="severity-badge severity-${result.severity}">
      ${result.severity === 'low' ? 'सामान्य' : result.severity === 'medium' ? 'मध्यम' : 'गम्भीर'}
    </span>
    ${result.affectedPart ? `<p><strong>प्रभावित भाग:</strong> ${result.affectedPart}</p>` : ''}
  </div>

  ${result.symptoms.length > 0 ? `
  <div class="section">
    <h3>🔍 लक्षणहरू</h3>
    <ul>
      ${result.symptoms.map(s => `<li>${s}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="section">
    <h3>💊 उपचार विधि</h3>
    <div class="treatment-box">
      <p>${result.treatment}</p>
    </div>
    ${result.organicTreatment ? `
    <h4 style="margin-top: 15px;">🌿 जैविक उपचार:</h4>
    <p>${result.organicTreatment}</p>
    ` : ''}
  </div>

  ${result.prevention.length > 0 ? `
  <div class="section">
    <h3>🛡️ रोकथामका उपायहरू</h3>
    <ul>
      ${result.prevention.map(p => `<li>${p}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${result.whenToSeekHelp ? `
  <div class="section" style="border-left-color: #f59e0b;">
    <h3>⚠️ विशेषज्ञ सल्लाह</h3>
    <p>${result.whenToSeekHelp}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>यो रिपोर्ट AI द्वारा उत्पन्न भएको हो। गम्भीर समस्याको लागि कृषि विशेषज्ञसँग सल्लाह लिनुहोस्।</p>
    <p>© कृषि मित्र - नेपाल</p>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => {
        setTimeout(() => win.print(), 500);
      };
    }
  };

  // Share functions
  const handleShareWhatsApp = () => {
    if (!result) return;
    const text = generateShareText({
      detectedDisease: result.detectedIssue,
      severity: result.severity,
      treatment: result.treatment,
      prevention: result.prevention,
    });
    shareViaWhatsApp(text);
  };

  const handleShareSMS = () => {
    if (!result) return;
    const text = generateShareText({
      detectedDisease: result.detectedIssue,
      severity: result.severity,
      treatment: result.treatment,
      prevention: result.prevention,
    });
    shareViaSMS(text);
  };

  const severityColors: Record<string, string> = {
    low: 'bg-success/10 text-success border-success/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    high: 'bg-destructive/10 text-destructive border-destructive/20'
  };

  const severityLabels: Record<string, string> = {
    low: 'सामान्य',
    medium: 'मध्यम',
    high: 'गम्भीर'
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Leaf className="w-6 h-6 text-primary" />
          🌿 नेपाली बाली रोग पहिचान प्रणाली
        </CardTitle>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 m-4 max-w-[calc(100%-2rem)]">
          <TabsTrigger value="detect" className="flex items-center gap-1 text-xs sm:text-sm">
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">रोग पहिचान</span>
            <span className="sm:hidden">पहिचान</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1 text-xs sm:text-sm">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">इतिहास</span>
            <span className="sm:hidden">इतिहास</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-1 text-xs sm:text-sm">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">रोग पुस्तिका</span>
            <span className="sm:hidden">पुस्तिका</span>
          </TabsTrigger>
          <TabsTrigger value="tips" className="flex items-center gap-1 text-xs sm:text-sm">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">रोकथाम</span>
            <span className="sm:hidden">रोकथाम</span>
          </TabsTrigger>
        </TabsList>

        {/* Disease Detection Tab */}
        <TabsContent value="detect" className="p-4 pt-0 space-y-4">
          {/* Crop Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">बालीको प्रकार छान्नुहोस्:</label>
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="बाली छान्नुहोस्..." />
              </SelectTrigger>
              <SelectContent>
                {CROP_TYPES.map((crop) => (
                  <SelectItem key={crop.value} value={crop.value}>
                    {crop.emoji} {crop.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Voice Input for Symptom Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                🎤 लक्षण बर्णन गर्नुहोस् (ऐच्छिक):
              </label>
              {voiceSupported && (
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="sm"
                  onClick={toggleVoiceInput}
                  className="gap-2"
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      रोक्नुहोस्
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      बोल्नुहोस्
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="relative">
              <Textarea
                placeholder="उदाहरण: पातमा खैरो दाग देखिएको छ, पात पहेंलो भएको छ..."
                value={symptomDescription || transcript}
                onChange={(e) => setSymptomDescription(e.target.value)}
                rows={3}
                className={`resize-none ${isListening ? 'border-primary ring-2 ring-primary/20' : ''}`}
              />
              {isListening && (
                <motion.div
                  className="absolute top-2 right-2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                </motion.div>
              )}
            </div>
            {isListening && transcript && (
              <p className="text-xs text-muted-foreground">
                सुन्दै: {transcript}
              </p>
            )}
            {!voiceSupported && (
              <p className="text-xs text-muted-foreground">
                💡 आफ्नो ब्राउजरमा आवाज इनपुट उपलब्ध छैन
              </p>
            )}
          </div>

          {/* Image Upload Area */}
          {!image ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                ${isDragging 
                  ? 'border-primary bg-primary/10 scale-[1.02]' 
                  : 'border-muted-foreground/30 hover:border-primary/50 bg-muted/20'
                }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                📸 बालीको फोटो अपलोड गर्नुहोस्
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                प्रभावित पात, डाँठ वा फलको नजिकबाट फोटो खिच्नुहोस्
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  क्यामेरा खोल्नुहोस्
                </Button>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  गेलेरीबाट छान्नुहोस्
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                वा फोटो यहाँ ड्र्याग एन्ड ड्रप गर्नुहोस्
              </p>
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
                <img 
                  src={image} 
                  alt="बाली फोटो" 
                  className="w-full h-64 object-cover"
                />
                <Button
                  variant="destructive"
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
                      विश्लेषण गर्दैछ...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      विश्लेषण गर्नुहोस्
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
                    {/* Result Header */}
                    <div className={`p-4 rounded-xl border ${
                      result.isHealthy 
                        ? 'bg-success/10 border-success/20' 
                        : 'bg-destructive/10 border-destructive/20'
                    }`}>
                      <div className="flex items-center gap-3">
                        {result.isHealthy ? (
                          <CheckCircle2 className="w-8 h-8 text-success" />
                        ) : (
                          <AlertTriangle className="w-8 h-8 text-destructive" />
                        )}
                        <div>
                          <h3 className="font-semibold text-lg">
                            {result.isHealthy ? '✅ बाली स्वस्थ छ!' : '⚠️ रोग पहिचान भयो'}
                          </h3>
                          <p className="text-sm text-muted-foreground">{result.detectedIssue}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <Badge variant="outline">
                          विश्वास: {Math.round(result.confidence * 100)}%
                        </Badge>
                        <Badge variant="outline" className={severityColors[result.severity]}>
                          {severityLabels[result.severity]}
                        </Badge>
                        {result.affectedPart && (
                          <Badge variant="outline">{result.affectedPart}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Symptoms */}
                    {result.symptoms.length > 0 && (
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          🔍 लक्षणहरू
                        </h4>
                        <ul className="text-sm space-y-1">
                          {result.symptoms.map((symptom, i) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <span className="text-primary">•</span>
                              {symptom}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Treatment */}
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Pill className="w-4 h-4 text-primary" />
                        💊 उपचार विधि
                      </h4>
                      <p className="text-sm">{result.treatment}</p>
                      {result.organicTreatment && (
                        <div className="mt-3 p-3 bg-success/10 rounded-lg">
                          <p className="text-sm font-medium text-success">🌿 जैविक उपचार:</p>
                          <p className="text-sm text-muted-foreground">{result.organicTreatment}</p>
                        </div>
                      )}
                    </div>

                    {/* Prevention */}
                    {result.prevention.length > 0 && (
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          🛡️ रोकथामका उपायहरू
                        </h4>
                        <ul className="text-sm space-y-1">
                          {result.prevention.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <span className="text-success">✓</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* When to seek help */}
                    {result.whenToSeekHelp && (
                      <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                        <p className="text-sm">
                          <strong>⚠️ विशेषज्ञ सल्लाह:</strong> {result.whenToSeekHelp}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                      {/* Share buttons */}
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleShareWhatsApp} 
                          variant="outline" 
                          className="flex-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 border-[#25D366]/30"
                        >
                          <MessageCircle className="w-4 h-4 mr-2 text-[#25D366]" />
                          WhatsApp
                        </Button>
                        <Button 
                          onClick={handleShareSMS} 
                          variant="outline" 
                          className="flex-1"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          SMS
                        </Button>
                      </div>
                      
                      {/* Download and new analysis */}
                      <div className="flex gap-3">
                        <Button onClick={downloadReport} variant="outline" className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                        <Button 
                          variant="secondary" 
                          className="flex-1"
                          onClick={() => {
                            setImage(null);
                            setResult(null);
                            setSymptomDescription('');
                          }}
                        >
                          नयाँ विश्लेषण
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="p-4 pt-0 space-y-4">
          {!user ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">इतिहास हेर्न लगइन गर्नुहोस्</p>
              <p className="text-xs">तपाईंको विश्लेषण इतिहास सुरक्षित गर्न खाता चाहिन्छ</p>
            </div>
          ) : historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : diseaseHistory && diseaseHistory.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                तपाईंको विगतका {diseaseHistory.length} विश्लेषणहरू:
              </p>
              {diseaseHistory.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-card rounded-xl border border-border/50 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedHistoryItem(selectedHistoryItem === item.id ? null : item.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Bug className="w-4 h-4 text-destructive" />
                        <span className="font-medium">{item.detected_disease || 'रोग पहिचान'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.analyzed_at).toLocaleDateString('ne-NP')}
                      </div>
                    </div>
                    {item.severity && (
                      <Badge className={severityColors[item.severity] || severityColors.medium}>
                        {severityLabels[item.severity] || item.severity}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Expanded details */}
                  <AnimatePresence>
                    {selectedHistoryItem === item.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-border/50 space-y-3"
                      >
                        {item.treatment_recommendations && (
                          <div>
                            <p className="text-xs font-medium mb-1">💊 उपचार:</p>
                            <p className="text-xs text-muted-foreground">
                              {typeof item.treatment_recommendations === 'object' 
                                ? (item.treatment_recommendations as any).chemical || 'N/A'
                                : String(item.treatment_recommendations)}
                            </p>
                          </div>
                        )}
                        {item.prevention_tips && item.prevention_tips.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1">🛡️ रोकथाम:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {item.prevention_tips.slice(0, 3).map((tip, i) => (
                                <li key={i}>• {tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {item.confidence_score && (
                          <p className="text-xs text-muted-foreground">
                            विश्वास: {Math.round(item.confidence_score * 100)}%
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>कुनै विश्लेषण इतिहास छैन</p>
              <p className="text-xs mt-1">रोग पहिचान गर्दा स्वतः सुरक्षित हुनेछ</p>
            </div>
          )}
        </TabsContent>

        {/* Disease Database Tab */}
        <TabsContent value="database" className="p-4 pt-0 space-y-4">
          <p className="text-sm text-muted-foreground">
            बाली छानेर त्यसका सामान्य रोगहरू हेर्नुहोस्:
          </p>
          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger>
              <SelectValue placeholder="बाली छान्नुहोस्..." />
            </SelectTrigger>
            <SelectContent>
              {CROP_TYPES.map((crop) => (
                <SelectItem key={crop.value} value={crop.value}>
                  {crop.emoji} {crop.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCrop && DISEASE_DATABASE[selectedCrop] && (
            <div className="space-y-4">
              {DISEASE_DATABASE[selectedCrop].map((disease, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-card rounded-xl border border-border/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{disease.name}</h4>
                    <Badge className={severityColors[disease.severity]}>
                      {severityLabels[disease.severity]}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-primary mb-1">🔍 लक्षणहरू:</p>
                      <ul className="text-muted-foreground space-y-1">
                        {disease.symptoms.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="p-3 bg-primary/5 rounded-lg">
                      <p className="font-medium text-primary mb-1">💊 उपचार:</p>
                      <p className="text-muted-foreground">{disease.treatment}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-success mb-1">🛡️ रोकथाम:</p>
                      <ul className="text-muted-foreground space-y-1">
                        {disease.prevention.map((p, i) => (
                          <li key={i}>✓ {p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!selectedCrop && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>बाली छानेर रोगहरूको जानकारी हेर्नुहोस्</p>
            </div>
          )}
        </TabsContent>

        {/* Prevention Tips Tab */}
        <TabsContent value="tips" className="p-4 pt-0 space-y-4">
          <div className="text-center mb-4">
            <h3 className="font-semibold text-lg">🛡️ रोग रोकथामका सुझावहरू</h3>
            <p className="text-sm text-muted-foreground">
              यी उपायहरू अपनाएर बालीको रोग रोक्न सकिन्छ
            </p>
          </div>

          <div className="grid gap-3">
            {PREVENTION_TIPS.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <tip.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium">{tip.tip}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-warning/10 rounded-xl border border-warning/20">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              ⚠️ महत्त्वपूर्ण सुझाव
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• रोग देखिएपछि तुरुन्त उपचार गर्नुहोस्</li>
              <li>• रासायनिक औषधि प्रयोग गर्दा सुरक्षा उपकरण लगाउनुहोस्</li>
              <li>• गम्भीर समस्यामा नजिकको कृषि केन्द्रमा सम्पर्क गर्नुहोस्</li>
              <li>• जैविक उपायलाई प्राथमिकता दिनुहोस्</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
