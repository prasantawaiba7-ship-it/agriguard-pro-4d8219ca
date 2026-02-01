import { useState } from 'react';
import { MessageSquarePlus, Bug, Lightbulb, Star, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useFeedback, FeedbackType } from '@/hooks/useFeedback';

const feedbackTypes = [
  {
    type: 'app_experience' as FeedbackType,
    label: 'एप अनुभव',
    icon: Star,
    description: 'एप बारे सामान्य प्रतिक्रिया',
    color: 'text-yellow-600 bg-yellow-50',
  },
  {
    type: 'bug_report' as FeedbackType,
    label: 'समस्या रिपोर्ट',
    icon: Bug,
    description: 'कुनै समस्या भेट्नुभयो?',
    color: 'text-red-600 bg-red-50',
  },
  {
    type: 'feature_request' as FeedbackType,
    label: 'नयाँ सुझाव',
    icon: Lightbulb,
    description: 'नयाँ फिचरको आइडिया',
    color: 'text-blue-600 bg-blue-50',
  },
];

export function GeneralFeedbackForm() {
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const { submitFeedback, isSubmitting } = useFeedback();

  const handleSubmit = () => {
    if (!selectedType) return;
    if ((selectedType === 'bug_report' || selectedType === 'feature_request') && !comment) return;

    submitFeedback({
      feedback_type: selectedType,
      target_type: 'app',
      rating: selectedType === 'app_experience' ? rating : null,
      comment_text: comment || null,
    });

    // Reset form
    setSelectedType(null);
    setRating(null);
    setComment('');
  };

  const displayRating = hoveredRating || rating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquarePlus className="h-5 w-5 text-primary" />
          प्रतिक्रिया र सुझाव
        </CardTitle>
        <CardDescription>
          तपाईंको प्रतिक्रियाले हामीलाई एप सुधार गर्न मद्दत गर्छ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Feedback Type Selection */}
        <div className="space-y-2">
          <Label>प्रतिक्रियाको प्रकार छान्नुहोस्</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {feedbackTypes.map((ft) => (
              <button
                key={ft.type}
                type="button"
                onClick={() => setSelectedType(ft.type)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                  selectedType === ft.type
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-muted/50 hover:border-muted-foreground/20'
                )}
              >
                <div className={cn('p-2 rounded-full', ft.color)}>
                  <ft.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{ft.label}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {ft.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedType && (
          <>
            {/* Star Rating for app_experience */}
            {selectedType === 'app_experience' && (
              <div className="space-y-2">
                <Label>रेटिङ दिनुहोस्</Label>
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
              </div>
            )}

            {/* Comment Box */}
            <div className="space-y-2">
              <Label>
                {selectedType === 'bug_report'
                  ? 'समस्या बारे लेख्नुहोस् *'
                  : selectedType === 'feature_request'
                  ? 'तपाईंको सुझाव *'
                  : 'थप टिप्पणी (ऐच्छिक)'}
              </Label>
              <Textarea
                placeholder={
                  selectedType === 'bug_report'
                    ? 'के समस्या भयो? कहाँ भयो? विस्तृत लेख्नुहोस्...'
                    : selectedType === 'feature_request'
                    ? 'कस्तो नयाँ फिचर चाहनुहुन्छ? विस्तृत लेख्नुहोस्...'
                    : 'तपाईंको अनुभव बारे थप लेख्नुहोस्...'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                ((selectedType === 'bug_report' || selectedType === 'feature_request') && !comment)
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
