import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Image, X, Loader2, Bot, User, Leaf, Bug, WifiOff, Wifi, CloudOff, Trash2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { usePlots } from '@/hooks/useFarmerData';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { offlineStorage } from '@/lib/offlineStorage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Date;
  pending?: boolean;
  isOfflineResponse?: boolean;
}

interface AIAssistantProps {
  initialAction?: 'chat' | 'recommend' | 'disease' | null;
}

export function AIAssistant({ initialAction = null }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzingDisease, setIsAnalyzingDisease] = useState(false);
  const [isGettingRecommendations, setIsGettingRecommendations] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const diseaseInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { data: plots } = usePlots();
  const { isOnline, wasOffline } = useNetworkStatus();

  // Voice input hook
  const { 
    isListening, 
    isSupported: isVoiceSupported, 
    transcript, 
    startListening, 
    stopListening 
  } = useVoiceInput({
    language,
    onResult: (text) => {
      setInput(prev => prev ? `${prev} ${text}` : text);
    },
    onError: (error) => {
      toast({
        title: "Voice Error",
        description: error,
        variant: "destructive"
      });
    }
  });

  // Text-to-speech hook
  const {
    toggle: toggleSpeech,
    stop: stopSpeech,
    isSpeaking,
    isSupported: isTTSSupported,
    currentMessageId: speakingMessageId
  } = useTextToSpeech({
    language,
    onError: (error) => {
      toast({
        title: "Speech Error",
        description: error,
        variant: "destructive"
      });
    }
  });

  // Update input with interim transcript while listening
  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load saved conversations on mount
  useEffect(() => {
    const savedMessages = offlineStorage.loadConversations();
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    }
    const pending = offlineStorage.getPendingMessages();
    setPendingCount(pending.length);
  }, []);

  // Save conversations when messages change
  useEffect(() => {
    if (messages.length > 0) {
      offlineStorage.saveConversations(messages);
    }
  }, [messages]);

  // Process pending messages when back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      const pending = offlineStorage.getPendingMessages();
      if (pending.length > 0) {
        toast({
          title: "Back online!",
          description: `Sending ${pending.length} queued message(s)...`,
        });
        processPendingMessages();
      }
    }
  }, [isOnline, wasOffline]);

  const processPendingMessages = async () => {
    const pending = offlineStorage.getPendingMessages();
    
    for (const pendingMsg of pending) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-farm-assistant`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              messages: pendingMsg.messages,
              language
            }),
          }
        );

        if (response.ok) {
          // Process streaming response
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let assistantContent = '';
          const assistantMessageId = crypto.randomUUID();

          setMessages(prev => [...prev, {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date()
          }]);

          if (reader) {
            let textBuffer = '';
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              textBuffer += decoder.decode(value, { stream: true });
              
              let newlineIndex: number;
              while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
                let line = textBuffer.slice(0, newlineIndex);
                textBuffer = textBuffer.slice(newlineIndex + 1);
                
                if (line.endsWith('\r')) line = line.slice(0, -1);
                if (line.startsWith(':') || line.trim() === '') continue;
                if (!line.startsWith('data: ')) continue;
                
                const jsonStr = line.slice(6).trim();
                if (jsonStr === '[DONE]') break;
                
                try {
                  const parsed = JSON.parse(jsonStr);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    assistantContent += content;
                    setMessages(prev => prev.map(m => 
                      m.id === assistantMessageId 
                        ? { ...m, content: assistantContent }
                        : m
                    ));
                  }
                } catch {
                  // Incomplete JSON, continue
                }
              }
            }
          }

          offlineStorage.removePendingMessage(pendingMsg.id);
          setPendingCount(prev => prev - 1);
        }
      } catch (error) {
        console.error('Failed to process pending message:', error);
      }
    }
  };

  // Handle initial action
  useEffect(() => {
    if (initialAction === 'recommend' && messages.length === 0) {
      handleGetCropRecommendations();
    } else if (initialAction === 'disease' && messages.length === 0) {
      diseaseInputRef.current?.click();
    }
  }, [initialAction]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDiseaseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const imageUrl = reader.result as string;
      
      // Add user message with image
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: 'Please analyze this crop image for diseases or pests.',
        imageUrl,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      if (!isOnline) {
        // Offline response for disease detection
        const offlineMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `📴 **Offline Mode - Image Saved**

I've saved your crop image. I'll analyze it when you're back online.

**While waiting, check for these common signs:**

🍂 **Yellow/Brown Spots** → Possible fungal infection
🐛 **Holes in Leaves** → Pest damage
🥀 **Wilting** → Root issues or water stress
⚪ **White Powder** → Powdery mildew

💡 *The image will be analyzed automatically when connectivity is restored.*`,
          timestamp: new Date(),
          isOfflineResponse: true
        };
        setMessages(prev => [...prev, offlineMessage]);
        
        // Queue for later processing
        offlineStorage.queuePendingMessage({
          id: crypto.randomUUID(),
          messages: [{
            role: 'user',
            content: 'Please analyze this crop image for diseases or pests.',
            imageUrl
          }],
          timestamp: new Date()
        });
        setPendingCount(prev => prev + 1);
        
        toast({
          title: "Image saved offline",
          description: "Will analyze when you're back online",
        });
        return;
      }

      setIsAnalyzingDisease(true);

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
              imageUrl,
              language,
              cropType: plots?.[0]?.crop_type || undefined
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to analyze image');
        }

        const analysis = await response.json();
        
        // Format the response
        let responseContent = '';
        if (analysis.isHealthy) {
          responseContent = `✅ **Good news! Your crop looks healthy.**\n\nConfidence: ${Math.round((analysis.confidence || 0.8) * 100)}%\n\nKeep up the good farming practices!`;
        } else {
          responseContent = `🔍 **Disease Detection Result**\n\n`;
          responseContent += `**Detected Issue:** ${analysis.detectedIssue || 'Unknown'}\n`;
          responseContent += `**Confidence:** ${Math.round((analysis.confidence || 0.7) * 100)}%\n`;
          responseContent += `**Severity:** ${analysis.severity || 'Unknown'}\n\n`;
          
          if (analysis.symptoms?.length > 0) {
            responseContent += `**Symptoms:**\n${analysis.symptoms.map((s: string) => `• ${s}`).join('\n')}\n\n`;
          }
          
          if (analysis.immediateActions?.length > 0) {
            responseContent += `**Immediate Actions:**\n`;
            analysis.immediateActions.forEach((action: any) => {
              responseContent += `• ${action.action}\n`;
            });
            responseContent += '\n';
          }
          
          if (analysis.organicTreatment) {
            responseContent += `**🌿 Organic Treatment:**\n`;
            responseContent += `${analysis.organicTreatment.name}\n`;
            responseContent += `Preparation: ${analysis.organicTreatment.preparation}\n`;
            responseContent += `Application: ${analysis.organicTreatment.application}\n\n`;
          }
          
          if (analysis.chemicalTreatment) {
            responseContent += `**💊 Chemical Treatment:**\n`;
            responseContent += `${analysis.chemicalTreatment.name}\n`;
            responseContent += `Dosage: ${analysis.chemicalTreatment.dosage}\n\n`;
          }
          
          if (analysis.preventiveMeasures?.length > 0) {
            responseContent += `**Prevention Tips:**\n${analysis.preventiveMeasures.map((p: string) => `• ${p}`).join('\n')}\n\n`;
          }
          
          if (analysis.whenToSeekHelp) {
            responseContent += `⚠️ **When to consult expert:** ${analysis.whenToSeekHelp}`;
          }
        }

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        toast({
          title: 'Analysis Failed',
          description: error instanceof Error ? error.message : 'Could not analyze image',
          variant: 'destructive'
        });
      } finally {
        setIsAnalyzingDisease(false);
        if (diseaseInputRef.current) {
          diseaseInputRef.current.value = '';
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGetCropRecommendations = async () => {
    if (!plots || plots.length === 0) {
      toast({
        title: "No plots found",
        description: "Please add a plot first to get personalized recommendations",
        variant: "destructive"
      });
      return;
    }

    const plot = plots[0];
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `Get crop recommendations for my ${plot.crop_type} field (${plot.area_hectares || 'unknown'} hectares) in ${plot.village || plot.district || plot.state || 'my area'}.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    if (!isOnline) {
      // Provide offline crop recommendations
      const offlineResponse = offlineStorage.getOfflineResponse('crop');
      const offlineMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: offlineResponse,
        timestamp: new Date(),
        isOfflineResponse: true
      };
      setMessages(prev => [...prev, offlineMessage]);
      return;
    }

    setIsGettingRecommendations(true);

    try {
      // Fetch weather data if plot has coordinates
      let weatherData = {
        temperature: 28,
        humidity: 65,
        rainfall: 100
      };

      if (plot.latitude && plot.longitude) {
        try {
          const weatherResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-weather`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                latitude: plot.latitude,
                longitude: plot.longitude
              }),
            }
          );
          if (weatherResponse.ok) {
            const weather = await weatherResponse.json();
            weatherData = {
              temperature: weather.temperature || 28,
              humidity: weather.humidity || 65,
              rainfall: weather.rainfall || 100
            };
          }
        } catch (e) {
          console.log('Could not fetch weather, using defaults');
        }
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crop-recommendation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            soilData: {
              ph: 6.5,
              moisture: 45,
              nitrogen: 280,
              phosphorus: 45,
              potassium: 200,
              soilType: 'Loamy'
            },
            weatherData,
            plotInfo: {
              latitude: plot.latitude || 20.5937,
              longitude: plot.longitude || 78.9629,
              areaHectares: plot.area_hectares || 2,
              state: plot.state || 'India',
              district: plot.district || '',
              season: plot.season || 'Kharif',
              previousCrop: plot.crop_type
            },
            language
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      
      let responseContent = `🌾 **Crop Recommendations for Your Field**\n\n`;
      responseContent += `**Soil Health Score:** ${Math.round((data.soilHealthScore || 0.7) * 100)}%\n`;
      responseContent += `**Sustainability Score:** ${Math.round((data.sustainabilityScore || 0.7) * 100)}%\n\n`;
      
      if (data.recommendations && data.recommendations.length > 0) {
        responseContent += `**Top Recommended Crops:**\n\n`;
        data.recommendations.slice(0, 3).forEach((rec: any, index: number) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
          responseContent += `${medal} **${rec.crop}**\n`;
          responseContent += `   Suitability: ${Math.round((rec.suitabilityScore || 0.8) * 100)}%\n`;
          responseContent += `   Expected Yield: ${rec.expectedYieldPerHectare || 'N/A'}\n`;
          responseContent += `   Profit Estimate: ${rec.estimatedProfitPerHectare || 'N/A'}\n`;
          responseContent += `   Water Needs: ${rec.waterRequirement || 'Medium'}\n\n`;
        });
      }

      if (data.soilImprovementTips && data.soilImprovementTips.length > 0) {
        responseContent += `**💡 Soil Improvement Tips:**\n`;
        data.soilImprovementTips.forEach((tip: string) => {
          responseContent += `• ${tip}\n`;
        });
        responseContent += '\n';
      }

      if (data.reasoning) {
        responseContent += `**Analysis:** ${data.reasoning}`;
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Recommendation Failed',
        description: error instanceof Error ? error.message : 'Could not get recommendations',
        variant: 'destructive'
      });
    } finally {
      setIsGettingRecommendations(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input || (selectedImage ? 'Please analyze this image' : ''),
      imageUrl: selectedImage || undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setSelectedImage(null);

    // Handle offline mode
    if (!isOnline) {
      const offlineResponse = offlineStorage.getOfflineResponse(currentInput);
      const offlineMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: offlineResponse,
        timestamp: new Date(),
        isOfflineResponse: true
      };
      setMessages(prev => [...prev, offlineMessage]);
      
      // Queue the message for when we're back online (only if it needs AI processing)
      if (selectedImage || !offlineResponse.includes('Offline Mode')) {
        offlineStorage.queuePendingMessage({
          id: crypto.randomUUID(),
          messages: [{
            role: 'user',
            content: currentInput,
            imageUrl: selectedImage || undefined
          }],
          timestamp: new Date()
        });
        setPendingCount(prev => prev + 1);
      }
      return;
    }

    setIsLoading(true);

    try {
      const apiMessages = messages.map(m => ({
        role: m.role,
        content: m.content,
        imageUrl: m.imageUrl
      }));
      
      apiMessages.push({
        role: 'user',
        content: userMessage.content,
        imageUrl: userMessage.imageUrl
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-farm-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: apiMessages,
            language
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantMessageId = crypto.randomUUID();

      // Add empty assistant message
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      if (reader) {
        let textBuffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });
          
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;
            
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: assistantContent }
                    : m
                ));
              }
            } catch {
              // Incomplete JSON, continue
            }
          }
        }
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleRecording = () => {
    if (!isVoiceSupported) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support voice input. Try Chrome or Edge.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      stopListening();
      toast({
        title: "Voice stopped",
        description: "Processing your message...",
      });
    } else {
      startListening();
      toast({
        title: "Listening...",
        description: "Speak now in your language",
      });
    }
  };

  const clearChat = () => {
    stopSpeech(); // Stop any playing speech
    setMessages([]);
    offlineStorage.clearConversations();
    toast({
      title: "Chat cleared",
      description: "All messages have been deleted",
    });
  };

  const isProcessing = isLoading || isAnalyzingDisease || isGettingRecommendations;

  return (
    <div className="flex flex-col h-full bg-background min-h-0">
      {/* Offline Status Banner */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning/20 border-b border-warning/30 px-3 sm:px-4 py-2 flex items-center gap-2 flex-shrink-0"
        >
          <WifiOff className="w-4 h-4 text-warning flex-shrink-0" />
          <span className="text-xs sm:text-sm text-warning font-medium">
            {language === 'ne' ? 'अफलाइन मोड' : 'Offline Mode'}
          </span>
          {pendingCount > 0 && (
            <span className="text-xs bg-warning/30 px-2 py-0.5 rounded-full">
              {pendingCount} {language === 'ne' ? 'पेन्डिङ' : 'pending'}
            </span>
          )}
        </motion.div>
      )}

      {/* Back Online Banner */}
      {isOnline && wasOffline && pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success/20 border-b border-success/30 px-3 sm:px-4 py-2 flex items-center gap-2 flex-shrink-0"
        >
          <Wifi className="w-4 h-4 text-success flex-shrink-0" />
          <span className="text-xs sm:text-sm text-success font-medium">
            {language === 'ne' ? 'अनलाइन भयो! सिंक हुँदैछ...' : 'Back online! Syncing...'}
          </span>
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-3 sm:mb-4">
              <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h4 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">
              {language === 'ne' ? 'नमस्कार! म कृषि मित्र हुँ 🙏' : 'Namaste! I am Krishi Mitra 🙏'}
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mb-4 sm:mb-6">
              {isOnline 
                ? (language === 'ne' 
                    ? 'बाली फोटो अपलोड गर्नुहोस्, रोग पत्ता लगाउनुहोस्, वा खेतीको बारेमा सोध्नुहोस्।'
                    : 'Upload crop photos for disease detection, get recommendations, or ask farming questions.')
                : (language === 'ne'
                    ? 'तपाईं अफलाइन हुनुहुन्छ। आधारभूत सुझाव उपलब्ध छ।'
                    : 'You\'re offline. Basic tips are available.')}
            </p>
            
            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-sm mb-4">
              <Button
                variant="outline"
                className="flex items-center gap-2 h-auto py-2 sm:py-3 justify-start text-left"
                onClick={handleGetCropRecommendations}
                disabled={isProcessing}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-xs sm:text-sm truncate">
                    {language === 'ne' ? 'बाली सिफारिस' : 'Crop Recommendations'}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {isOnline 
                      ? (language === 'ne' ? 'तपाईंको खेतका लागि' : 'Based on your field')
                      : (language === 'ne' ? 'सामान्य सुझाव' : 'General tips')}
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 h-auto py-2 sm:py-3 justify-start text-left"
                onClick={() => diseaseInputRef.current?.click()}
                disabled={isProcessing}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <Bug className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-xs sm:text-sm truncate">
                    {language === 'ne' ? 'रोग जाँच गर्नुहोस्' : 'Scan for Disease'}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {isOnline 
                      ? (language === 'ne' ? 'फोटो अपलोड गर्नुहोस्' : 'Upload crop photo')
                      : (language === 'ne' ? 'पछि जाँच हुनेछ' : 'Save for later')}
                  </div>
                </div>
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
              {[
                language === 'ne' ? 'मेरो बालीमा पहेंलो पात देखियो' : 'मेरी फसल में पीलापन है', 
                'Best crops for clay soil?', 
                language === 'ne' ? 'आज मौसम कस्तो छ?' : 'आज मौसम कैसा है?'
              ].map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                  onClick={() => setInput(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : message.isOfflineResponse
                  ? 'bg-warning/20 text-warning'
                  : 'bg-accent/20 text-accent'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : message.isOfflineResponse ? (
                  <CloudOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </div>
              <Card className={`p-2.5 sm:p-3 max-w-[85%] sm:max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : message.isOfflineResponse
                  ? 'bg-warning/10 border-warning/20'
                  : 'bg-muted'
              }`}>
                {message.imageUrl && (
                  <img 
                    src={message.imageUrl} 
                    alt="Uploaded" 
                    className="rounded-lg mb-2 max-h-32 sm:max-h-48 w-auto"
                  />
                )}
                <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                {message.role === 'assistant' && isProcessing && message.id === messages[messages.length - 1]?.id && !message.content && (
                  <div className="flex gap-1 py-2">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                {/* Text-to-Speech button for assistant messages */}
                {message.role === 'assistant' && message.content && isTTSSupported && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 sm:h-7 px-1.5 sm:px-2 gap-1 sm:gap-1.5 text-[10px] sm:text-xs ${
                        speakingMessageId === message.id 
                          ? 'text-primary bg-primary/10' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => toggleSpeech(message.content, message.id)}
                    >
                      {speakingMessageId === message.id ? (
                        <>
                          <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {language === 'ne' ? 'रोक्नुहोस्' : 'Stop'}
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {language === 'ne' ? 'सुन्नुहोस्' : 'Listen'}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Processing indicator */}
        {(isAnalyzingDisease || isGettingRecommendations) && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground justify-center py-3 sm:py-4">
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            {isAnalyzingDisease 
              ? (language === 'ne' ? 'बाली फोटो विश्लेषण हुँदैछ...' : 'Analyzing crop image...')
              : (language === 'ne' ? 'सिफारिस प्राप्त हुँदैछ...' : 'Getting recommendations...')}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Hidden disease image input */}
      <input
        type="file"
        ref={diseaseInputRef}
        onChange={handleDiseaseImageUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Selected Image Preview */}
      {selectedImage && (
        <div className="px-4 pb-2">
          <div className="relative inline-block">
            <img 
              src={selectedImage} 
              alt="Selected" 
              className="h-20 rounded-lg border border-border"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 w-6 h-6"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-border bg-muted/30 flex-shrink-0">
        {/* Quick action buttons when in chat */}
        {messages.length > 0 && (
          <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3 overflow-x-auto pb-1 sm:pb-2 scrollbar-hide">
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 gap-1 sm:gap-1.5 h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
              onClick={handleGetCropRecommendations}
              disabled={isProcessing}
            >
              <Leaf className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {language === 'ne' ? 'बाली सुझाव' : 'Crop Tips'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 gap-1 sm:gap-1.5 h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
              onClick={() => diseaseInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Bug className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {language === 'ne' ? 'रोग जाँच' : 'Scan Disease'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 gap-1 sm:gap-1.5 ml-auto text-muted-foreground h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
              onClick={clearChat}
            >
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">{language === 'ne' ? 'खाली' : 'Clear'}</span>
            </Button>
          </div>
        )}
        
        <div className="flex gap-1.5 sm:gap-2 items-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
            disabled={isProcessing}
          >
            <Image className="w-4 h-4" />
          </Button>
          <Button
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={toggleRecording}
            className={`flex-shrink-0 relative h-9 w-9 sm:h-10 sm:w-10 ${isListening ? 'animate-pulse' : ''}`}
            disabled={isProcessing}
            title={isVoiceSupported 
              ? (isListening 
                  ? (language === 'ne' ? 'सुन्न रोक्नुहोस्' : 'Stop listening') 
                  : (language === 'ne' ? 'बोल्न थाल्नुहोस्' : 'Start voice input')) 
              : (language === 'ne' ? 'आवाज समर्थित छैन' : 'Voice not supported')}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isListening && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-destructive rounded-full animate-ping" />
            )}
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isOnline 
              ? (language === 'ne' ? 'आफ्नो प्रश्न टाइप गर्नुहोस्...' : t('typeMessage'))
              : (language === 'ne' ? 'अफलाइन सुझावको लागि टाइप गर्नुहोस्...' : 'Type for offline tips...')}
            className="min-h-[36px] sm:min-h-[44px] max-h-24 sm:max-h-32 resize-none text-sm"
            rows={1}
            disabled={isProcessing}
          />
          <Button
            onClick={sendMessage}
            disabled={isProcessing || (!input.trim() && !selectedImage)}
            className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
            size="icon"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
