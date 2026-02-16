import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  Camera, Upload, X, Loader2, AlertTriangle, CheckCircle2, 
  Download, Leaf, Bug, Shield, Pill, BookOpen, ChevronDown,
  Droplets, ThermometerSun, Wind, Mic, MicOff, Share2, 
  MessageCircle, Phone, History, Calendar, Bell, Image, Grid3X3,
  MapPin, ImageDown, FileText
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
import { uploadDiseaseImage } from '@/lib/uploadDiseaseImage';
import { useNotifications, useOutbreakAlertChecker } from '@/hooks/useNotifications';
import { useGeolocation } from '@/hooks/useGeolocation';
import { TreatmentGuideCard } from './TreatmentGuideCard';
import { useLanguage } from '@/hooks/useLanguage';

// Default Nepali crop types (fallback if admin hasn't configured)
const DEFAULT_CROP_TYPES = [
  { value: 'rice', label: 'धान', emoji: '🌾' },
  { value: 'wheat', label: 'गहुँ', emoji: '🌾' },
  { value: 'maize', label: 'मकै', emoji: '🌽' },
  { value: 'potato', label: 'आलु', emoji: '🥔' },
  { value: 'tomato', label: 'गोलभेडा', emoji: '🍅' },
  { value: 'pepper', label: 'खुर्सानी', emoji: '🌶️' },
  { value: 'bean', label: 'सिमी', emoji: '🫘' },
  { value: 'sugarcane', label: 'उखु', emoji: '🎋' },
  { value: 'vegetables', label: 'तरकारी', emoji: '🥬' },
  { value: 'fruits', label: 'फलफूल', emoji: '🍎' },
];

// Emoji mapping for admin-added crops
const CROP_EMOJI_MAP: Record<string, string> = {
  rice: '🌾', wheat: '🌾', maize: '🌽', potato: '🥔', tomato: '🍅',
  pepper: '🌶️', bean: '🫘', sugarcane: '🎋', vegetables: '🥬', fruits: '🍎',
  default: '🌱'
};

// Common pests database in Nepali
const PEST_DATABASE: Record<string, PestInfo[]> = {
  rice: [
    {
      name: 'गाँडे कीरा (Stem Borer)',
      scientificName: 'Scirpophaga incertulas',
      symptoms: ['डाँठमा प्वाल', 'मध्य पात सुक्ने (Dead Heart)', 'सेतो बाला (White Ear)'],
      control: 'कार्बोफुरान ३जी दाना प्रयोग, ट्राइकोग्रामा अण्डा पराजीवी प्रयोग',
      prevention: ['खेत सरसफाइ', 'अण्डाको समूह नष्ट गर्ने', 'प्रकाश पासो प्रयोग'],
      biologicalControl: ['ट्राइकोग्रामा', 'जाइनिड मक्खी'],
      severity: 'high',
      activeSeasons: ['असार-साउन', 'कात्तिक-मंसिर']
    },
    {
      name: 'भूरो फड्के (Brown Planthopper)',
      scientificName: 'Nilaparvata lugens',
      symptoms: ['पातमा पहेंलो दाग', 'बिरुवा कमजोर', 'होपरबर्न देखिने'],
      control: 'इमिडाक्लोप्रिड ०.५ मिलि/लिटर, बुप्रोफेजिन छर्ने',
      prevention: ['नाइट्रोजन मल नियन्त्रित', 'पानी व्यवस्थापन', 'प्रतिरोधी जात'],
      biologicalControl: ['माकुरा', 'मिरिड बग'],
      severity: 'high',
      activeSeasons: ['भदौ-असोज']
    }
  ],
  maize: [
    {
      name: 'फल आर्मीवर्म (Fall Armyworm)',
      scientificName: 'Spodoptera frugiperda',
      symptoms: ['पातमा ठूलो प्वाल', 'फंडा खाइएको', 'विष्टा देखिने'],
      control: 'स्पिनोसाड ०.५ मिलि/लिटर, क्लोरान्ट्रानिलिप्रोल छर्ने',
      prevention: ['बालीको अवशेष नष्ट', 'समयमै बाली लगाउने', 'फेरोमोन ट्र्याप'],
      biologicalControl: ['ट्राइकोग्रामा', 'ब्रेकोनिड वास्प'],
      severity: 'high',
      activeSeasons: ['जेठ-असार', 'भदौ-असोज']
    },
    {
      name: 'मकै भुण्डी (Maize Stem Borer)',
      scientificName: 'Chilo partellus',
      symptoms: ['डाँठमा प्वाल', 'पात पहेंलो', 'बाली ढल्ने'],
      control: 'कार्बोफुरान ३जी दाना डाँठमा हाल्ने',
      prevention: ['बाली चक्र', 'संक्रमित डाँठ नष्ट', 'समयमा रोप्ने'],
      biologicalControl: ['कोटेसिया', 'ट्राइकोग्रामा'],
      severity: 'high',
      activeSeasons: ['असार-साउन']
    }
  ],
  potato: [
    {
      name: 'आलु भुवा किट (Potato Tuber Moth)',
      scientificName: 'Phthorimaea operculella',
      symptoms: ['आलुमा सुरुङ', 'पातमा खनिज', 'भण्डारमा क्षति'],
      control: 'डायक्लोरभोस स्प्रे, भण्डारमा बालुवा तह',
      prevention: ['गहिरो रोप्ने', 'समयमा खन्ने', 'भण्डार सरसफाइ'],
      biologicalControl: ['ग्रानुलोसिस भाइरस'],
      severity: 'medium',
      activeSeasons: ['फागुन-चैत']
    },
    {
      name: 'लाही (Aphids)',
      scientificName: 'Myzus persicae',
      symptoms: ['पातमा सानो कीरा समूह', 'पात मोडिने', 'मधुरस देखिने'],
      control: 'इमिडाक्लोप्रिड ०.५ मिलि/लिटर, निम तेल ३ मिलि/लिटर',
      prevention: ['पहेंलो ट्र्याप', 'प्राकृतिक शत्रु संरक्षण'],
      biologicalControl: ['लेडीबर्ड बीटल', 'सिर्फिड फ्लाई'],
      severity: 'medium',
      activeSeasons: ['माघ-फागुन']
    }
  ],
  tomato: [
    {
      name: 'टुटा एब्सोल्युटा (Tomato Leaf Miner)',
      scientificName: 'Tuta absoluta',
      symptoms: ['पातमा खनिज', 'फलमा प्वाल', 'पात सुक्ने'],
      control: 'स्पिनोसाड, अबामेक्टिन छर्ने',
      prevention: ['फेरोमोन ट्र्याप', 'संक्रमित पात हटाउने', 'नेट हाउस'],
      biologicalControl: ['ट्राइकोग्रामा', 'नेस्टिडियोकोरिस'],
      severity: 'high',
      activeSeasons: ['वर्षभरि']
    },
    {
      name: 'सेतो झिंगा (Whitefly)',
      scientificName: 'Bemisia tabaci',
      symptoms: ['पातमा सानो सेतो कीरा', 'पात पहेंलो', 'भाइरस फैलाउने'],
      control: 'इमिडाक्लोप्रिड, निम तेल छर्ने',
      prevention: ['पहेंलो स्टिकी ट्र्याप', 'रोपाइँ समय मिलाउने'],
      biologicalControl: ['एनकार्सिया फोर्मोसा'],
      severity: 'high',
      activeSeasons: ['जेठ-भदौ']
    }
  ],
  pepper: [
    {
      name: 'थ्रिप्स (Thrips)',
      scientificName: 'Scirtothrips dorsalis',
      symptoms: ['पात कुर्चिने', 'फूल झर्ने', 'फलमा दाग'],
      control: 'स्पिनोसाड, फिप्रोनिल छर्ने',
      prevention: ['निलो स्टिकी ट्र्याप', 'मल्चिङ'],
      biologicalControl: ['प्रेडेटरी माइट'],
      severity: 'medium',
      activeSeasons: ['चैत-जेठ']
    },
    {
      name: 'फल बेध्ने कीरा (Fruit Borer)',
      scientificName: 'Helicoverpa armigera',
      symptoms: ['फलमा प्वाल', 'फल कुहिने', 'किटको विष्टा देखिने'],
      control: 'एचएनपीभी, स्पिनोसाड छर्ने',
      prevention: ['फेरोमोन ट्र्याप', 'संक्रमित फल नष्ट'],
      biologicalControl: ['ट्राइकोग्रामा', 'ब्रेकोनिड'],
      severity: 'high',
      activeSeasons: ['भदौ-कात्तिक']
    }
  ],
  vegetables: [
    {
      name: 'डायमण्ड ब्याक मथ',
      scientificName: 'Plutella xylostella',
      symptoms: ['पातमा प्वाल', 'पातको छाला मात्र बाँकी', 'सानो हरियो कीरा'],
      control: 'बीटी, स्पिनोसाड छर्ने',
      prevention: ['ट्र्याप क्रप', 'बाली चक्र'],
      biologicalControl: ['डायाडेग्मा', 'कोटेसिया'],
      severity: 'high',
      activeSeasons: ['माघ-चैत']
    },
    {
      name: 'रातो खपटे (Red Spider Mite)',
      scientificName: 'Tetranychus urticae',
      symptoms: ['पातमा रातो दाग', 'जालो देखिने', 'पात सुक्ने'],
      control: 'डायकोफोल, अबामेक्टिन छर्ने',
      prevention: ['पानी छर्ने', 'आर्द्रता बढाउने'],
      biologicalControl: ['फाइटोसियुलस माइट'],
      severity: 'medium',
      activeSeasons: ['चैत-जेठ']
    }
  ]
};

interface PestInfo {
  name: string;
  scientificName: string;
  symptoms: string[];
  control: string;
  prevention: string[];
  biologicalControl: string[];
  severity: 'low' | 'medium' | 'high';
  activeSeasons: string[];
}

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
  { icon: Leaf, tipKey: 'prevTip1' },
  { icon: Droplets, tipKey: 'prevTip2' },
  { icon: ThermometerSun, tipKey: 'prevTip3' },
  { icon: Wind, tipKey: 'prevTip4' },
  { icon: Shield, tipKey: 'prevTip5' },
  { icon: Bug, tipKey: 'prevTip6' },
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
  issueType: 'disease' | 'pest' | 'deficiency' | 'healthy';
  detectedIssue: string;
  detectedIssueEnglish?: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  symptoms: string[];
  treatment: string;
  organicTreatment?: string;
  prevention: string[];
  affectedPart?: string;
  whenToSeekHelp?: string;
  pestInfo?: {
    scientificName?: string;
    lifecycle?: string;
    activeSeasons?: string[];
    hostCrops?: string[];
  };
  biologicalControl?: {
    naturalEnemies?: string[];
    trapCrops?: string[];
    culturalPractices?: string[];
  };
  // New fields from unified prompt
  nepaliReport?: string;
  recommended_chemicals?: Array<{
    name: string;
    dose: string;
    usage_note?: string;
  }>;
  organic_treatment?: {
    name: string;
    preparation: string;
    application: string;
  };
  possible_alternatives?: string[];
}

const CROP_OPTIONS = [
  "धान", "गहुँ", "मकै", "टमाटर", "बन्दा", "काउली",
  "आलु", "कफी", "सुन्तला", "केरा", "धान (Basmati)", "Paddy", "Wheat", "Maize"
];

const normalizeText = (value: string) =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .trim();

export function NepaliDiseaseDetector() {
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [cropName, setCropName] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const filteredCrops = CROP_OPTIONS.filter((c) =>
    normalizeText(c).includes(normalizeText(cropName))
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('detect');
  const [symptomDescription, setSymptomDescription] = useState('');
  const [cropTypes, setCropTypes] = useState<Array<{ value: string; label: string; emoji: string }>>(DEFAULT_CROP_TYPES);
  const [cropsLoading, setCropsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const { speak } = useTextToSpeech({ language });
  const { user } = useAuth();
  
  // Database hooks
  const { data: diseaseHistory, isLoading: historyLoading } = useDiseaseHistory();
  const saveDetection = useSaveDiseaseDetection();
  
  // Notifications and outbreak alerts
  const { outbreakAlerts, enablePushNotifications, isPushSupported } = useNotifications();
  useOutbreakAlertChecker();

  // Geolocation for farmer location
  const { 
    locationName, 
    isLoading: locationLoading, 
    error: locationError, 
    fetchLocation,
    isSupported: geoSupported 
  } = useGeolocation({ autoFetch: true });

  // Fetch crops from app_settings (admin-managed)
  useEffect(() => {
    const fetchCrops = async () => {
      setCropsLoading(true);
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'crops_list')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching crops:', error);
        }

        if (data?.value && Array.isArray(data.value)) {
          // Transform admin-managed crops to the format we need
          const adminCrops = (data.value as Array<{ 
            id: string; 
            name: string; 
            name_ne: string; 
            is_active: boolean 
          }>)
            .filter(crop => crop.is_active)
            .map(crop => ({
              value: crop.name.toLowerCase().replace(/\s+/g, '_'),
              label: language === 'ne' ? (crop.name_ne || crop.name) : crop.name,
              emoji: CROP_EMOJI_MAP[crop.name.toLowerCase()] || CROP_EMOJI_MAP.default
            }));
          
          if (adminCrops.length > 0) {
            setCropTypes(adminCrops);
          }
        }
      } catch (error) {
        console.error('Error fetching crops:', error);
        // Keep default crops on error
      } finally {
        setCropsLoading(false);
      }
    };

    fetchCrops();
  }, [language]);

  // Voice input for symptom description
  const { 
    isListening, 
    isSupported: voiceSupported, 
    transcript, 
    interimTranscript,
    startListening, 
    stopListening,
    resetTranscript 
  } = useVoiceInput({
    language: language === 'en' ? 'en-US' : 'ne-NP',
    continuous: true,
    onResult: (text) => {
      setSymptomDescription(prev => prev ? `${prev} ${text}` : text);
    },
    onError: (error) => {
      toast({
        title: t('voiceInputError'),
        description: error,
        variant: 'destructive'
      });
    }
  });

  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
      toast({
        title: t('recordingStopped'),
        description: t('voiceSaved')
      });
    } else {
      resetTranscript();
      setSymptomDescription(''); // Clear previous text when starting new recording
      startListening();
      toast({
        title: t('startSpeaking'),
        description: t('speakSymptomsNepali')
      });
    }
  }, [isListening, stopListening, startListening, resetTranscript, toast, t]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('fileTooLarge'),
        description: t('fileSizeLimit'),
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
         title: t('selectPhotoFirst'),
         description: t('uploadPhotoFirst'),
         variant: 'destructive'
       });
       return;
     }

     if (!cropName.trim()) {
       toast({
         title: t('selectCropType'),
         description: t('selectCropPlaceholder'),
         variant: 'destructive'
       });
       return;
     }

    setIsAnalyzing(true);
    let uploadedImageUrl: string | null = null;
    
    try {
      // Upload image to storage first if user is logged in
      if (user) {
        try {
          uploadedImageUrl = await uploadDiseaseImage(image, user.id);
        } catch (uploadError) {
          console.warn('Image upload failed, continuing with data URL:', uploadError);
        }
      }
      
      // Use uploaded URL or fallback to data URL for analysis
      const imageForAnalysis = uploadedImageUrl || image;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-crop-disease`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
             imageUrl: imageForAnalysis,
             cropType: cropName,
             description: symptomDescription || undefined,
             language
           }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(t('serviceBusy'));
        }
        throw new Error(t('analysisFailed'));
      }

      const data = await response.json();
      
      const analysisResult: AnalysisResult = {
        isHealthy: data.isHealthy ?? false,
        issueType: data.issueType || (data.isHealthy ? 'healthy' : 'disease'),
        detectedIssue: data.detectedIssue || t('diseaseDetected'),
        detectedIssueEnglish: data.detectedIssueEnglish,
        confidence: data.confidence || 0.85,
        severity: data.severity === 'mild' ? 'low' : data.severity === 'moderate' ? 'medium' : data.severity === 'severe' ? 'high' : data.severity || 'medium',
        symptoms: data.symptoms || [],
        treatment: data.chemicalTreatment?.name 
          ? `${data.chemicalTreatment.name} - ${data.chemicalTreatment.dosage}`
          : data.immediateActions?.[0]?.action || t('expertAdviceLabel'),
        organicTreatment: data.organicTreatment 
          ? `${data.organicTreatment.name}: ${data.organicTreatment.preparation}`
          : undefined,
        prevention: data.preventiveMeasures || [],
        affectedPart: data.affectedPart,
        whenToSeekHelp: data.whenToSeekHelp,
        pestInfo: data.pestInfo,
        biologicalControl: data.biologicalControl
      };

      setResult(analysisResult);

      // Save to database if user is logged in with the permanent storage URL
      if (user && !analysisResult.isHealthy) {
        saveDetection.mutate({
          imageUrl: uploadedImageUrl || image.substring(0, 500), // Use storage URL or truncated fallback
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
        ? t('cropHealthySpeech')
        : `${t('diseaseDetectedSpeech')} ${analysisResult.detectedIssue}। ${t('treatmentSpeech')} ${analysisResult.treatment}`;
      speak(speechText);

      toast({
        title: analysisResult.isHealthy ? t('cropHealthyToast') : t('diseaseDetectedToast'),
        description: analysisResult.detectedIssue,
        variant: analysisResult.isHealthy ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: t('analysisFailed'),
        description: error instanceof Error ? error.message : t('tryAgain'),
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isSharingToWhatsApp, setIsSharingToWhatsApp] = useState(false);
  const resultSectionRef = useRef<HTMLDivElement>(null);

  const downloadReport = async () => {
     if (!result) return;
     
     setIsDownloading(true);
     const cropLabel = cropName || 'बाली';
    
    try {
      // Prepare data for the PDF endpoint
      const reportData = {
        crop_name: cropLabel,
        disease_name: result.detectedIssue,
        confidence: result.confidence,
        severity: result.severity,
        farmer_location: locationName || '',
        symptoms_keypoints: result.symptoms || [],
        recommended_chemicals: result.recommended_chemicals || [],
        organic_treatment: result.organic_treatment || (result.organicTreatment ? {
          name: t('organicTreatment'),
          preparation: '',
          application: result.organicTreatment
        } : null),
        management_practices: result.prevention || [],
        possible_alternatives: result.possible_alternatives || [],
        when_to_seek_help: result.whenToSeekHelp || '',
        nepaliReport: result.nepaliReport || '',
        imageUrl: image || '',
        language
      };

      const { data, error } = await supabase.functions.invoke('generate-disease-pdf', {
        body: reportData
      });

      if (error) throw error;

      // Create HTML blob and download as file
      const blob = new Blob([data], { type: 'text/html; charset=utf-8' });
      const fileName = `crop-report-${cropLabel}-${new Date().toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US').replace(/\//g, '-')}.html`;
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: t('reportDownloaded'),
        description: t('fileSaved'),
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: t('reportDownloadFailed'),
        description: t('tryAgain'),
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Download report as image using html2canvas
  const downloadReportAsImage = async () => {
    if (!result || !resultSectionRef.current) return;
    
    setIsDownloadingImage(true);
    const cropLabel = cropTypes.find(c => c.value === selectedCrop)?.label || 'crop';
    
    try {
      const canvas = await html2canvas(resultSectionRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
      });
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create image');
        }
        
        const fileName = `crop-report-${cropLabel}-${new Date().toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US').replace(/\//g, '-')}.png`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: t('imageDownloaded'),
          description: t('reportSavedAsImage'),
        });
        setIsDownloadingImage(false);
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Image download error:', error);
      toast({
        title: t('imageDownloadFailed'),
        description: t('tryAgain'),
        variant: 'destructive'
      });
      setIsDownloadingImage(false);
    }
  };

  // Download report as PDF using jsPDF
  const downloadReportAsPdf = async () => {
    if (!result || !resultSectionRef.current) return;
    
    setIsDownloadingPdf(true);
    const cropLabel = cropTypes.find(c => c.value === selectedCrop)?.label || 'crop';
    
    try {
      const canvas = await html2canvas(resultSectionRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 190; // A4 width minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add header
      pdf.setFontSize(16);
      pdf.text(t('kisanSathiAI'), 10, 15);
      pdf.setFontSize(10);
      pdf.text(`${t('activeSeason')} ${new Date().toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US')}`, 10, 22);
      if (locationName) {
        pdf.text(`${t('locationLabel')} ${locationName}`, 10, 28);
      }
      
      // Add image
      pdf.addImage(imgData, 'PNG', 10, 35, imgWidth, imgHeight);
      
      // Add footer
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFontSize(8);
      pdf.text('⚠️ ' + t('expertAdviceLabel'), 10, pageHeight - 10);
      
      const fileName = `crop-report-${cropLabel}-${new Date().toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US').replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: t('pdfDownloaded'),
        description: t('reportSavedAsPdf'),
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: t('pdfDownloadFailed'),
        description: t('tryAgain'),
        variant: 'destructive'
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Share report image directly to WhatsApp
  const shareImageToWhatsApp = async () => {
    if (!result || !resultSectionRef.current) return;
    
    setIsSharingToWhatsApp(true);
    
    try {
      const canvas = await html2canvas(resultSectionRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 'image/png', 1.0);
      });
      
      // Check if Web Share API with files is supported
      if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'report.png', { type: 'image/png' })] })) {
        const file = new File([blob], `crop-report.png`, { type: 'image/png' });
        
        await navigator.share({
          files: [file],
          title: t('diseaseDetectorTitle'),
          text: generateReportShareText(),
        });
        
        toast({
          title: t('shareSuccess'),
          description: t('reportSharedWithImage'),
        });
      } else {
        // Fallback: Download image first, then open WhatsApp
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'crop-report.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Then open WhatsApp with text
        setTimeout(() => {
          handleShareWhatsApp();
        }, 500);
        
        toast({
          title: t('imageDownloadedForShare'),
          description: t('attachToWhatsapp'),
        });
      }
    } catch (error) {
      console.error('WhatsApp image share error:', error);
      // Fallback to text share
      handleShareWhatsApp();
      toast({
        title: t('imageShareFailed'),
        description: t('textReportShared'),
        variant: 'default'
      });
    } finally {
      setIsSharingToWhatsApp(false);
    }
  };


  const generateReportShareText = () => {
     if (!result) return '';
     
     const cropLabel = cropName || 'crop';
    const severityLabel = result.severity === 'high' ? t('severityHigh') : result.severity === 'medium' ? t('severityMedium') : t('severityLow');
    const confidencePercent = Math.round(result.confidence * 100);
    
    let text = `🌾 *${t('kisanSathiAI')} - ${t('diseaseDetectorTitle')}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `📅 ${t('activeSeason')} ${new Date().toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US')}\n`;
    if (locationName) {
      text += `📍 ${t('locationLabel')} ${locationName}\n`;
    }
    text += `🌱 ${t('stepCropType')}: ${cropLabel}\n`;
    text += `🦠 ${t('diseaseDetected')}: *${result.detectedIssue}*\n`;
    text += `⚠️ ${t('severityLow')}: ${severityLabel}\n`;
    text += `📊 ${t('confidenceLabel')} ${confidencePercent}%\n\n`;
    
    if (result.symptoms && result.symptoms.length > 0) {
      text += `*🔍 ${t('symptomsLabel')}:*\n`;
      result.symptoms.slice(0, 3).forEach(s => {
        text += `• ${s}\n`;
      });
      text += `\n`;
    }
    
    if (result.treatment) {
      text += `*💊 ${t('treatment')}:*\n${result.treatment}\n\n`;
    }
    
    if (result.prevention && result.prevention.length > 0) {
      text += `*🛡️ ${t('preventionMeasures')}:*\n`;
      result.prevention.slice(0, 2).forEach(p => {
        text += `• ${p}\n`;
      });
      text += `\n`;
    }
    
    text += `⚠️ *${t('expertAdviceLabel')}* ${t('submitDisclaimer')}\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🌾 ${t('kisanSathiAI')} - ${t('heroTagline')}`;
    
    return text;
  };

  // Share functions with enhanced report - using simple wa.me link (no API)
  const handleShareWhatsApp = () => {
    if (!result) return;
    
    try {
      const text = generateReportShareText();
      const encodedText = encodeURIComponent(text);
      
      // Use simple WhatsApp share URL (works on both mobile and desktop)
      const whatsappUrl = `https://wa.me/?text=${encodedText}`;
      
      // Try to open WhatsApp
      const newWindow = window.open(whatsappUrl, '_blank');
      
      // Check if popup was blocked
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Fallback: try direct location change on mobile
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          window.location.href = whatsappUrl;
        } else {
          toast({
            title: t('whatsappOpenFailed'),
            description: t('usePopupBlocker'),
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: t('whatsappOpened'),
          description: t('reportReady'),
        });
      }
    } catch (error) {
      console.error('WhatsApp share error:', error);
      toast({
        title: t('whatsappShareFailed'),
        description: t('downloadAndShare'),
        variant: 'destructive'
      });
    }
  };

  // Share to specific WhatsApp contact (for officers)
  const handleShareToOfficer = (phoneNumber?: string) => {
    if (!result) return;
    const text = generateReportShareText();
    const encodedText = encodeURIComponent(text);
    
    if (phoneNumber) {
      // Remove any non-numeric characters and ensure country code
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('977') ? cleanPhone : `977${cleanPhone}`;
      window.open(`https://wa.me/${fullPhone}?text=${encodedText}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    }
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
    low: t('severityLow'),
    medium: t('severityMedium'),
    high: t('severityHigh')
  };

  const issueTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
    disease: { label: t('issueTypeDisease'), icon: '🦠', color: 'bg-destructive/10 text-destructive border-destructive/20' },
    pest: { label: t('issueTypePest'), icon: '🐛', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
    deficiency: { label: t('issueTypeDeficiency'), icon: '🧪', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    healthy: { label: t('issueTypeHealthy'), icon: '✅', color: 'bg-success/10 text-success border-success/20' }
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Leaf className="w-6 h-6 text-primary" />
          {t('diseaseDetectorTitle')}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {t('diseaseDetectorSubtitle')}
        </p>
      </CardHeader>

      <div className="p-4 pt-0 space-y-4">
           {/* Crop Selection */}
           <div className="space-y-3">
             <label className="text-sm font-medium flex items-center gap-2">
               <Grid3X3 className="w-4 h-4 text-primary" />
               {language === 'ne' ? 'बाली छान्नुहोस्' : 'Select Crop'}
             </label>
             
             <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
               {cropTypes.map((crop) => (
                 <motion.button
                   key={crop.value}
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={() => {
                     setCropName(crop.label);
                     setShowSuggestions(false);
                   }}
                   className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all relative ${
                     cropName === crop.label 
                       ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-sm' 
                       : 'bg-muted/20 border-border/50 hover:bg-muted/40'
                   }`}
                 >
                   <span className="text-xl sm:text-2xl">{crop.emoji}</span>
                   <span className="text-[10px] font-medium truncate w-full text-center leading-tight">
                     {crop.label}
                   </span>
                   {cropName === crop.label && (
                     <motion.div 
                       layoutId="selected-crop"
                       className="absolute -top-1 -right-1"
                       initial={{ scale: 0 }}
                       animate={{ scale: 1 }}
                     >
                       <CheckCircle2 className="w-4 h-4 text-primary bg-white rounded-full" />
                     </motion.div>
                   )}
                 </motion.button>
               ))}
             </div>

             <div className="relative">
               <input
                 type="text"
                 value={cropName}
                 onChange={(e) => {
                   const value = e.target.value;
                   setCropName(value);
                   setShowSuggestions(value.length > 0);
                 }}
                 onFocus={() => cropName && setShowSuggestions(true)}
                 onBlur={() => {
                   setTimeout(() => setShowSuggestions(false), 150);
                 }}
                 placeholder={t('selectCropPlaceholder') || (language === 'ne' ? "बाली खोज्नुहोस्..." : "Search or enter other crop...")}
                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
               />
               {showSuggestions && filteredCrops.length > 0 && (
                 <ul className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-lg text-sm">
                   {filteredCrops.map((crop) => (
                     <li
                       key={crop}
                       onMouseDown={() => {
                         setCropName(crop);
                         setShowSuggestions(false);
                       }}
                       className="cursor-pointer px-3 py-2 hover:bg-muted transition-colors border-b last:border-0"
                     >
                       {crop}
                     </li>
                   ))}
                 </ul>
               )}
             </div>
           </div>

          {/* Voice Input for Symptom Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-sm font-medium">
                {t('symptomDescLabel')}
              </label>
              {voiceSupported && (
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="sm"
                  onClick={toggleVoiceInput}
                  className={`gap-2 transition-all ${isListening ? 'animate-pulse ring-2 ring-destructive/50' : ''}`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('stopRecording')}</span>
                      <span className="sm:hidden">{t('stop')}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('startRecording')}</span>
                      <span className="sm:hidden">{t('startRecording')}</span>
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <div className="relative">
              <Textarea
                placeholder={t('symptomDescPlaceholder')}
                value={symptomDescription || transcript}
                onChange={(e) => setSymptomDescription(e.target.value)}
                rows={3}
                disabled={isListening}
                className={`resize-none transition-all ${isListening ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : ''}`}
              />
              {isListening && (
                <motion.div
                  className="absolute top-2 right-2 flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                  >
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                  </motion.div>
                  <span className="text-xs text-destructive font-medium">{t('listening')}</span>
                </motion.div>
              )}
            </div>
            
            {/* Live transcript display */}
            {isListening && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-primary/10 rounded-lg border border-primary/20"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-xs font-medium text-primary">{t('liveTranscript')}</span>
                </div>
                <p className="text-sm text-muted-foreground min-h-[20px]">
                  {interimTranscript || transcript || t('speakPrompt')}
                </p>
              </motion.div>
            )}
            
            {!voiceSupported && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {t('voiceNotSupported')}
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
                {t('uploadCropPhoto')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('uploadPhotoSubtext')}
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
                  {t('openCamera')}
                </Button>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t('chooseFromGallery')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {t('dragDropHint')}
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
                      {t('analyzingPhoto')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t('analyzeBtn')}
                    </>
                  )}
                </Button>
              )}

              {/* Results */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    ref={resultSectionRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 bg-background p-4 rounded-xl"
                  >
                    {/* Result Header */}
                    <div className={`p-4 rounded-xl border ${
                      result.isHealthy 
                        ? 'bg-success/10 border-success/20' 
                        : result.issueType === 'pest'
                          ? 'bg-orange-500/10 border-orange-500/20'
                          : 'bg-destructive/10 border-destructive/20'
                    }`}>
                      <div className="flex items-center gap-3">
                        {result.isHealthy ? (
                          <CheckCircle2 className="w-8 h-8 text-success" />
                        ) : result.issueType === 'pest' ? (
                          <Bug className="w-8 h-8 text-orange-500" />
                        ) : (
                          <AlertTriangle className="w-8 h-8 text-destructive" />
                        )}
                        <div>
                          <h3 className="font-semibold text-lg">
                            {result.isHealthy 
                              ? t('cropHealthy') 
                              : result.issueType === 'pest'
                                ? t('pestDetected')
                                : result.issueType === 'deficiency'
                                  ? t('nutrientDeficiency')
                                  : t('diseaseIdentified')
                            }
                          </h3>
                          <p className="text-sm text-muted-foreground">{result.detectedIssue}</p>
                          {result.detectedIssueEnglish && (
                            <p className="text-xs text-muted-foreground italic">({result.detectedIssueEnglish})</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <Badge variant="outline" className={issueTypeLabels[result.issueType]?.color}>
                          {issueTypeLabels[result.issueType]?.icon} {issueTypeLabels[result.issueType]?.label}
                        </Badge>
                        <Badge variant="outline">
                          {t('confidenceLabel')} {Math.round(result.confidence * 100)}%
                        </Badge>
                        <Badge variant="outline" className={severityColors[result.severity]}>
                          {severityLabels[result.severity]}
                        </Badge>
                        {result.affectedPart && (
                          <Badge variant="outline">{result.affectedPart}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Pest-specific information */}
                    {result.issueType === 'pest' && result.pestInfo && (
                      <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/20">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          {t('pestInfoLabel')}
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {result.pestInfo.scientificName && (
                            <div>
                              <span className="text-muted-foreground">{t('scientificName')}</span>
                              <p className="italic">{result.pestInfo.scientificName}</p>
                            </div>
                          )}
                          {result.pestInfo.activeSeasons && result.pestInfo.activeSeasons.length > 0 && (
                            <div>
                              <span className="text-muted-foreground">{t('activePeriod')}</span>
                              <p>{result.pestInfo.activeSeasons.join(', ')}</p>
                            </div>
                          )}
                          {result.pestInfo.hostCrops && result.pestInfo.hostCrops.length > 0 && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">{t('affectedCrops')}</span>
                              <p>{result.pestInfo.hostCrops.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Symptoms */}
                    {result.symptoms.length > 0 && (
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          {t('symptomsLabel')}
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
                        {t('treatmentMethod')}
                      </h4>
                      <p className="text-sm">{result.treatment}</p>
                      {result.organicTreatment && (
                        <div className="mt-3 p-3 bg-success/10 rounded-lg">
                          <p className="text-sm font-medium text-success">{t('organicTreatment')}</p>
                          <p className="text-sm text-muted-foreground">{result.organicTreatment}</p>
                        </div>
                      )}
                    </div>

                    {/* Biological Control (for pests) */}
                    {result.biologicalControl && (
                      <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/20">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          {t('biologicalControl')}
                        </h4>
                        <div className="space-y-2 text-sm">
                          {result.biologicalControl.naturalEnemies && result.biologicalControl.naturalEnemies.length > 0 && (
                            <div>
                              <span className="text-muted-foreground font-medium">{t('naturalEnemies')}</span>
                              <p className="text-muted-foreground">{result.biologicalControl.naturalEnemies.join(', ')}</p>
                            </div>
                          )}
                          {result.biologicalControl.trapCrops && result.biologicalControl.trapCrops.length > 0 && (
                            <div>
                              <span className="text-muted-foreground font-medium">{t('trapCrops')}</span>
                              <p className="text-muted-foreground">{result.biologicalControl.trapCrops.join(', ')}</p>
                            </div>
                          )}
                          {result.biologicalControl.culturalPractices && result.biologicalControl.culturalPractices.length > 0 && (
                            <div>
                              <span className="text-muted-foreground font-medium">{t('culturalPractices')}</span>
                              <p className="text-muted-foreground">{result.biologicalControl.culturalPractices.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Prevention */}
                    {result.prevention.length > 0 && (
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          {t('preventionMeasures')}
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

                    {/* Treatment Guide from Admin Database */}
                    <TreatmentGuideCard 
                      cropName={selectedCrop} 
                      diseaseName={result.detectedIssue || ''} 
                      autoExpand={true}
                    />

                    {/* When to seek help */}
                    {result.whenToSeekHelp && (
                      <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                        <p className="text-sm">
                          <strong>{t('expertAdviceLabel')}</strong> {result.whenToSeekHelp}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {/* PDF Report Download */}
                      <Button 
                        onClick={downloadReportAsPdf} 
                        disabled={isDownloadingPdf}
                        variant="outline"
                        className="h-12 text-base border-2 border-primary/30 hover:bg-primary/10"
                        size="lg"
                      >
                        {isDownloadingPdf ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            {t('creatingPdf')}
                          </>
                        ) : (
                          <>
                            <FileText className="w-5 h-5 mr-2" />
                            {t('pdfReport')}
                          </>
                        )}
                      </Button>

                      {/* Image Download Button */}
                      <Button 
                        onClick={downloadReportAsImage} 
                        disabled={isDownloadingImage}
                        variant="outline"
                        className="h-12 text-base border-2 border-primary/30 hover:bg-primary/10"
                        size="lg"
                      >
                        {isDownloadingImage ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            {t('creatingImage')}
                          </>
                        ) : (
                          <>
                            <ImageDown className="w-5 h-5 mr-2" />
                            {t('saveAsPhoto')}
                          </>
                        )}
                      </Button>

                      {/* HTML Report Download */}
                      <Button 
                        onClick={downloadReport} 
                        disabled={isDownloading}
                        variant="outline"
                        className="h-12 text-base border-2 border-muted-foreground/30 hover:bg-muted/50"
                        size="lg"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            {t('downloadingLabel')}
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5 mr-2" />
                            HTML
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Share buttons - Responsive Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* WhatsApp with Image */}
                      <Button 
                        onClick={shareImageToWhatsApp} 
                        disabled={isSharingToWhatsApp}
                        variant="outline" 
                        className="h-11 bg-[#25D366]/10 hover:bg-[#25D366]/20 border-[#25D366]/30 col-span-2 sm:col-span-1"
                      >
                        {isSharingToWhatsApp ? (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                          <MessageCircle className="w-4 h-4 mr-1.5 text-[#25D366]" />
                        )}
                        <span className="text-sm">{t('whatsappWithPhoto')}</span>
                      </Button>

                      {/* WhatsApp text only */}
                      <Button 
                        onClick={handleShareWhatsApp} 
                        variant="outline" 
                        className="h-11 bg-[#25D366]/5 hover:bg-[#25D366]/10 border-[#25D366]/20"
                      >
                        <MessageCircle className="w-4 h-4 mr-1.5 text-[#25D366]" />
                        <span className="text-sm">Text</span>
                      </Button>

                      <Button 
                        onClick={handleShareSMS}
                        variant="outline" 
                        className="h-11"
                      >
                        <Phone className="w-4 h-4 mr-1.5" />
                        <span className="text-sm">SMS</span>
                      </Button>
                      <Button 
                        onClick={() => {
                          // Native share API for mobile
                          if (navigator.share) {
                            navigator.share({
                              title: t('diseaseDetectorTitle'),
                              text: generateReportShareText(),
                            }).catch(() => {
                              // Fallback to WhatsApp
                              handleShareWhatsApp();
                            });
                          } else {
                            handleShareWhatsApp();
                          }
                        }} 
                        variant="outline"
                        className="h-11 col-span-2 sm:col-span-1"
                      >
                        <Share2 className="w-4 h-4 mr-1.5" />
                        <span className="text-sm">{t('shareOther')}</span>
                      </Button>
                    </div>
                    
                    {/* Share to officer button */}
                    <Button 
                      onClick={() => handleShareToOfficer()} 
                      variant="outline"
                      className="w-full h-11 bg-primary/5 hover:bg-primary/10 border-primary/20"
                    >
                      <Share2 className="w-4 h-4 mr-2 text-primary" />
                      <span className="hidden sm:inline">{t('sendToOfficer')}</span>
                      <span className="sm:hidden">{t('sendToOfficerShort')}</span>
                    </Button>

                    {/* New analysis button */}
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => {
                        setImage(null);
                        setResult(null);
                        setSymptomDescription('');
                      }}
                    >
                      {t('newAnalysis')}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
      </div>
    </Card>
  );
}
