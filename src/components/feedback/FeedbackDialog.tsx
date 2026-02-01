import { useState, useEffect } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useFeedback, FeedbackType, FeedbackTargetType } from '@/hooks/useFeedback';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedbackType: FeedbackType;
  targetType: FeedbackTargetType;
  targetId?: string;
  preselectedRating?: number | null;
  title?: string;
  description?: string;
}

const feedbackTitles: Record<FeedbackType, string> = {
  price_accuracy: 'मूल्य कत्तिको मिल्दो छ?',
  guide_usefulness: 'यो सल्लाह कत्तिको उपयोगी भयो?',
  app_experience: 'एप अनुभव कस्तो छ?',
  bug_report: 'समस्या रिपोर्ट गर्नुहोस्',
  feature_request: 'सुझाव दिनुहोस्',
};

const feedbackDescriptions: Record<FeedbackType, string> = {
  price_accuracy: 'तपाईंको प्रतिक्रियाले हामीलाई सही मूल्य देखाउन मद्दत गर्छ।',
  guide_usefulness: 'तपाईंको प्रतिक्रियाले गाइड सुधार गर्न मद्दत गर्छ।',
  app_experience: 'तपाईंको प्रतिक्रियाले एप सुधार गर्न मद्दत गर्छ।',
  bug_report: 'समस्या बारे विस्तृत जानकारी दिनुहोस्।',
  feature_request: 'नयाँ फिचर वा सुधारको सुझाव दिनुहोस्।',
};

export function FeedbackDialog({
  open,
  onOpenChange,
  feedbackType,
  targetType,
  targetId,
  preselectedRating,
  title,
  description,
}: FeedbackDialogProps) {
  const [rating, setRating] = useState<number | null>(preselectedRating || null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentPrompt, setShowCommentPrompt] = useState(false);
  const { submitFeedback, isSubmitting } = useFeedback();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setRating(preselectedRating || null);
      setComment('');
      setShowCommentPrompt(false);
    }
  }, [open, preselectedRating]);

  // Show comment prompt for low ratings
  useEffect(() => {
    if (rating && rating <= 2 && !showCommentPrompt) {
      setShowCommentPrompt(true);
    }
  }, [rating]);

  const handleSubmit = () => {
    submitFeedback({
      feedback_type: feedbackType,
      target_type: targetType,
      target_id: targetId,
      rating,
      comment_text: comment || null,
    });
    onOpenChange(false);
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {title || feedbackTitles[feedbackType]}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {description || feedbackDescriptions[feedbackType]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Star Rating */}
          {feedbackType !== 'bug_report' && feedbackType !== 'feature_request' && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 transition-transform hover:scale-110"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(null)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={cn(
                        'h-8 w-8 transition-colors',
                        displayRating && star <= displayRating
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-muted-foreground/30'
                      )}
                    />
                  </button>
                ))}
              </div>
              {rating && (
                <span className="text-sm text-muted-foreground">
                  {rating === 1 && 'धेरै नराम्रो'}
                  {rating === 2 && 'नराम्रो'}
                  {rating === 3 && 'ठीकै'}
                  {rating === 4 && 'राम्रो'}
                  {rating === 5 && 'धेरै राम्रो'}
                </span>
              )}
            </div>
          )}

          {/* Comment Box */}
          <div className="space-y-2">
            {showCommentPrompt && rating && rating <= 2 && (
              <p className="text-sm text-muted-foreground">
                के समस्या बारे थोरै लेखिदिनुहुन्छ? (ऐच्छिक)
              </p>
            )}
            <Textarea
              placeholder={
                feedbackType === 'bug_report'
                  ? 'समस्या बारे विस्तृत लेख्नुहोस्...'
                  : feedbackType === 'feature_request'
                  ? 'तपाईंको सुझाव लेख्नुहोस्...'
                  : 'थप टिप्पणी (ऐच्छिक)...'
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (feedbackType === 'bug_report' && !comment) ||
              (feedbackType === 'feature_request' && !comment)
            }
            className="w-full gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                पठाउँदै...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                पठाउनुहोस्
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
