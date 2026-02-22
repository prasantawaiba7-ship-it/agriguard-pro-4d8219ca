import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MessageCircle, Clock, ChevronRight, Send, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useMyExpertCases, useTicketMessages, useSendTicketMessage } from '@/hooks/useExpertCases';
import { useMyDiagnosisCases } from '@/hooks/useDiagnosisCases';
import type { DiagnosisCaseWithDetails } from '@/hooks/useDiagnosisCases';
import type { ExpertCase } from '@/hooks/useExpertCases';
import { useNotifications } from '@/hooks/useNotifications';
import { PageTransition } from '@/components/layout/PageTransition';
import Header from '@/components/layout/Header';
import { UserBar } from '@/components/layout/UserBar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Unified case type ──────────────────────────────────────
interface UnifiedCase {
  id: string;
  source: 'cases' | 'diagnosis';
  cropName: string;
  problemType: string | null;
  district: string | null;
  status: string;
  statusLabel: string;
  statusColor: string;
  priority: string;
  priorityLabel: string;
  priorityColor: string;
  farmerQuestion: string | null;
  aiSummary: any;
  images: { url: string }[];
  suggestions: any[];
  createdAt: string;
  raw: ExpertCase | DiagnosisCaseWithDetails;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: 'नयाँ', color: 'bg-blue-500/15 text-blue-700 border-blue-300' },
  ai_suggested: { label: 'AI सुझाव', color: 'bg-purple-500/15 text-purple-700 border-purple-300' },
  in_review: { label: 'हेर्दै', color: 'bg-yellow-500/15 text-yellow-700 border-yellow-300' },
  expert_pending: { label: 'हेर्दै', color: 'bg-yellow-500/15 text-yellow-700 border-yellow-300' },
  answered: { label: 'जवाफ आएको', color: 'bg-green-500/15 text-green-700 border-green-300' },
  expert_answered: { label: 'जवाफ आएको', color: 'bg-green-500/15 text-green-700 border-green-300' },
  closed: { label: 'बन्द', color: 'bg-muted text-muted-foreground border-border' },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'सामान्य', color: 'text-green-600' },
  normal: { label: 'सामान्य', color: 'text-green-600' },
  medium: { label: 'मध्यम', color: 'text-orange-500' },
  high: { label: 'अत्यावश्यक', color: 'text-destructive' },
};

function getStatusInfo(status: string) {
  return STATUS_MAP[status] || STATUS_MAP.new;
}
function getPriorityInfo(priority: string) {
  return PRIORITY_MAP[priority] || PRIORITY_MAP.low;
}

// ── Hooks for case_messages (diagnosis_cases thread) ──────
function useDiagnosisCaseMessages(caseId: string | null) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['case-messages', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase
        .from('case_messages')
        .select('*')
        .eq('case_id', caseId)
        .eq('is_internal_note', false)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!caseId,
  });
  useEffect(() => {
    if (!caseId) return;
    const channel = supabase
      .channel(`case-msgs-${caseId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'case_messages', filter: `case_id=eq.${caseId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['case-messages', caseId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [caseId, queryClient]);
  return query;
}

function useSendDiagnosisCaseMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { caseId: string; message: string }) => {
      const { error } = await supabase.from('case_messages').insert({
        case_id: data.caseId,
        sender_type: 'farmer',
        message_text: data.message,
        sender_id: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['case-messages', vars.caseId] });
      queryClient.invalidateQueries({ queryKey: ['my-diagnosis-cases'] });
    },
  });
}

// ── List item ─────────────────────────────────────────────
function CaseListItem({ c, onClick, hasUnread }: { c: UnifiedCase; onClick: () => void; hasUnread: boolean }) {
  return (
    <Card className={`cursor-pointer hover:border-primary/30 transition-colors ${hasUnread ? 'border-primary/40 bg-primary/5' : ''}`} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🌱</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-sm text-foreground truncate">{c.cropName}</span>
              <Badge variant="outline" className={`text-[10px] ${c.statusColor}`}>{c.statusLabel}</Badge>
              {hasUnread && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 animate-pulse">नयाँ जवाफ</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {c.farmerQuestion || c.problemType || 'सामान्य प्रश्न'} • {c.district || '—'}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
              <span className={c.priorityColor}>● {c.priorityLabel}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(c.createdAt).toLocaleDateString('ne-NP')}
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

// ── Detail view (handles both sources) ────────────────────
function CaseDetailView({ caseData, onBack }: { caseData: UnifiedCase; onBack: () => void }) {
  // For 'cases' source → ticket_messages; for 'diagnosis' → case_messages
  const ticketMsgs = useTicketMessages(caseData.source === 'cases' ? caseData.id : null);
  const diagMsgs = useDiagnosisCaseMessages(caseData.source === 'diagnosis' ? caseData.id : null);
  const sendTicket = useSendTicketMessage();
  const sendDiag = useSendDiagnosisCaseMessage();

  const messages = caseData.source === 'cases' ? ticketMsgs.data : diagMsgs.data;
  const isLoading = caseData.source === 'cases' ? ticketMsgs.isLoading : diagMsgs.isLoading;
  const isSending = sendTicket.isPending || sendDiag.isPending;

  const [replyText, setReplyText] = useState('');

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    if (caseData.source === 'cases') {
      await sendTicket.mutateAsync({ caseId: caseData.id, message: replyText.trim() });
    } else {
      await sendDiag.mutateAsync({ caseId: caseData.id, message: replyText.trim() });
    }
    setReplyText('');
  };

  const isClosed = caseData.status === 'closed';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-base font-semibold flex items-center gap-2">
            🌱 {caseData.cropName}
            <Badge variant="outline" className={`text-[10px] ${caseData.statusColor}`}>{caseData.statusLabel}</Badge>
          </h2>
          <p className="text-xs text-muted-foreground">
            KS-{caseData.id.slice(0, 8).toUpperCase()} • <span className={caseData.priorityColor}>{caseData.priorityLabel}</span>
          </p>
        </div>
      </div>

      {/* Images */}
      {caseData.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {caseData.images.map((img, i) => (
            <img key={i} src={img.url} alt="crop" className="w-20 h-20 rounded-lg object-cover border flex-shrink-0" />
          ))}
        </div>
      )}

      {/* Farmer question */}
      {caseData.farmerQuestion && (
        <Card className="border-border/40 bg-muted/30">
          <CardContent className="p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">📝 तपाईंको प्रश्न</p>
            <p className="text-sm text-foreground">{caseData.farmerQuestion}</p>
          </CardContent>
        </Card>
      )}

      {/* AI Summary (from cases table) */}
      {caseData.aiSummary && (
        <Card className="border-border/40 bg-muted/30">
          <CardContent className="p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">🤖 AI विश्लेषण</p>
            <p className="text-sm text-foreground">
              {caseData.aiSummary.detectedIssue || caseData.aiSummary.aiDisease || '—'}
              {caseData.aiSummary.confidence && (
                <span className="text-muted-foreground"> ({Math.round(caseData.aiSummary.confidence * 100)}%)</span>
              )}
            </p>
            {caseData.aiSummary.aiRecommendation && (
              <p className="text-xs text-muted-foreground mt-1">{caseData.aiSummary.aiRecommendation}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diagnosis suggestions */}
      {caseData.suggestions.length > 0 && (
        <div className="space-y-2">
          {caseData.suggestions.map((s: any) => (
            <Card key={s.id} className={`border-border/40 ${s.source_type === 'human_expert' ? 'bg-blue-500/5 border-blue-200' : 'bg-muted/30'}`}>
              <CardContent className="p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {s.source_type === 'human_expert' ? '👨‍🌾 विज्ञको जवाफ' : '🤖 AI विश्लेषण'}
                  {s.confidence_level && <span className="ml-1">({s.confidence_level}%)</span>}
                </p>
                {s.suspected_problem && <p className="text-sm font-medium text-foreground">{s.suspected_problem}</p>}
                {s.advice_text && <p className="text-xs text-muted-foreground mt-1">{s.advice_text}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status hint */}
      {['new', 'in_review', 'ai_suggested', 'expert_pending'].includes(caseData.status) && (
        <p className="text-xs text-center text-muted-foreground px-4">
          कृपया प्रतीक्षा गर्नुहोस्, कृषि विज्ञले हेर्दै हुनुहुन्छ।
        </p>
      )}
      {['answered', 'expert_answered'].includes(caseData.status) && (
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
          messages.map((msg: any) => {
            const isFarmer = msg.sender_type === 'farmer';
            const isExpert = msg.sender_type === 'expert';
            const text = msg.message || msg.message_text || '';
            const atts = msg.attachments;
            return (
              <div key={msg.id} className={`flex ${isFarmer ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  isFarmer
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : isExpert
                    ? 'bg-blue-500/10 text-foreground border border-blue-200 rounded-bl-md'
                    : 'bg-muted text-muted-foreground rounded-bl-md'
                }`}>
                  <p className="text-[10px] font-medium mb-0.5 opacity-70">
                    {isFarmer ? 'तपाईं' : isExpert ? '👨‍🌾 विज्ञ' : '🤖 System'}
                  </p>
                  <p className="whitespace-pre-wrap">{text}</p>
                  {atts && Array.isArray(atts) && atts.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {atts.map((att: any, i: number) => (
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
      {!isClosed && (
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="थप प्रश्न लेख्नुहोस्..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            className="resize-none text-sm flex-1"
          />
          <Button size="icon" onClick={handleSendReply} disabled={!replyText.trim() || isSending}>
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function MyQuestionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: expertCases, isLoading: expertLoading } = useMyExpertCases();
  const { data: diagCases, isLoading: diagLoading } = useMyDiagnosisCases();
  const { notifications, markAsRead } = useNotifications();
  const [selectedCase, setSelectedCase] = useState<UnifiedCase | null>(null);

  const isLoading = expertLoading || diagLoading;

  // Merge both sources into unified list
  const allCases: UnifiedCase[] = [];

  // From 'cases' table (AskExpertForm submissions)
  (expertCases || []).forEach((c) => {
    const st = getStatusInfo(c.status || 'new');
    const pr = getPriorityInfo(c.priority || 'low');
    const imgUrls = c.ai_summary?.imageUrls || [];
    allCases.push({
      id: c.id,
      source: 'cases',
      cropName: c.crop || 'अज्ञात बाली',
      problemType: c.problem_type,
      district: c.district,
      status: c.status || 'new',
      statusLabel: st.label,
      statusColor: st.color,
      priority: c.priority || 'low',
      priorityLabel: pr.label,
      priorityColor: pr.color,
      farmerQuestion: null,
      aiSummary: c.ai_summary,
      images: (imgUrls as string[]).map((url: string) => ({ url })),
      suggestions: [],
      createdAt: c.created_at,
      raw: c,
    });
  });

  // From 'diagnosis_cases' table (DiagnosisCaseSubmit submissions)
  (diagCases || []).forEach((c) => {
    const st = getStatusInfo(c.case_status || 'new');
    const pr = getPriorityInfo(c.priority || 'normal');
    allCases.push({
      id: c.id,
      source: 'diagnosis',
      cropName: c.crops?.name_ne || c.crops?.name_en || 'अज्ञात बाली',
      problemType: c.problem_type,
      district: c.districts?.name_ne || null,
      status: c.case_status || 'new',
      statusLabel: st.label,
      statusColor: st.color,
      priority: c.priority || 'normal',
      priorityLabel: pr.label,
      priorityColor: pr.color,
      farmerQuestion: c.farmer_question,
      aiSummary: null,
      images: (c.images || []).map((img) => ({ url: img.image_url })),
      suggestions: c.suggestions || [],
      createdAt: c.created_at,
      raw: c,
    });
  });

  // Sort by date descending
  allCases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Unread notification case IDs
  const unreadCaseIds = new Set(
    (notifications || [])
      .filter(n => !n.read && n.type === 'expert_reply' && (n.data as any)?.case_id)
      .map(n => (n.data as any).case_id as string)
  );

  const handleSelectCase = (c: UnifiedCase) => {
    setSelectedCase(c);
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
              ) : allCases.length > 0 ? (
                <div className="space-y-3">
                  {allCases.map((c) => (
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
