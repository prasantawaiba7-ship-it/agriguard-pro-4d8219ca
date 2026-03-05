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
  MapPin, ImageDown, FileText, User, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface NepaliDiseaseDetectorProps {
  onAskExpert?: (prefill: {
    imageDataUrl?: string;
    cropName?: string;
    aiDisease?: string;
    aiConfidence?: number;
    aiRecommendation?: string;
  }) => void;
}

export function NepaliDiseaseDetector({ onAskExpert }: NepaliDiseaseDetectorProps = {}) {
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
      toast({ title: t('recordingStopped'), description: t('voiceSaved') });
    } else {
      resetTranscript();
      setSymptomDescription('');
      startListening();
      toast({ title: t('startSpeaking'), description: t('speakSymptomsNepali') });
    }
  }, [isListening, stopListening, startListening, resetTranscript, toast, t]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: t('fileTooLarge'), description: t('fileSizeLimit'), variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) processFile(file);
  }, []);

  const analyzeImage = async () => {
    if (!image) {
      toast({ title: t('selectPhotoFirst'), description: t('uploadPhotoFirst'), variant: 'destructive' });
      return;
    }
    if (!cropName.trim()) {
      toast({ title: t('selectCropType'), description: t('selectCropPlaceholder'), variant: 'destructive' });
      return;
    }

    setIsAnalyzing(true);
    let uploadedImageUrl: string | null = null;
    
    try {
      if (user) {
        try {
          uploadedImageUrl = await uploadDiseaseImage(image, user.id);
        } catch (uploadError) {
          console.warn('Image upload failed, continuing with data URL:', uploadError);
        }
      }
      
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
        if (response.status === 429) throw new Error(t('serviceBusy'));
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

      if (user && !analysisResult.isHealthy) {
        saveDetection.mutate({
          imageUrl: uploadedImageUrl || image.substring(0, 500),
          detectedDisease: analysisResult.detectedIssue,
          severity: analysisResult.severity,
          confidence: analysisResult.confidence,
          treatment: analysisResult.treatment,
          organicTreatment: analysisResult.organicTreatment,
          prevention: analysisResult.prevention,
        });
      }

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
      const { data, error } = await supabase.functions.invoke('generate-disease-pdf', { body: reportData });
      if (error) throw error;
      const blob = new Blob([data], { type: 'text/html; charset=utf-8' });
      const fileName = `crop-report-${cropLabel}-${new Date().toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US').replace(/\//g, '-')}.html`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: t('reportDownloaded'), description: t('fileSaved') });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ title: t('reportDownloadFailed'), description: t('tryAgain'), variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadReportAsImage = async () => {
    if (!result || !resultSectionRef.current) return;
    setIsDownloadingImage(true);
    const cropLabel = cropTypes.find(c => c.value === selectedCrop)?.label || 'crop';
    try {
      const canvas = await html2canvas(resultSectionRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false });
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Failed to create image');
        const fileName = `crop-report-${cropLabel}-${new Date().toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US').replace(/\//g, '-')}.png`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: t('imageDownloaded'), description: t('reportSavedAsImage') });
        setIsDownloadingImage(false);
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Image download error:', error);
      toast({ title: t('imageDownloadFailed'), description: t('tryAgain'), variant: 'destructive' });
      setIsDownloadingImage(false);
    }
  };

  const downloadReportAsPdf = async () => {
    if (!result || !resultSectionRef.current) return;
    setIsDownloadingPdf(true);
    const cropLabel = cropTypes.find(c => c.value === selectedCrop)?.label || 'crop';
    try {
      const canvas = await html2canvas(resultSectionRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.setFontSize(16);
      pdf.text(t('kisanSathiAI'), 10, 15);
      pdf.setFontSize(10);
      pdf.text(`${t('activeSeason')} ${new Date().toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US')}`, 10, 22);
      if (locationName) pdf.text(`${t('locationLabel')} ${locationName}`, 10, 28);
      pdf.addImage(imgData, 'PNG', 10, 35, imgWidth, imgHeight);
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFontSize(8);
      pdf.text('⚠️ ' + t('expertAdviceLabel'), 10, pageHeight - 10);
      const fileName = `crop-report-${cropLabel}-${new Date().toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US').replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
      toast({ title: t('pdfDownloaded'), description: t('reportSavedAsPdf') });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({ title: t('pdfDownloadFailed'), description: t('tryAgain'), variant: 'destructive' });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const shareImageToWhatsApp = async () => {
    if (!result || !resultSectionRef.current) return;
    setIsSharingToWhatsApp(true);
    try {
      const canvas = await html2canvas(resultSectionRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => { if (b) resolve(b); else reject(new Error('Failed to create blob')); }, 'image/png', 1.0);
      });
      if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'report.png', { type: 'image/png' })] })) {
        const file = new File([blob], `crop-report.png`, { type: 'image/png' });
        await navigator.share({ files: [file], title: t('diseaseDetectorTitle'), text: generateReportShareText() });
        toast({ title: t('shareSuccess'), description: t('reportSharedWithImage') });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'crop-report.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setTimeout(() => { handleShareWhatsApp(); }, 500);
        toast({ title: t('imageDownloadedForShare'), description: t('attachToWhatsapp') });
      }
    } catch (error) {
      console.error('WhatsApp image share error:', error);
      handleShareWhatsApp();
      toast({ title: t('imageShareFailed'), description: t('textReportShared'), variant: 'default' });
    } finally {
      setIsSharingToWhatsApp(false);
    }
  };

  const generateReportShareText = () => {
    if (!result) return '';
    const cropLabel = cropName || 'crop';
    const severityLabel = result.severity === 'high' ? t('severityHigh') : result.severity === 'medium' ? t('severityMedium') : t('severityLow');
    const confidencePercent = Math.round(result.confidence * 100);
    let text = `🌾 *${t('kisanSathiAI')} - ${t('diseaseDetectorTitle')}*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `📅 ${t('activeSeason')} ${new Date().toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US')}\n`;
    if (locationName) text += `📍 ${t('locationLabel')} ${locationName}\n`;
    text += `🌱 ${t('stepCropType')}: ${cropLabel}\n`;
    text += `🦠 ${t('diseaseDetected')}: *${result.detectedIssue}*\n`;
    text += `⚠️ ${t('severityLow')}: ${severityLabel}\n`;
    text += `📊 ${t('confidenceLabel')} ${confidencePercent}%\n\n`;
    if (result.symptoms?.length > 0) { text += `*🔍 ${t('symptomsLabel')}:*\n`; result.symptoms.slice(0, 3).forEach(s => { text += `• ${s}\n`; }); text += `\n`; }
    if (result.treatment) text += `*💊 ${t('treatment')}:*\n${result.treatment}\n\n`;
    if (result.prevention?.length > 0) { text += `*🛡️ ${t('preventionMeasures')}:*\n`; result.prevention.slice(0, 2).forEach(p => { text += `• ${p}\n`; }); text += `\n`; }
    text += `⚠️ *${t('expertAdviceLabel')}* ${t('submitDisclaimer')}\n\n━━━━━━━━━━━━━━━━━━━━\n🌾 ${t('kisanSathiAI')} - ${t('heroTagline')}`;
    return text;
  };

  const handleShareWhatsApp = () => {
    if (!result) return;
    try {
      const text = generateReportShareText();
      const encodedText = encodeURIComponent(text);
      const whatsappUrl = `https://wa.me/?text=${encodedText}`;
      const newWindow = window.open(whatsappUrl, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          window.location.href = whatsappUrl;
        } else {
          toast({ title: t('whatsappOpenFailed'), description: t('usePopupBlocker'), variant: 'destructive' });
        }
      } else {
        toast({ title: t('whatsappOpened'), description: t('reportReady') });
      }
    } catch (error) {
      console.error('WhatsApp share error:', error);
      toast({ title: t('whatsappShareFailed'), description: t('downloadAndShare'), variant: 'destructive' });
    }
  };

  const handleShareToOfficer = (phoneNumber?: string) => {
    if (!result) return;
    const text = generateReportShareText();
    const encodedText = encodeURIComponent(text);
    if (phoneNumber) {
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
    <div className="space-y-4">
      {/* Step 1: Select Crop */}
      <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
          <h3 className="font-semibold text-sm text-foreground">
            {language === 'ne' ? 'बाली छान्नुहोस्' : 'Select Crop'}
          </h3>
        </div>
        
        <div className="grid grid-cols-5 gap-2">
          {cropTypes.map((crop) => (
            <motion.button
              key={crop.value}
              whileTap={{ scale: 0.92 }}
              onClick={() => { setCropName(crop.label); setShowSuggestions(false); }}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all relative ${
                cropName === crop.label 
                  ? 'bg-primary/10 border-primary shadow-sm' 
                  : 'bg-muted/30 border-border/50 active:bg-muted/60'
              }`}
            >
              <span className="text-xl">{crop.emoji}</span>
              <span className="text-[10px] font-medium truncate w-full text-center leading-tight text-foreground">
                {crop.label}
              </span>
              {cropName === crop.label && (
                <motion.div 
                  layoutId="selected-crop"
                  className="absolute -top-1 -right-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <CheckCircle2 className="w-4 h-4 text-primary bg-card rounded-full" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={cropName}
            onChange={(e) => { setCropName(e.target.value); setShowSuggestions(e.target.value.length > 0); }}
            onFocus={() => cropName && setShowSuggestions(true)}
            onBlur={() => { setTimeout(() => setShowSuggestions(false), 150); }}
            placeholder={t('selectCropPlaceholder') || (language === 'ne' ? "अन्य बाली खोज्नुहोस्..." : "Search other crop...")}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          {showSuggestions && filteredCrops.length > 0 && (
            <ul className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-xl border bg-popover text-popover-foreground shadow-lg text-sm">
              {filteredCrops.map((crop) => (
                <li
                  key={crop}
                  onMouseDown={() => { setCropName(crop); setShowSuggestions(false); }}
                  className="cursor-pointer px-3 py-2 hover:bg-muted transition-colors border-b last:border-0"
                >
                  {crop}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Step 2: Upload Photo */}
      <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
          <h3 className="font-semibold text-sm text-foreground">
            {language === 'ne' ? 'फोटो अपलोड गर्नुहोस्' : 'Upload Photo'}
          </h3>
        </div>

        {!image ? (
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/40'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">
              {language === 'ne' ? 'बालीको फोटो अपलोड गर्नुहोस्' : 'Upload crop photo'}
            </p>
            <p className="text-xs text-muted-foreground mb-5">
              {language === 'ne' ? 'रोगग्रस्त पात वा बालीको नजिकको फोटो' : 'Close-up of affected leaf or crop'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                size="lg"
                className="h-12 rounded-xl text-sm font-medium gap-2"
                onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
              >
                <Camera className="w-5 h-5" />
                {language === 'ne' ? '📷 फोटो खिच्नुहोस्' : '📷 Take Photo'}
              </Button>
              <Button 
                size="lg"
                className="h-12 rounded-xl text-sm font-medium gap-2"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                <Upload className="w-5 h-5" />
                {language === 'ne' ? '🖼 ग्यालरी' : '🖼 Gallery'}
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden">
              <img src={image} alt="बाली फोटो" className="w-full h-56 object-cover" />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-3 right-3 rounded-full bg-background/80 backdrop-blur-sm h-9 w-9"
                onClick={() => { setImage(null); setResult(null); }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Describe Symptoms (optional) */}
      <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">3</div>
            <h3 className="font-semibold text-sm text-foreground">
              {language === 'ne' ? 'लक्षण वर्णन (ऐच्छिक)' : 'Describe Symptoms (optional)'}
            </h3>
          </div>
          {voiceSupported && (
            <Button
              variant={isListening ? "destructive" : "ghost"}
              size="sm"
              onClick={toggleVoiceInput}
              className={`gap-1.5 rounded-xl h-8 ${isListening ? 'animate-pulse' : ''}`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span className="text-xs">{isListening ? t('stop') : '🎤'}</span>
            </Button>
          )}
        </div>
        
        <Textarea
          placeholder={t('symptomDescPlaceholder')}
          value={symptomDescription || transcript}
          onChange={(e) => setSymptomDescription(e.target.value)}
          rows={2}
          disabled={isListening}
          className={`resize-none rounded-xl text-sm ${isListening ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : ''}`}
        />
        
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-primary/10 rounded-xl border border-primary/20"
          >
            <div className="flex items-center gap-2">
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
              </motion.div>
              <span className="text-xs font-medium text-primary">{t('listening')}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{interimTranscript || transcript || t('speakPrompt')}</p>
          </motion.div>
        )}
      </div>

      {/* Analyze Button */}
      {image && !result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Button 
            onClick={analyzeImage} 
            disabled={isAnalyzing}
            className="w-full h-14 rounded-2xl text-base font-semibold gap-2 shadow-lg"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {language === 'ne' ? 'AI विश्लेषण गर्दैछ...' : 'AI Analyzing...'}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {language === 'ne' ? '🔍 रोग पहिचान गर्नुहोस्' : '🔍 Detect Disease'}
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="bg-card rounded-2xl border border-primary/20 p-6 text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {language === 'ne' ? 'AI विश्लेषण गर्दैछ...' : 'AI is analyzing...'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'ne' ? 'कृपया केही सेकेन्ड पर्खनुहोस्' : 'Please wait a few seconds'}
            </p>
          </div>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3 }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            ref={resultSectionRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Result Header Card */}
            <div className={`bg-card rounded-2xl border-2 p-5 ${
              result.isHealthy 
                ? 'border-success/30' 
                : result.severity === 'high' ? 'border-destructive/30' : 'border-warning/30'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  result.isHealthy ? 'bg-success/10' : result.severity === 'high' ? 'bg-destructive/10' : 'bg-warning/10'
                }`}>
                  {result.isHealthy ? (
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  ) : result.issueType === 'pest' ? (
                    <Bug className="w-6 h-6 text-orange-500" />
                  ) : (
                    <AlertTriangle className={`w-6 h-6 ${result.severity === 'high' ? 'text-destructive' : 'text-warning'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-foreground leading-tight">
                    {result.isHealthy ? t('cropHealthy') : result.detectedIssue}
                  </h3>
                  {result.detectedIssueEnglish && (
                    <p className="text-xs text-muted-foreground italic mt-0.5">({result.detectedIssueEnglish})</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge variant="outline" className={`text-xs rounded-lg ${issueTypeLabels[result.issueType]?.color}`}>
                      {issueTypeLabels[result.issueType]?.icon} {issueTypeLabels[result.issueType]?.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs rounded-lg">
                      📊 {Math.round(result.confidence * 100)}%
                    </Badge>
                    <Badge variant="outline" className={`text-xs rounded-lg ${severityColors[result.severity]}`}>
                      {severityLabels[result.severity]}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Pest Info */}
            {result.issueType === 'pest' && result.pestInfo && (
              <div className="bg-card rounded-2xl border border-border/50 p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">🐛 {t('pestInfoLabel')}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {result.pestInfo.scientificName && (
                    <div><span className="text-xs text-muted-foreground">{t('scientificName')}</span><p className="italic text-sm">{result.pestInfo.scientificName}</p></div>
                  )}
                  {result.pestInfo.activeSeasons?.length > 0 && (
                    <div><span className="text-xs text-muted-foreground">{t('activePeriod')}</span><p className="text-sm">{result.pestInfo.activeSeasons.join(', ')}</p></div>
                  )}
                  {result.pestInfo.hostCrops?.length > 0 && (
                    <div className="col-span-2"><span className="text-xs text-muted-foreground">{t('affectedCrops')}</span><p className="text-sm">{result.pestInfo.hostCrops.join(', ')}</p></div>
                  )}
                </div>
              </div>
            )}

            {/* Symptoms */}
            {result.symptoms.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/50 p-4">
                <h4 className="font-semibold text-sm mb-2">🔍 {t('symptomsLabel')}</h4>
                <ul className="text-sm space-y-1.5">
                  {result.symptoms.map((symptom, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>{symptom}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Treatment Card */}
            <div className="bg-primary/5 rounded-2xl border border-primary/20 p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Pill className="w-4 h-4 text-primary" /> {t('treatmentMethod')}
              </h4>
              <p className="text-sm text-foreground">{result.treatment}</p>
              {result.organicTreatment && (
                <div className="mt-3 p-3 bg-success/10 rounded-xl">
                  <p className="text-xs font-semibold text-success mb-0.5">{t('organicTreatment')}</p>
                  <p className="text-sm text-muted-foreground">{result.organicTreatment}</p>
                </div>
              )}
            </div>

            {/* Biological Control */}
            {result.biologicalControl && (
              <div className="bg-card rounded-2xl border border-border/50 p-4">
                <h4 className="font-semibold text-sm mb-2">🌿 {t('biologicalControl')}</h4>
                <div className="space-y-2 text-sm">
                  {result.biologicalControl.naturalEnemies?.length > 0 && (
                    <div><span className="text-xs text-muted-foreground font-medium">{t('naturalEnemies')}</span><p className="text-muted-foreground">{result.biologicalControl.naturalEnemies.join(', ')}</p></div>
                  )}
                  {result.biologicalControl.trapCrops?.length > 0 && (
                    <div><span className="text-xs text-muted-foreground font-medium">{t('trapCrops')}</span><p className="text-muted-foreground">{result.biologicalControl.trapCrops.join(', ')}</p></div>
                  )}
                  {result.biologicalControl.culturalPractices?.length > 0 && (
                    <div><span className="text-xs text-muted-foreground font-medium">{t('culturalPractices')}</span><p className="text-muted-foreground">{result.biologicalControl.culturalPractices.join(', ')}</p></div>
                  )}
                </div>
              </div>
            )}

            {/* Prevention */}
            {result.prevention.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/50 p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> {t('preventionMeasures')}
                </h4>
                <ul className="text-sm space-y-1.5">
                  {result.prevention.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-success mt-0.5">✓</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Treatment Guide from DB */}
            <TreatmentGuideCard cropName={selectedCrop} diseaseName={result.detectedIssue || ''} autoExpand={true} />

            {/* When to seek help */}
            {result.whenToSeekHelp && (
              <div className="p-3 bg-warning/10 rounded-2xl border border-warning/20">
                <p className="text-sm"><strong>⚠️ {t('expertAdviceLabel')}</strong> {result.whenToSeekHelp}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Primary actions */}
              {onAskExpert && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => onAskExpert({
                      imageDataUrl: image || undefined,
                      cropName: selectedCrop,
                      aiDisease: result.detectedIssue,
                      aiConfidence: result.confidence,
                      aiRecommendation: result.treatment,
                    })}
                    className="h-12 rounded-xl text-sm font-medium gap-2"
                    size="lg"
                  >
                    <User className="w-4 h-4" />
                    {language === 'ne' ? '👨‍🌾 विज्ञसँग सोध्नुहोस्' : '👨‍🌾 Ask Expert'}
                  </Button>
                  <Button 
                    onClick={downloadReportAsPdf} 
                    disabled={isDownloadingPdf}
                    variant="outline"
                    className="h-12 rounded-xl text-sm font-medium gap-2"
                    size="lg"
                  >
                    {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    {language === 'ne' ? '📥 रिपोर्ट' : '📥 Report'}
                  </Button>
                </div>
              )}

              {/* Download & Share */}
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={downloadReportAsImage} disabled={isDownloadingImage} variant="outline" className="h-10 rounded-xl text-xs gap-1">
                  {isDownloadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageDown className="w-3.5 h-3.5" />}
                  {language === 'ne' ? 'फोटो' : 'Image'}
                </Button>
                <Button onClick={downloadReport} disabled={isDownloading} variant="outline" className="h-10 rounded-xl text-xs gap-1">
                  {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  HTML
                </Button>
                <Button onClick={shareImageToWhatsApp} disabled={isSharingToWhatsApp} variant="outline" className="h-10 rounded-xl text-xs gap-1 bg-[#25D366]/5 hover:bg-[#25D366]/10 border-[#25D366]/20">
                  {isSharingToWhatsApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />}
                  WhatsApp
                </Button>
              </div>

              {/* More Share */}
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={handleShareWhatsApp} variant="ghost" className="h-9 rounded-xl text-xs gap-1">
                  <MessageCircle className="w-3.5 h-3.5" /> Text
                </Button>
                <Button onClick={handleShareSMS} variant="ghost" className="h-9 rounded-xl text-xs gap-1">
                  <Phone className="w-3.5 h-3.5" /> SMS
                </Button>
                <Button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: t('diseaseDetectorTitle'), text: generateReportShareText() }).catch(() => handleShareWhatsApp());
                    } else {
                      handleShareWhatsApp();
                    }
                  }} 
                  variant="ghost" 
                  className="h-9 rounded-xl text-xs gap-1"
                >
                  <Share2 className="w-3.5 h-3.5" /> {t('shareOther')}
                </Button>
              </div>

              {/* Send to officer */}
              <Button onClick={() => handleShareToOfficer()} variant="outline" className="w-full h-10 rounded-xl text-xs gap-1.5 bg-primary/5 hover:bg-primary/10 border-primary/20">
                <Share2 className="w-3.5 h-3.5 text-primary" />
                {language === 'ne' ? 'कृषि अधिकारीलाई पठाउनुहोस्' : 'Send to Officer'}
              </Button>

              {/* Expert CTA for low confidence */}
              {onAskExpert && result.confidence < 0.6 && (
                <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30">
                  <p className="text-sm text-foreground font-medium mb-2">
                    {language === 'ne' ? '⚠️ AI पूर्ण निश्चिन्त छैन। मानव विज्ञसँग सोध्नुहोस्।' : '⚠️ AI is not fully confident. Ask a human expert.'}
                  </p>
                  <Button
                    onClick={() => onAskExpert({
                      imageDataUrl: image || undefined,
                      cropName: selectedCrop,
                      aiDisease: result.detectedIssue,
                      aiConfidence: result.confidence,
                      aiRecommendation: result.treatment,
                    })}
                    className="w-full h-11 rounded-xl font-semibold"
                    size="lg"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {language === 'ne' ? 'विज्ञसँग सोध्नुहोस्' : 'Ask an Expert'}
                  </Button>
                </div>
              )}

              {/* New Analysis */}
              <Button 
                variant="secondary" 
                className="w-full h-11 rounded-xl"
                onClick={() => { setImage(null); setResult(null); setSymptomDescription(''); }}
              >
                {t('newAnalysis')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
