import { useState } from 'react';
import { Star, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubmitTicketFeedback } from '@/hooks/useExpertTickets';

interface TicketFeedbackCardProps {
  ticketId: string;
  alreadySubmitted?: boolean;
  existingScore?: number;
}

export function TicketFeedbackCard({ ticketId, alreadySubmitted, existingScore }: TicketFeedbackCardProps) {
  const [score, setScore] = useState(existingScore || 0);
  const [feedback, setFeedback] = useState('');
  const [resolution, setResolution] = useState<'resolved' | 'unresolved' | 'followup_needed' | null>(null);
  const [submitted, setSubmitted] = useState(alreadySubmitted || false);
  const submitFeedback = useSubmitTicketFeedback();

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="py-3 text-center">
          <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
          <p className="text-sm text-green-700 dark:text-green-400">प्रतिक्रिया दिइसक्नुभयो। धन्यवाद!</p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = () => {
    if (!resolution || score === 0) return;
    submitFeedback.mutate(
      { ticketId, satisfactionScore: score, feedback: feedback.trim() || undefined, resolutionStatus: resolution },
      { onSuccess: () => setSubmitted(true) }
    );
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold">📋 जवाफ कस्तो लाग्यो?</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {/* Star rating */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">तारा:</span>
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setScore(s)} className="p-0.5">
              <Star
                className={`h-6 w-6 transition-colors ${s <= score ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
              />
            </button>
          ))}
        </div>

        {/* Resolution status */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={resolution === 'resolved' ? 'default' : 'outline'}
            className="text-xs flex-1"
            onClick={() => setResolution('resolved')}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1" /> समस्या मिल्यो
          </Button>
          <Button
            size="sm"
            variant={resolution === 'unresolved' ? 'destructive' : 'outline'}
            className="text-xs flex-1"
            onClick={() => setResolution('unresolved')}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" /> मिलेन
          </Button>
          <Button
            size="sm"
            variant={resolution === 'followup_needed' ? 'secondary' : 'outline'}
            className="text-xs flex-1"
            onClick={() => setResolution('followup_needed')}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> थप चाहिन्छ
          </Button>
        </div>

        {/* Optional comment */}
        <Textarea
          placeholder="थप कुरा भए लेख्नुहोस् (ऐच्छिक)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="text-sm min-h-[50px]"
          rows={2}
        />

        <Button
          onClick={handleSubmit}
          disabled={score === 0 || !resolution || submitFeedback.isPending}
          className="w-full"
          size="sm"
        >
          {submitFeedback.isPending ? 'पठाउँदै...' : 'प्रतिक्रिया पठाउनुहोस्'}
        </Button>
      </CardContent>
    </Card>
  );
}
