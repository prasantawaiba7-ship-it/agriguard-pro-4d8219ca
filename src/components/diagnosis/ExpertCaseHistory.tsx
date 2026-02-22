import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, CheckCircle, ChevronDown, ChevronUp, 
  User, Bot, Leaf, AlertCircle, MessageSquare, Loader2, Send
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useMyExpertCases, useTicketMessages, useSendTicketMessage, type ExpertCase } from '@/hooks/useExpertCases';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDistanceToNow } from 'date-fns';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'नयाँ', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Clock className="w-3 h-3" /> },
  in_review: { label: 'हेर्दै', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" /> },
  answered: { label: 'जवाफ आयो! ✅', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" /> },
  closed: { label: 'बन्द', color: 'bg-muted text-muted-foreground border-border', icon: <CheckCircle className="w-3 h-3" /> },
};

function ExpertCaseCard({ caseData }: { caseData: ExpertCase }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: messages, isLoading: msgsLoading } = useTicketMessages(isExpanded ? caseData.id : null);

  const status = STATUS_MAP[caseData.status || 'new'] || STATUS_MAP.new;
  const imageUrls: string[] = caseData.ai_summary?.imageUrls || [];
  const aiSummary = caseData.ai_summary;

  return (
    <Card className="overflow-hidden border-border/40">
      <div
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          {imageUrls[0] && (
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-border/30">
              <img src={imageUrls[0]} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={`text-xs ${status.color} border`}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(caseData.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="font-medium text-sm text-foreground">
              {caseData.crop || 'बाली'}
            </p>
            {caseData.problem_type && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {caseData.problem_type} • {caseData.district || ''}
              </p>
            )}
          </div>

          <Button variant="ghost" size="icon" className="flex-shrink-0 w-8 h-8">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0 pb-4 space-y-4 px-4">
              {/* All photos */}
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border/30">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Case ID */}
              <p className="text-xs text-muted-foreground">
                केस: <span className="font-mono">KS-{caseData.id.slice(0, 8).toUpperCase()}</span>
              </p>

              {/* AI Summary */}
              {aiSummary && (aiSummary.detectedIssue || aiSummary.aiDisease) && (
                <div className="p-3 bg-muted/40 rounded-xl border border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">AI विश्लेषण</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {aiSummary.detectedIssue || aiSummary.aiDisease}
                    {aiSummary.confidence && (
                      <span className="text-muted-foreground"> ({Math.round(aiSummary.confidence * 100)}%)</span>
                    )}
                  </p>
                  {aiSummary.aiRecommendation && (
                    <p className="text-xs text-muted-foreground mt-1">{aiSummary.aiRecommendation}</p>
                  )}
                </div>
              )}

              {/* Messages thread */}
              {msgsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-2">
                  {messages.map((msg: any) => {
                    const isExpert = msg.sender_type === 'expert';
                    const text = msg.message || '';
                    if (msg.sender_type === 'expert_note') return null;
                    return (
                      <div key={msg.id} className={`p-3 rounded-xl ${
                        isExpert 
                          ? 'bg-green-500/5 border-2 border-green-500/30' 
                          : 'bg-muted/40 border border-border/30'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {isExpert ? (
                            <>
                              <User className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-xs font-semibold text-green-700">कृषि विज्ञको जवाफ</span>
                            </>
                          ) : (
                            <>
                              <Leaf className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-medium text-muted-foreground">तपाईं</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{text}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-center">
                  <Clock className="w-6 h-6 mx-auto text-amber-500 mb-2" />
                  <p className="text-sm font-medium text-foreground">विज्ञको जवाफ पर्खिरहेको छ</p>
                  <p className="text-xs text-muted-foreground mt-1">औसत जवाफ समय: लगभग २४ घण्टा</p>
                </div>
              )}

              {/* Follow-up reply */}
              {caseData.status !== 'closed' && (
                <FollowUpReply caseId={caseData.id} />
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function FollowUpReply({ caseId }: { caseId: string }) {
  const [text, setText] = useState('');
  const sendMessage = useSendTicketMessage();

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage.mutateAsync({ caseId, message: text.trim() });
    setText('');
  };

  return (
    <div className="flex gap-2">
      <Textarea
        placeholder="थप प्रश्न सोध्नुहोस्..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={1}
        className="resize-none text-sm flex-1 min-h-[36px]"
      />
      <Button
        size="icon"
        className="flex-shrink-0 h-9 w-9"
        disabled={!text.trim() || sendMessage.isPending}
        onClick={handleSend}
      >
        {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </Button>
    </div>
  );
}

export function ExpertCaseHistory() {
  const { user } = useAuth();
  const { data: cases, isLoading } = useMyExpertCases();

  if (!user) {
    return (
      <Card className="border-border/40">
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            आफ्ना प्रश्नहरू हेर्न लगइन गर्नुहोस्
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          मेरा प्रश्नहरू
        </h2>
        {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        मेरा प्रश्नहरू
      </h2>

      {cases && cases.length > 0 ? (
        <div className="space-y-3">
          {cases.map(caseData => (
            <ExpertCaseCard key={caseData.id} caseData={caseData} />
          ))}
        </div>
      ) : (
        <Card className="border-border/40">
          <CardContent className="py-8 text-center">
            <Leaf className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              अहिलेसम्म कुनै प्रश्न पठाइएको छैन
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              माथिको फारम भर्नुहोस् र विज्ञलाई पठाउनुहोस्
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
