import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type FeedbackType = 
  | 'price_accuracy' 
  | 'guide_usefulness' 
  | 'app_experience' 
  | 'bug_report' 
  | 'feature_request';

export type FeedbackTargetType = 
  | 'market_price' 
  | 'guide' 
  | 'screen' 
  | 'feature' 
  | 'app' 
  | 'other';

export type FeedbackStatus = 
  | 'pending' 
  | 'seen' 
  | 'in_progress' 
  | 'resolved' 
  | 'dismissed';

export interface UserFeedback {
  id: string;
  user_id: string | null;
  feedback_type: FeedbackType;
  target_type: FeedbackTargetType;
  target_id: string | null;
  rating: number | null;
  comment_text: string | null;
  metadata_json: Record<string, unknown>;
  status: FeedbackStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmitFeedbackParams {
  feedback_type: FeedbackType;
  target_type: FeedbackTargetType;
  target_id?: string | null;
  rating?: number | null;
  comment_text?: string | null;
  metadata?: Record<string, unknown>;
}

export interface FeedbackFilters {
  feedback_type?: FeedbackType;
  target_type?: FeedbackTargetType;
  status?: FeedbackStatus;
  min_rating?: number;
  max_rating?: number;
  date_from?: string;
  date_to?: string;
}

export function useFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Submit feedback mutation
  const submitFeedback = useMutation({
    mutationFn: async (params: SubmitFeedbackParams) => {
      const metadata = {
        ...params.metadata,
        app_version: '1.0.0',
        platform: navigator.userAgent.includes('Mobile') ? 'mobile' : 'web',
        language: navigator.language,
        timestamp: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user?.id || null,
          feedback_type: params.feedback_type,
          target_type: params.target_type,
          target_id: params.target_id || null,
          rating: params.rating || null,
          comment_text: params.comment_text || null,
          metadata_json: metadata,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('धन्यवाद! तपाईंको प्रतिक्रिया पठाइयो।');
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
    onError: (error) => {
      console.error('Feedback submission error:', error);
      toast.error('प्रतिक्रिया पठाउन सकिएन। पुनः प्रयास गर्नुहोस्।');
    },
  });

  return {
    submitFeedback: submitFeedback.mutate,
    isSubmitting: submitFeedback.isPending,
  };
}

// Admin hook for managing feedback
export function useAdminFeedback(filters?: FeedbackFilters) {
  const queryClient = useQueryClient();

  // Fetch all feedback with filters
  const feedbackQuery = useQuery({
    queryKey: ['admin-feedback', filters],
    queryFn: async () => {
      let query = supabase
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.feedback_type) {
        query = query.eq('feedback_type', filters.feedback_type);
      }
      if (filters?.target_type) {
        query = query.eq('target_type', filters.target_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.min_rating) {
        query = query.gte('rating', filters.min_rating);
      }
      if (filters?.max_rating) {
        query = query.lte('rating', filters.max_rating);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data as UserFeedback[];
    },
  });

  // Update feedback status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: FeedbackStatus; admin_notes?: string }) => {
      const { error } = await supabase
        .from('user_feedback')
        .update({ status, admin_notes })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('स्थिति अद्यावधिक गरियो');
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
    onError: () => {
      toast.error('अद्यावधिक गर्न सकिएन');
    },
  });

  // Delete feedback
  const deleteFeedback = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('प्रतिक्रिया हटाइयो');
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });

  // Get summary stats
  const statsQuery = useQuery({
    queryKey: ['admin-feedback-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('feedback_type, target_type, rating, status');

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(f => f.status === 'pending').length,
        avgRating: 0,
        byType: {} as Record<string, number>,
        byTarget: {} as Record<string, number>,
        lowRatings: data.filter(f => f.rating && f.rating <= 2).length,
      };

      const ratingsWithValue = data.filter(f => f.rating);
      if (ratingsWithValue.length > 0) {
        stats.avgRating = ratingsWithValue.reduce((sum, f) => sum + (f.rating || 0), 0) / ratingsWithValue.length;
      }

      data.forEach(f => {
        stats.byType[f.feedback_type] = (stats.byType[f.feedback_type] || 0) + 1;
        stats.byTarget[f.target_type] = (stats.byTarget[f.target_type] || 0) + 1;
      });

      return stats;
    },
  });

  return {
    feedback: feedbackQuery.data || [],
    isLoading: feedbackQuery.isLoading,
    stats: statsQuery.data,
    updateStatus: updateStatus.mutate,
    deleteFeedback: deleteFeedback.mutate,
    refetch: feedbackQuery.refetch,
  };
}
