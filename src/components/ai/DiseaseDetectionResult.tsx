import { motion } from 'framer-motion';
import { 
  AlertTriangle, CheckCircle, Leaf, Bug, Droplet, 
  Activity, Stethoscope, ShieldCheck, Clock, Volume2, VolumeX, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
}

interface DiseaseDetectionResultProps {
  result: DiseaseResult;
  language: string;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export function DiseaseDetectionResult({ result, language, onSpeak, isSpeaking }: DiseaseDetectionResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
    if (result.nepaliReport) return result.nepaliReport;
    
    let text = result.isHealthy 
      ? (language === 'ne' ? 'तपाईंको बाली स्वस्थ देखिन्छ।' : 'Your crop appears healthy.')
      : `${result.detectedIssue}. `;
    
    if (result.symptoms && result.symptoms.length > 0) {
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
            {result.detectedIssueEnglish && result.detectedIssueEnglish !== result.detectedIssue && (
              <p className="text-sm text-muted-foreground">{result.detectedIssueEnglish}</p>
            )}
          </div>
        </div>

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
      </div>

      {/* Main content */}
      <div className="p-4 space-y-4">
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

      {/* Footer with voice button */}
      <div className="p-3 border-t bg-muted/30 flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          {language === 'ne' ? '⚠️ यो डिजिटल अनुमान हो' : '⚠️ This is a digital estimate'}
        </p>
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
    </motion.div>
  );
}
