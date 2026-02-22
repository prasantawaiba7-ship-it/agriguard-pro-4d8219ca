import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MessageCircle, Clock, CheckCircle2,
  AlertTriangle, ChevronRight, Send, Loader2, Image as ImageIcon, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useMyExpertCases, useTicketMessages, useSendTicketMessage } from '@/hooks/useExpertCases';
import { useNotifications } from '@/hooks/useNotifications';
import type { ExpertCase } from '@/hooks/useExpertCases';
import { PageTransition } from '@/components/layout/PageTransition';
import Header from '@/components/layout/Header';
import { UserBar } from '@/components/layout/UserBar';
import { useNavigate } from 'react-router-dom';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: 'नयाँ', color: 'bg-blue-500/15 text-blue-700 border-blue-300' },
  in_review: { label: 'हेर्दै', color: 'bg-yellow-500/15 text-yellow-700 border-yellow-300' },
  answered: { label: 'जवाफ आएको', color: 'bg-green-500/15 text-green-700 border-green-300' },
  closed: { label: 'बन्द', color: 'bg-muted text-muted-foreground border-border' },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'सामान्य', color: 'text-green-600' },
  medium: { label: 'मध्यम', color: 'text-orange-500' },
  high: { label: 'अत्यावश्यक', color: 'text-destructive' },
};

const CROP_EMOJI: Record<string, string> = {
  rice: '🌾', wheat: '🌾', maize: '🌽', potato: '🥔', tomato: '🍅',
  vegetables: '🥬', fruits: '🍎', default: '🌱',
};

function getCropEmoji(crop: string | null): string {
  if (!crop) return '🌱';
  const lower = crop.toLowerCase();
  return CROP_EMOJI[lower] || '🌱';
}

function CaseListItem({ c, onClick, hasUnread }: { c: ExpertCase; onClick: () => void; hasUnread: boolean }) {
  const status = STATUS_MAP[c.status || 'new'] || STATUS_MAP.new;
  const priority = PRIORITY_MAP[c.priority || 'low'] || PRIORITY_MAP.low;

  return (
    <Card className={`cursor-pointer hover:border-primary/30 transition-colors ${hasUnread ? 'border-primary/40 bg-primary/5' : ''}`} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getCropEmoji(c.crop)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-sm text-foreground truncate">
                {c.crop || 'अज्ञात बाली'}
              </span>
              <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                {status.label}
              </Badge>
              {hasUnread && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 animate-pulse">
                  नयाँ जवाफ
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {c.problem_type || 'सामान्य प्रश्न'} • {c.district || '—'}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
              <span className={priority.color}>● {priority.label}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(c.created_at).toLocaleDateString('ne-NP')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 mt-1">
            {hasUnread && <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CaseDetailView({ caseData, onBack }: { caseData: ExpertCase; onBack: () => void }) {
  const { data: messages, isLoading } = useTicketMessages(caseData.id);
  const sendMessage = useSendTicketMessage();
  const [replyText, setReplyText] = useState('');
  const status = STATUS_MAP[caseData.status || 'new'] || STATUS_MAP.new;
  const priority = PRIORITY_MAP[caseData.priority || 'low'] || PRIORITY_MAP.low;

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    await sendMessage.mutateAsync({ caseId: caseData.id, message: replyText.trim() });
    setReplyText('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-base font-semibold flex items-center gap-2">
            {getCropEmoji(caseData.crop)} {caseData.crop || 'प्रश्न'}
            <Badge variant="outline" className={`text-[10px] ${status.color}`}>{status.label}</Badge>
          </h2>
          <p className="text-xs text-muted-foreground">
            KS-{caseData.id.slice(0, 8).toUpperCase()} • <span className={priority.color}>{priority.label}</span>
          </p>
        </div>
      </div>

      {/* AI Summary */}
      {caseData.ai_summary && (
        <Card className="border-border/40 bg-muted/30">
          <CardContent className="p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">🤖 AI विश्लेषण</p>
            <p className="text-sm text-foreground">
              {caseData.ai_summary.detectedIssue || caseData.ai_summary.aiDisease || '—'}
              {caseData.ai_summary.confidence && (
                <span className="text-muted-foreground"> ({Math.round(caseData.ai_summary.confidence * 100)}%)</span>
              )}
            </p>
            {caseData.ai_summary.aiRecommendation && (
              <p className="text-xs text-muted-foreground mt-1">{caseData.ai_summary.aiRecommendation}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status message */}
      {(caseData.status === 'new' || caseData.status === 'in_review') && (
        <p className="text-xs text-center text-muted-foreground px-4">
          कृपया प्रतीक्षा गर्नुहोस्, कृषि विज्ञले हेर्दै हुनुहुन्छ।
        </p>
      )}
      {caseData.status === 'answered' && (
        <p className="text-xs text-center text-primary px-4">
          यदि अझै समस्या छ भने तल 'थप प्रश्न सोध्नुहोस्' थिच्नुहोस्।
        </p>
      )}

      {/* Messages thread */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg) => {
            const isFarmer = msg.sender_type === 'farmer';
            const isExpert = msg.sender_type === 'expert';
            return (
              <div key={msg.id} className={`flex ${isFarmer ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    isFarmer
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : isExpert
                      ? 'bg-blue-500/10 text-foreground border border-blue-200 rounded-bl-md'
                      : 'bg-muted text-muted-foreground rounded-bl-md'
                  }`}
                >
                  <p className="text-[10px] font-medium mb-0.5 opacity-70">
                    {isFarmer ? 'तपाईं' : isExpert ? '👨‍🌾 विज्ञ' : '🤖 System'}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                  {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {msg.attachments.map((att: any, i: number) => (
                        att.type === 'image' && att.url ? (
                          <img key={i} src={att.url} alt="attachment" className="w-16 h-16 rounded-lg object-cover" />
                        ) : null
                      ))}
                    </div>
                  )}
                  <p className="text-[9px] opacity-50 mt-1">
                    {new Date(msg.created_at).toLocaleString('ne-NP')}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-sm text-muted-foreground py-6">कुनै सन्देश छैन।</p>
        )}
      </div>

      {/* Reply input */}
      {caseData.status !== 'closed' && (
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="थप प्रश्न लेख्नुहोस्..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            className="resize-none text-sm flex-1"
          />
          <Button
            size="icon"
            onClick={handleSendReply}
            disabled={!replyText.trim() || sendMessage.isPending}
          >
            {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function MyQuestionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: cases, isLoading } = useMyExpertCases();
  const { notifications, markAsRead } = useNotifications();
  const [selectedCase, setSelectedCase] = useState<ExpertCase | null>(null);

  // Get case IDs that have unread expert_reply notifications
  const unreadCaseIds = new Set(
    (notifications || [])
      .filter(n => !n.read && n.type === 'expert_reply' && (n.data as any)?.case_id)
      .map(n => (n.data as any).case_id as string)
  );

  // When opening a case, mark its notifications as read
  const handleSelectCase = (c: ExpertCase) => {
    setSelectedCase(c);
    // Mark related notifications as read
    (notifications || [])
      .filter(n => !n.read && n.type === 'expert_reply' && (n.data as any)?.case_id === c.id)
      .forEach(n => markAsRead(n.id));
  };

  if (!user) {
    return (
      <PageTransition>
        <Header />
        <main className="container max-w-lg mx-auto px-4 py-8 pb-24 text-center">
          <p className="text-muted-foreground">कृपया पहिले लगइन गर्नुहोस्।</p>
          <Button className="mt-4" onClick={() => navigate('/auth')}>लगइन</Button>
        </main>
        <UserBar />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Header />
      <main className="container max-w-lg mx-auto px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          {selectedCase ? (
            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <CaseDetailView caseData={selectedCase} onBack={() => setSelectedCase(null)} />
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  मेरा प्रश्नहरू
                  {unreadCaseIds.size > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-xs animate-pulse">
                      {unreadCaseIds.size}
                    </Badge>
                  )}
                </h1>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : cases && cases.length > 0 ? (
                <div className="space-y-3">
                  {cases.map((c) => (
                    <CaseListItem key={c.id} c={c} onClick={() => handleSelectCase(c)} hasUnread={unreadCaseIds.has(c.id)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm">अहिलेसम्म कुनै प्रश्न पठाउनुभएको छैन।</p>
                  <Button variant="outline" onClick={() => navigate('/disease-detection')}>
                    विज्ञलाई सोध्नुहोस्
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <UserBar />
    </PageTransition>
  );
}
