import { motion } from 'framer-motion';
import { 
  AlertTriangle, CheckCircle, Leaf, Bug, Droplet, 
  Activity, Stethoscope, ShieldCheck, Clock, Volume2, VolumeX, ChevronDown, ChevronUp,
  Share2, MessageCircle, Phone, Save, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';

export interface DiseaseResult {
  isHealthy: boolean;
  issueType: 'disease' | 'pest' | 'deficiency' | 'healthy';
  detectedIssue: string;
  detectedIssueEnglish?: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | null;
  affectedPart?: string;
  symptoms?: string[];
  causes?: string[];
  treatment?: string;
  organicTreatment?: string;
  chemicalTreatment?: string;
  preventiveMeasures?: string[];
  whenToSeekHelp?: string;
  estimatedRecoveryTime?: string;
  nepaliReport?: string;
  // Farmer-friendly fields (spec-aligned)
  audio_script?: string;
  local_name?: string;
  cause_short?: string;
  danger_level?: string;
  what_to_do_now?: string[];
  what_to_prevent_next_time?: string[];
  // Consensus fields
  status?: 'ok' | 'uncertain';
  consensus_reached?: boolean;
  notes_for_doctor?: string;
  top_diseases?: Array<{
    name: string;
    name_en?: string;
    confidence: number;
    type?: string;
    short_reason?: string;
    local_name?: string;
    cause_short?: string;
  }>;
}

interface DiseaseDetectionResultProps {
  result: DiseaseResult;
  language: string;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  onSave?: () => void;
  isSaved?: boolean;
  imageUrl?: string;
}

export function DiseaseDetectionResult({ result, language, onSpeak, isSpeaking, onSave, isSaved, imageUrl }: DiseaseDetectionResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Generate shareable message
  const getShareMessage = useCallback(() => {
    const severityText = result.severity === 'high' ? 'गम्भीर' : result.severity === 'medium' ? 'मध्यम' : 'सामान्य';
    
    let message = language === 'ne' 
      ? `🌾 *कृषि मित्र रोग पहिचान*\n\n`
      : `🌾 *Krishi Mitra Disease Detection*\n\n`;
    
    message += language === 'ne'
      ? `📋 *पहिचान:* ${result.detectedIssue}\n`
      : `📋 *Detected:* ${result.detectedIssue}\n`;
    
    if (result.severity) {
      message += language === 'ne'
        ? `⚠️ *गम्भीरता:* ${severityText}\n`
        : `⚠️ *Severity:* ${result.severity}\n`;
    }
    
    if (result.symptoms && result.symptoms.length > 0) {
      message += language === 'ne' ? `\n🔍 *लक्षणहरू:*\n` : `\n🔍 *Symptoms:*\n`;
      result.symptoms.slice(0, 3).forEach(s => {
        message += `• ${s}\n`;
      });
    }
    
    if (result.treatment) {
      message += language === 'ne'
        ? `\n💊 *उपचार:*\n${result.treatment}\n`
        : `\n💊 *Treatment:*\n${result.treatment}\n`;
    }
    
    message += language === 'ne'
      ? `\n_कृषि मित्र AI बाट पठाइएको_`
      : `\n_Sent from Krishi Mitra AI_`;
    
    return message;
  }, [result, language]);

  // Share via WhatsApp
  const shareViaWhatsApp = useCallback(() => {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://wa.me/?text=${message}`, '_blank');
    setShowShareMenu(false);
  }, [getShareMessage]);

  // Share via SMS
  const shareViaSMS = useCallback(() => {
    const message = encodeURIComponent(getShareMessage().replace(/\*/g, '').replace(/_/g, ''));
    window.open(`sms:?body=${message}`, '_blank');
    setShowShareMenu(false);
  }, [getShareMessage]);

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case 'high': return 'text-destructive bg-destructive/10 border-destructive/30';
      case 'medium': return 'text-warning bg-warning/10 border-warning/30';
      case 'low': return 'text-primary bg-primary/10 border-primary/30';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getSeverityLabel = (severity: string | null) => {
    if (language === 'ne') {
      switch (severity) {
        case 'high': return 'गम्भीर';
        case 'medium': return 'मध्यम';
        case 'low': return 'सामान्य';
        default: return 'अज्ञात';
      }
    } else if (language === 'hi') {
      switch (severity) {
        case 'high': return 'गंभीर';
        case 'medium': return 'मध्यम';
        case 'low': return 'सामान्य';
        default: return 'अज्ञात';
      }
    } else {
      switch (severity) {
        case 'high': return 'Severe';
        case 'medium': return 'Moderate';
        case 'low': return 'Mild';
        default: return 'Unknown';
      }
    }
  };

  const getIssueTypeIcon = () => {
    switch (result.issueType) {
      case 'disease': return <Activity className="w-5 h-5" />;
      case 'pest': return <Bug className="w-5 h-5" />;
      case 'deficiency': return <Droplet className="w-5 h-5" />;
      default: return <Leaf className="w-5 h-5" />;
    }
  };

  const getIssueTypeLabel = () => {
    if (language === 'ne') {
      switch (result.issueType) {
        case 'disease': return 'रोग';
        case 'pest': return 'कीरा/झुसिल';
        case 'deficiency': return 'पोषक तत्व कमी';
        default: return 'स्वस्थ';
      }
    } else if (language === 'hi') {
      switch (result.issueType) {
        case 'disease': return 'रोग';
        case 'pest': return 'कीट';
        case 'deficiency': return 'पोषक तत्व की कमी';
        default: return 'स्वस्थ';
      }
    } else {
      switch (result.issueType) {
        case 'disease': return 'Disease';
        case 'pest': return 'Pest/Insect';
        case 'deficiency': return 'Nutrient Deficiency';
        default: return 'Healthy';
      }
    }
  };

  const confidencePercent = Math.round(result.confidence * 100);

  // Get readable text for TTS
  const getReadableText = () => {
    // Prefer the AI-generated audio script
    if (result.audio_script) return result.audio_script;
    if (result.nepaliReport) return result.nepaliReport;
    
    let text = result.isHealthy 
      ? (language === 'ne' ? 'तपाईंको बाली स्वस्थ देखिन्छ।' : 'Your crop appears healthy.')
      : `${result.detectedIssue}. `;
    
    if (result.cause_short) {
      text += result.cause_short + '. ';
    }
    if (result.what_to_do_now && result.what_to_do_now.length > 0) {
      text += (language === 'ne' ? 'तुरुन्तै गर्ने: ' : 'Do now: ') + result.what_to_do_now.slice(0, 2).join(', ') + '. ';
    } else if (result.symptoms && result.symptoms.length > 0) {
      text += (language === 'ne' ? 'लक्षणहरू: ' : 'Symptoms: ') + result.symptoms.join(', ') + '. ';
    }
    if (result.treatment) {
      text += (language === 'ne' ? 'उपचार: ' : 'Treatment: ') + result.treatment;
    }
    return text;
  };

  if (result.isHealthy) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="krishi-chat-bubble-assistant p-4 space-y-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-success">
              {language === 'ne' ? 'बाली स्वस्थ छ! 🌱' : language === 'hi' ? 'फसल स्वस्थ है! 🌱' : 'Crop is Healthy! 🌱'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === 'ne' ? 'कुनै रोग वा समस्या भेटिएन' : language === 'hi' ? 'कोई रोग या समस्या नहीं मिली' : 'No disease or problem detected'}
            </p>
          </div>
        </div>
        {onSpeak && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onSpeak(getReadableText())}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4 mr-1" /> : <Volume2 className="w-4 h-4 mr-1" />}
            {language === 'ne' ? 'सुन्नुहोस्' : 'Listen'}
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="krishi-chat-bubble-assistant p-0 overflow-hidden"
    >
      {/* Header with severity indicator */}
      <div className={cn(
        "p-4 border-b",
        result.severity === 'high' ? 'bg-destructive/10 border-destructive/20' :
        result.severity === 'medium' ? 'bg-warning/10 border-warning/20' :
        'bg-primary/5 border-primary/10'
      )}>
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            result.severity === 'high' ? 'bg-destructive/20 text-destructive' :
            result.severity === 'medium' ? 'bg-warning/20 text-warning' :
            'bg-primary/20 text-primary'
          )}>
            {result.severity === 'high' ? <AlertTriangle className="w-6 h-6" /> : getIssueTypeIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full border",
                getSeverityColor(result.severity)
              )}>
                {getSeverityLabel(result.severity)}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {getIssueTypeLabel()}
              </span>
            </div>
            <h3 className="font-bold text-lg mt-1 break-words">
              {result.detectedIssue}
            </h3>
            {result.local_name && result.local_name !== result.detectedIssue && (
              <p className="text-sm text-muted-foreground italic">
                ({result.local_name})
              </p>
            )}
            {result.detectedIssueEnglish && result.detectedIssueEnglish !== result.detectedIssue && (
              <p className="text-sm text-muted-foreground">{result.detectedIssueEnglish}</p>
            )}
          </div>
        </div>

        {/* 🔊 PROMINENT LISTEN BUTTON - Layer 3: Audio (low-literacy priority) */}
        {onSpeak && (
          <Button
            onClick={() => onSpeak(getReadableText())}
            className={cn(
              "w-full mt-3 h-12 text-base font-semibold gap-3 rounded-xl",
              isSpeaking
                ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
            )}
            variant="outline"
          >
            {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            {isSpeaking 
              ? (language === 'ne' ? '🔇 बन्द गर्नुहोस्' : '🔇 Stop')
              : (language === 'ne' ? '🔊 सुन्नुहोस्' : '🔊 Listen')
            }
          </Button>
        )}

        {/* Cause - simple 1-line explanation */}
        {result.cause_short && (
          <p className="mt-3 text-sm text-muted-foreground bg-muted/50 rounded-lg p-2.5">
            💡 {result.cause_short}
          </p>
        )}

        {/* Confidence meter */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {language === 'ne' ? 'विश्वसनीयता' : language === 'hi' ? 'विश्वास' : 'Confidence'}
            </span>
            <span className={cn(
              "font-medium",
              confidencePercent >= 80 ? 'text-success' :
              confidencePercent >= 50 ? 'text-warning' : 'text-destructive'
            )}>
              {confidencePercent}%
            </span>
          </div>
          <Progress value={confidencePercent} className="h-2" />
          {confidencePercent < 70 && (
            <p className="text-xs text-muted-foreground italic">
              {language === 'ne' ? '⚠️ यो अनुमान हो, कृषि प्राविधिकसँग पुष्टि गर्नुहोस्' : 
               language === 'hi' ? '⚠️ यह अनुमान है, कृषि विशेषज्ञ से पुष्टि करें' :
               '⚠️ This is an estimate, please verify with an expert'}
            </p>
          )}
        </div>

        {/* Uncertain / consensus warning */}
        {result.status === 'uncertain' && (
          <div className="mt-3 p-2.5 bg-warning/15 rounded-lg border border-warning/30">
            <p className="text-xs font-medium text-warning flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {language === 'ne' 
                ? 'AI निश्चित छैन — कृपया फरक कोणबाट थप फोटो र लक्षण विवरण पठाउनुहोस्।'
                : 'AI is uncertain — please provide more photos from different angles and describe symptoms.'}
            </p>
            {result.notes_for_doctor && (
              <p className="text-xs text-muted-foreground mt-1 ml-5">{result.notes_for_doctor}</p>
            )}
          </div>
        )}

        {/* Alternative possibilities */}
        {result.status === 'uncertain' && result.top_diseases && result.top_diseases.length > 1 && (
          <div className="mt-2 p-2.5 bg-muted/50 rounded-lg">
            <p className="text-xs font-medium mb-1.5">
              {language === 'ne' ? 'सम्भावित विकल्पहरू:' : 'Possible alternatives:'}
            </p>
            {result.top_diseases.slice(1, 3).map((d, i) => (
              <div key={i} className="text-xs text-muted-foreground flex items-center justify-between py-0.5">
                <span>{d.name_en || d.name}</span>
                <span className="text-xs opacity-70">{Math.round(d.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="p-4 space-y-4">
        {/* 🎯 WHAT TO DO NOW - Priority action card */}
        {result.what_to_do_now && result.what_to_do_now.length > 0 && (
          <div className="bg-primary/5 rounded-xl p-3 border-2 border-primary/20">
            <h4 className="font-bold text-sm flex items-center gap-2 mb-2 text-primary">
              ⚡ {language === 'ne' ? 'तुरुन्तै गर्ने' : 'Do This NOW'}
            </h4>
            <ul className="text-sm space-y-1.5">
              {result.what_to_do_now.slice(0, 4).map((action, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary font-bold">{i + 1}.</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 🛡️ PREVENTION - What to prevent next time */}
        {result.what_to_prevent_next_time && result.what_to_prevent_next_time.length > 0 && (
          <div className="bg-success/5 rounded-xl p-3 border border-success/20">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2 text-success">
              🛡️ {language === 'ne' ? 'अर्को पटक रोक्न' : 'Prevent Next Time'}
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {result.what_to_prevent_next_time.slice(0, 3).map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-success">✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Symptoms */}
        {result.symptoms && result.symptoms.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              {language === 'ne' ? 'लक्षणहरू' : language === 'hi' ? 'लक्षण' : 'Symptoms'}
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {result.symptoms.slice(0, 4).map((symptom, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{symptom}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Treatment - Always visible */}
        {(result.treatment || result.chemicalTreatment) && (
          <div className="bg-success/5 rounded-xl p-3 border border-success/20">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2 text-success">
              <Leaf className="w-4 h-4" />
              {language === 'ne' ? 'उपचार' : language === 'hi' ? 'उपचार' : 'Treatment'}
            </h4>
            <p className="text-sm whitespace-pre-wrap">{result.treatment || result.chemicalTreatment}</p>
          </div>
        )}

        {/* Expandable section */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between text-muted-foreground hover:text-foreground"
        >
          <span>{language === 'ne' ? 'थप जानकारी' : language === 'hi' ? 'अधिक जानकारी' : 'More Details'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
            {/* Organic Treatment */}
            {result.organicTreatment && (
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                  <Leaf className="w-4 h-4 text-primary" />
                  {language === 'ne' ? 'जैविक उपचार' : language === 'hi' ? 'जैविक उपचार' : 'Organic Treatment'}
                </h4>
                <p className="text-sm text-muted-foreground">{result.organicTreatment}</p>
              </div>
            )}

            {/* Prevention */}
            {result.preventiveMeasures && result.preventiveMeasures.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  {language === 'ne' ? 'रोकथाम' : language === 'hi' ? 'रोकथाम' : 'Prevention'}
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {result.preventiveMeasures.slice(0, 4).map((measure, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{measure}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recovery time */}
            {result.estimatedRecoveryTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span>{language === 'ne' ? 'सुधार समय:' : 'Recovery:'} {result.estimatedRecoveryTime}</span>
              </div>
            )}

            {/* When to seek help */}
            {result.whenToSeekHelp && (
              <div className="bg-warning/10 rounded-xl p-3 border border-warning/20">
                <p className="text-sm text-warning-foreground">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  {result.whenToSeekHelp}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer with action buttons */}
      <div className="p-3 border-t bg-muted/30 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground shrink-0">
            {language === 'ne' ? '⚠️ डिजिटल अनुमान' : '⚠️ Digital estimate'}
          </p>
          <div className="flex items-center gap-1">
            {/* Save button */}
            {onSave && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8"
                onClick={onSave}
                disabled={isSaved}
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-success" />
                    {language === 'ne' ? 'सुरक्षित' : 'Saved'}
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {language === 'ne' ? 'सुरक्षित' : 'Save'}
                  </>
                )}
              </Button>
            )}
            
            {/* Voice button */}
            {onSpeak && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8"
                onClick={() => onSpeak(getReadableText())}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5 mr-1" /> : <Volume2 className="w-3.5 h-3.5 mr-1" />}
                {language === 'ne' ? 'सुन्नुहोस्' : 'Listen'}
              </Button>
            )}
          </div>
        </div>
        
        {/* Share buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {language === 'ne' ? 'शेयर गर्नुहोस्:' : 'Share:'}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20"
            onClick={shareViaWhatsApp}
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={shareViaSMS}
          >
            <Phone className="w-3.5 h-3.5 mr-1" />
            SMS
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
