import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FeedbackDialog } from './FeedbackDialog';
import { FeedbackType, FeedbackTargetType, useFeedback } from '@/hooks/useFeedback';
import { toast } from 'sonner';

interface QuickRatingButtonProps {
  feedbackType: FeedbackType;
  targetType: FeedbackTargetType;
  targetId?: string;
  variant?: 'stars' | 'thumbs' | 'minimal';
  label?: string;
  className?: string;
  directSubmit?: boolean; // If true, submit rating directly without dialog
}

export function QuickRatingButton({
  feedbackType,
  targetType,
  targetId,
  variant = 'thumbs',
  label,
  className,
  directSubmit = false,
}: QuickRatingButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [preselectedRating, setPreselectedRating] = useState<number | null>(null);
  const [submittedRating, setSubmittedRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const { submitFeedback, isSubmitting } = useFeedback();

  const handleQuickRating = (rating: number, openDialog = true) => {
    if (directSubmit && variant === 'stars') {
      // Direct submit without dialog
      setSubmittedRating(rating);
      submitFeedback({
        feedback_type: feedbackType,
        target_type: targetType,
        target_id: targetId,
        rating,
        comment_text: null,
      });
      toast.success('धन्यवाद!', { description: 'तपाईंको प्रतिक्रिया सेभ भयो।' });
    } else if (openDialog) {
      setPreselectedRating(rating);
      setShowDialog(true);
    }
  };

  if (variant === 'thumbs') {
    return (
      <>
        <div className={cn('flex items-center gap-2', className)}>
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
            onClick={() => handleQuickRating(5)}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
            onClick={() => handleQuickRating(1)}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>

        <FeedbackDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          feedbackType={feedbackType}
          targetType={targetType}
          targetId={targetId}
          preselectedRating={preselectedRating}
        />
      </>
    );
  }

  if (variant === 'minimal') {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-1 text-xs text-muted-foreground hover:text-primary', className)}
          onClick={() => setShowDialog(true)}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {label || 'प्रतिक्रिया'}
        </Button>

        <FeedbackDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          feedbackType={feedbackType}
          targetType={targetType}
          targetId={targetId}
        />
      </>
    );
  }

  // Stars variant
  return (
    <>
      <div className={cn('flex flex-col gap-1', className)}>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Button
              key={star}
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 w-8 p-0 hover:bg-yellow-50 transition-transform hover:scale-110',
                isSubmitting && 'opacity-50 pointer-events-none'
              )}
              onClick={() => handleQuickRating(star, !directSubmit)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(null)}
              disabled={isSubmitting}
            >
              <Star
                className={cn(
                  'h-5 w-5 transition-colors',
                  (submittedRating && star <= submittedRating) || (hoveredStar && star <= hoveredStar)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-muted-foreground/40'
                )}
              />
            </Button>
          ))}
        </div>
        {submittedRating && directSubmit && (
          <span className="text-xs text-green-600 font-medium">
            ✓ {submittedRating} तारा दिनुभयो
          </span>
        )}
      </div>

      {!directSubmit && (
        <FeedbackDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          feedbackType={feedbackType}
          targetType={targetType}
          targetId={targetId}
          preselectedRating={preselectedRating}
        />
      )}
    </>
  );
}
