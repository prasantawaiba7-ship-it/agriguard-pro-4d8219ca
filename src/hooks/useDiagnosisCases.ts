import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type DiagnosisCaseStatus = Database['public']['Enums']['diagnosis_case_status'];
type DiagnosisSourceType = Database['public']['Enums']['diagnosis_source_type'];
type DiagnosisAngleType = Database['public']['Enums']['diagnosis_angle_type'];

export interface DiagnosisCase {
  id: string;
  user_id: string | null;
  crop_id: number | null;
  case_status: DiagnosisCaseStatus;
  farmer_question: string | null;
  location_province_id: number | null;
  location_district_id: number | null;
  created_at: string;
  updated_at: string;
  crops?: { name_ne: string; name_en: string } | null;
  provinces?: { name_ne: string } | null;
  districts?: { name_ne: string } | null;
}

export interface DiagnosisCaseImage {
  id: string;
  case_id: string;
  image_url: string;
  angle_type: DiagnosisAngleType | null;
  created_at: string;
}

export interface DiagnosisSuggestion {
  id: string;
  case_id: string;
  source_type: DiagnosisSourceType;
  suspected_problem: string | null;
  confidence_level: number | null;
  advice_text: string | null;
  language_code: string | null;
  created_by_expert_id: string | null;
  created_at: string;
  is_final: boolean;
}

export interface DiagnosisCaseWithDetails extends DiagnosisCase {
  images: DiagnosisCaseImage[];
  suggestions: DiagnosisSuggestion[];
}

// Rule engine for basic keyword-based hints
export function getRuleBasedHint(
  cropName: string | undefined,
  farmerQuestion: string | undefined
): { suspectedProblem: string; advice: string } | null {
  if (!farmerQuestion && !cropName) return null;
  
  const text = (farmerQuestion || '').toLowerCase();
  const crop = (cropName || '').toLowerCase();
  
  // Yellow leaves / पात पहेंलो
  if (text.includes('पहेंलो') || text.includes('yellow') || text.includes('पहेँलो')) {
    if (crop.includes('धान') || crop.includes('rice')) {
      return {
        suspectedProblem: 'पोषण कमी / Nutrient deficiency',
        advice: 'सामान्यतया नाइट्रोजन कमी वा पानी व्यवस्थासम्बन्धी समस्या हुन सक्छ। पूर्ण निदानको लागि कृषि विज्ञको सल्लाह लिनुहोस्।'
      };
    }
    return {
      suspectedProblem: 'पोषण कमी सम्भव',
      advice: 'पात पहेंलो हुनुको कारण नाइट्रोजन कमी, पानी कमी, वा ढुसी रोग हुन सक्छ। विस्तृत जाँचको लागि विज्ञको सल्लाह अनिवार्य।'
    };
  }
  
  // Black spots / काला दाग
  if (text.includes('काला') || text.includes('दाग') || text.includes('black') || text.includes('spot')) {
    if (crop.includes('टमाटर') || crop.includes('tomato')) {
      return {
        suspectedProblem: 'फंगल रोग सम्भव (Early/Late Blight)',
        advice: 'फंगल रोगको सम्भावना छ। सही diagnosis को लागि कृषि विज्ञको सल्लाह अनिवार्य। रसायन प्रयोग नगरी पर्खनुहोस्।'
      };
    }
    return {
      suspectedProblem: 'फंगल वा ब्याक्टेरियल रोग सम्भव',
      advice: 'काला दाग फंगल वा ब्याक्टेरियल संक्रमणको संकेत हुन सक्छ। विज्ञको जाँचपछि मात्र उपचार गर्नुहोस्।'
    };
  }
  
  // Insects / कीरा
  if (text.includes('कीरा') || text.includes('किरा') || text.includes('insect') || text.includes('pest')) {
    return {
      suspectedProblem: 'कीरा/किराको आक्रमण',
      advice: 'कीराको प्रकार पहिचान गर्न विज्ञलाई फोटो देखाउनुहोस्। रासायनिक कीटनाशक विज्ञको सल्लाहपछि मात्र प्रयोग गर्नुहोस्।'
    };
  }
  
  // Wilting / मुर्छाउने
  if (text.includes('मुर्छा') || text.includes('wilt') || text.includes('सुक्') || text.includes('dry')) {
    return {
      suspectedProblem: 'Wilting / मुर्छा रोग',
      advice: 'पानी कमी, जरा सम्बन्धी समस्या, वा फंगल संक्रमण हुन सक्छ। विज्ञको जाँचपछि उपचार गर्नुहोस्।'
    };
  }
  
  // Default generic response
  return {
    suspectedProblem: 'अज्ञात समस्या',
    advice: 'फोटोबाट स्पष्ट पहिचान गर्न गाह्रो छ। कृषि विज्ञले हेरेर उचित सल्लाह दिनुहुनेछ।'
  };
}

// Hook for farmer's own cases
export function useMyDiagnosisCases() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-diagnosis-cases', user?.id],
    queryFn: async () => {
      const { data: cases, error } = await supabase
        .from('diagnosis_cases')
        .select(`
          *,
          crops:crop_id(name_ne, name_en),
          provinces:location_province_id(name_ne),
          districts:location_district_id(name_ne)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch images and suggestions for each case
      const casesWithDetails: DiagnosisCaseWithDetails[] = await Promise.all(
        (cases || []).map(async (c) => {
          const [imagesRes, suggestionsRes] = await Promise.all([
            supabase
              .from('diagnosis_case_images')
              .select('*')
              .eq('case_id', c.id),
            supabase
              .from('diagnosis_suggestions')
              .select('*')
              .eq('case_id', c.id)
              .order('created_at', { ascending: false })
          ]);

          return {
            ...c,
            images: imagesRes.data || [],
            suggestions: suggestionsRes.data || []
          } as DiagnosisCaseWithDetails;
        })
      );

      return casesWithDetails;
    },
    enabled: !!user
  });
}

// Hook for admin to manage all cases
export function useAdminDiagnosisCases(filters?: {
  status?: DiagnosisCaseStatus;
  cropId?: number;
  districtId?: number;
}) {
  return useQuery({
    queryKey: ['admin-diagnosis-cases', filters],
    queryFn: async () => {
      let query = supabase
        .from('diagnosis_cases')
        .select(`
          *,
          crops:crop_id(name_ne, name_en),
          provinces:location_province_id(name_ne),
          districts:location_district_id(name_ne)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('case_status', filters.status);
      }
      if (filters?.cropId) {
        query = query.eq('crop_id', filters.cropId);
      }
      if (filters?.districtId) {
        query = query.eq('location_district_id', filters.districtId);
      }

      const { data: cases, error } = await query;
      if (error) throw error;

      // Fetch images and suggestions for each case
      const casesWithDetails: DiagnosisCaseWithDetails[] = await Promise.all(
        (cases || []).map(async (c) => {
          const [imagesRes, suggestionsRes] = await Promise.all([
            supabase
              .from('diagnosis_case_images')
              .select('*')
              .eq('case_id', c.id),
            supabase
              .from('diagnosis_suggestions')
              .select('*')
              .eq('case_id', c.id)
              .order('created_at', { ascending: false })
          ]);

          return {
            ...c,
            images: imagesRes.data || [],
            suggestions: suggestionsRes.data || []
          } as DiagnosisCaseWithDetails;
        })
      );

      return casesWithDetails;
    }
  });
}

// Hook to submit a new diagnosis case
export function useSubmitDiagnosisCase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      cropId: number;
      farmerQuestion?: string;
      provinceId?: number;
      districtId?: number;
      images: { url: string; angleType?: DiagnosisAngleType }[];
    }) => {
      // Create case
      const { data: caseData, error: caseError } = await supabase
        .from('diagnosis_cases')
        .insert({
          user_id: user?.id || null,
          crop_id: data.cropId,
          farmer_question: data.farmerQuestion || null,
          location_province_id: data.provinceId || null,
          location_district_id: data.districtId || null,
          case_status: 'new'
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // Insert images
      if (data.images.length > 0) {
        const { error: imagesError } = await supabase
          .from('diagnosis_case_images')
          .insert(
            data.images.map(img => ({
              case_id: caseData.id,
              image_url: img.url,
              angle_type: img.angleType || 'other'
            }))
          );

        if (imagesError) throw imagesError;
      }

      // Generate rule-based hint
      const { data: cropData } = await supabase
        .from('crops')
        .select('name_ne, name_en')
        .eq('id', data.cropId)
        .single();

      const hint = getRuleBasedHint(cropData?.name_ne, data.farmerQuestion);
      
      if (hint) {
        await supabase.from('diagnosis_suggestions').insert({
          case_id: caseData.id,
          source_type: 'rule_engine',
          suspected_problem: hint.suspectedProblem,
          confidence_level: 30,
          advice_text: hint.advice,
          language_code: 'ne',
          is_final: false
        });

        // Update case status
        await supabase
          .from('diagnosis_cases')
          .update({ case_status: 'ai_suggested' })
          .eq('id', caseData.id);
      }

      return caseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-diagnosis-cases'] });
      toast({
        title: '✅ केस पठाइयो',
        description: 'तपाईंको रोग/किरा केस कृषि विज्ञलाई पठाइएको छ।'
      });
    },
    onError: (error) => {
      console.error('Failed to submit case:', error);
      toast({
        title: 'त्रुटि',
        description: 'केस पठाउन सकिएन।',
        variant: 'destructive'
      });
    }
  });
}

// Hook for expert to add suggestion/answer
export function useAddExpertSuggestion() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      caseId: string;
      suspectedProblem: string;
      adviceText: string;
      confidenceLevel?: number;
      isFinal?: boolean;
    }) => {
      const { error: suggestionError } = await supabase
        .from('diagnosis_suggestions')
        .insert({
          case_id: data.caseId,
          source_type: 'human_expert',
          suspected_problem: data.suspectedProblem,
          advice_text: data.adviceText,
          confidence_level: data.confidenceLevel || 90,
          language_code: 'ne',
          created_by_expert_id: user?.id,
          is_final: data.isFinal ?? true
        });

      if (suggestionError) throw suggestionError;

      // Update case status
      const { error: updateError } = await supabase
        .from('diagnosis_cases')
        .update({ case_status: data.isFinal ? 'expert_answered' : 'expert_pending' })
        .eq('id', data.caseId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-diagnosis-cases'] });
      toast({
        title: '✅ उत्तर सुरक्षित भयो',
        description: 'किसानलाई उत्तर पठाइएको छ।'
      });
    },
    onError: (error) => {
      console.error('Failed to add suggestion:', error);
      toast({
        title: 'त्रुटि',
        description: 'उत्तर सुरक्षित गर्न सकिएन।',
        variant: 'destructive'
      });
    }
  });
}

// Hook to update case status
export function useUpdateCaseStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { caseId: string; status: DiagnosisCaseStatus }) => {
      const { error } = await supabase
        .from('diagnosis_cases')
        .update({ case_status: data.status })
        .eq('id', data.caseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-diagnosis-cases'] });
      queryClient.invalidateQueries({ queryKey: ['my-diagnosis-cases'] });
    }
  });
}
