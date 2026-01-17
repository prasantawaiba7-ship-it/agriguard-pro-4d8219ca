import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { DiseaseResult } from '@/components/ai/DiseaseDetectionResult';

export interface DiseaseDetectionRecord {
  id: string;
  farmer_id: string;
  plot_id: string | null;
  image_url: string;
  detected_disease: string | null;
  severity: string | null;
  confidence_score: number | null;
  treatment_recommendations: Record<string, unknown> | null;
  prevention_tips: string[] | null;
  language: string | null;
  analyzed_at: string;
  created_at: string;
}

export function useDiseaseHistory() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['disease-history', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('disease_detections')
        .select('*')
        .eq('farmer_id', profile.id)
        .order('analyzed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as DiseaseDetectionRecord[];
    },
    enabled: !!profile?.id,
  });
}

export function useSaveDiseaseDetection() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      imageUrl,
      result,
      language = 'ne'
    }: {
      imageUrl: string;
      result: DiseaseResult;
      language?: string;
    }) => {
      if (!profile?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('disease_detections')
        .insert({
          farmer_id: profile.id,
          image_url: imageUrl,
          detected_disease: result.detectedIssue,
          severity: result.severity,
          confidence_score: result.confidence,
          treatment_recommendations: {
            treatment: result.treatment,
            organicTreatment: result.organicTreatment,
            chemicalTreatment: result.chemicalTreatment,
            symptoms: result.symptoms,
            causes: result.causes,
            whenToSeekHelp: result.whenToSeekHelp,
            estimatedRecoveryTime: result.estimatedRecoveryTime,
            issueType: result.issueType,
            affectedPart: result.affectedPart
          },
          prevention_tips: result.preventiveMeasures,
          language
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disease-history'] });
      toast({
        title: 'सुरक्षित गरियो',
        description: 'रोग पहिचान इतिहासमा सुरक्षित गरियो।',
      });
    },
    onError: (error) => {
      console.error('Failed to save disease detection:', error);
      // Silent fail - don't show error to user as this is a background save
    },
  });
}

export function useTreatmentReminders() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['treatment-reminders', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // Get recent disease detections with treatments
      const { data, error } = await supabase
        .from('disease_detections')
        .select('*')
        .eq('farmer_id', profile.id)
        .not('detected_disease', 'is', null)
        .order('analyzed_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Generate treatment reminders based on disease detections
      const reminders = (data || []).map((detection) => {
        const analyzedDate = new Date(detection.analyzed_at);
        const treatmentRec = detection.treatment_recommendations as Record<string, unknown> | null;
        
        // Calculate next treatment dates based on severity
        const severityDays: Record<string, number> = {
          'high': 3,
          'medium': 7,
          'low': 14
        };
        
        const daysUntilNextTreatment = severityDays[detection.severity || 'medium'] || 7;
        const nextTreatmentDate = new Date(analyzedDate);
        nextTreatmentDate.setDate(nextTreatmentDate.getDate() + daysUntilNextTreatment);

        return {
          id: detection.id,
          diseaseName: detection.detected_disease,
          severity: detection.severity,
          detectedAt: detection.analyzed_at,
          nextTreatmentDate: nextTreatmentDate.toISOString(),
          treatment: treatmentRec?.treatment as string || '',
          isOverdue: new Date() > nextTreatmentDate,
          daysRemaining: Math.ceil((nextTreatmentDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        };
      }).filter(r => r.daysRemaining > -30); // Only show reminders from last 30 days

      return reminders;
    },
    enabled: !!profile?.id,
  });
}
