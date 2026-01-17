import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DiseaseDetection {
  id: string;
  farmer_id: string;
  plot_id?: string;
  image_url: string;
  detected_disease?: string;
  severity?: string;
  confidence_score?: number;
  treatment_recommendations?: {
    chemical?: string;
    organic?: string;
    immediateActions?: string[];
  };
  prevention_tips?: string[];
  language?: string;
  analyzed_at: string;
  created_at: string;
}

export function useDiseaseHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['disease-history', user?.id],
    queryFn: async () => {
      // First get the farmer profile
      const { data: profile } = await supabase
        .from('farmer_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!profile) return [];

      const { data, error } = await supabase
        .from('disease_detections')
        .select('*')
        .eq('farmer_id', profile.id)
        .order('analyzed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as DiseaseDetection[];
    },
    enabled: !!user,
  });
}

export function useSaveDiseaseDetection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (detection: {
      imageUrl: string;
      detectedDisease: string;
      severity: string;
      confidence: number;
      treatment: string;
      organicTreatment?: string;
      prevention: string[];
      plotId?: string;
    }) => {
      // Get farmer profile
      const { data: profile } = await supabase
        .from('farmer_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!profile) {
        throw new Error('Farmer profile not found');
      }

      const { data, error } = await supabase
        .from('disease_detections')
        .insert({
          farmer_id: profile.id,
          plot_id: detection.plotId || null,
          image_url: detection.imageUrl,
          detected_disease: detection.detectedDisease,
          severity: detection.severity,
          confidence_score: detection.confidence,
          treatment_recommendations: {
            chemical: detection.treatment,
            organic: detection.organicTreatment,
          },
          prevention_tips: detection.prevention,
          language: 'ne',
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger outbreak check in background
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-outbreak`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              diseaseDetection: {
                detected_disease: detection.detectedDisease,
                farmer_id: profile.id,
                severity: detection.severity,
              },
            }),
          }
        );
      } catch (outbreakError) {
        console.warn('Outbreak check failed:', outbreakError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disease-history'] });
      toast({
        title: '✅ रिपोर्ट सुरक्षित भयो',
        description: 'तपाईंको रोग विश्लेषण इतिहासमा सुरक्षित गरियो।',
      });
    },
    onError: (error) => {
      console.error('Failed to save detection:', error);
      // Don't show error toast - saving is optional enhancement
    },
  });
}

// Generate shareable text for WhatsApp/SMS
export function generateShareText(detection: {
  detectedDisease: string;
  severity: string;
  treatment: string;
  prevention: string[];
}): string {
  const severityLabels: Record<string, string> = {
    low: 'सामान्य',
    medium: 'मध्यम',
    high: 'गम्भीर',
  };

  return `🌿 *बाली रोग विश्लेषण रिपोर्ट*

📋 *रोग:* ${detection.detectedDisease}
⚠️ *गम्भीरता:* ${severityLabels[detection.severity] || detection.severity}

💊 *उपचार:*
${detection.treatment}

🛡️ *रोकथाम:*
${detection.prevention.slice(0, 3).map(p => `• ${p}`).join('\n')}

---
कृषि मित्र - नेपाल द्वारा`;
}

export function shareViaWhatsApp(text: string) {
  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encodedText}`, '_blank');
}

export function shareViaSMS(text: string, phoneNumber?: string) {
  const encodedText = encodeURIComponent(text);
  const smsUrl = phoneNumber 
    ? `sms:${phoneNumber}?body=${encodedText}`
    : `sms:?body=${encodedText}`;
  window.location.href = smsUrl;
}
