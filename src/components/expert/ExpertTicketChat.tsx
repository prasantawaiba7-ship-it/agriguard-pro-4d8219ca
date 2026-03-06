import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ImagePlus, User, Shield, FileText, Phone, PhoneCall, PhoneOff, PhoneIncoming, Clock, CheckCircle2, XCircle, X, AlertTriangle, Mic } from 'lucide-react';
import { VoiceNoteRecorder } from '@/components/voice/VoiceNoteRecorder';
import { VoiceNoteBubble } from '@/components/voice/VoiceNoteBubble';
import { TicketFeedbackCard } from '@/components/feedback/TicketFeedbackCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useExpertTicketMessages, useSendExpertTicketMessage, uploadExpertImage } from '@/hooks/useExpertTickets';
import { useTicketCallRequest, useCreateCallRequest, useUpdateCallRequestStatus } from '@/hooks/useCallRequests';
import { formatDistanceToNow } from 'date-fns';
import { TemplatePicker } from './TemplatePicker';
import { ExpertTemplate } from '@/hooks/useExpertTemplates';
import { FarmContextLine } from '@/components/farm/FarmContextLine';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { CallRequest } from '@/hooks/useCallRequests';

const PREFERRED_TIME_LABELS: Record<string, string> = {
  morning: 'बिहान (8–11 AM)',
  afternoon: 'दिउँसो (12–3 PM)',
  evening: 'बेलुका (4–6 PM)',
  anytime: 'जुनसुकै बेला',
};

const DECLINE_REASONS: Record<string, string> = {
  busy: 'अहिले व्यस्त छु',
  wrong_expert: 'यो विषय मेरो क्षेत्र होइन',
  use_chat: 'Chat मा लेख्नुहोस्, जवाफ दिन्छु',
  network: 'Network समस्या',
};

const SCHEDULE_OPTIONS = [
  { value: 'now', label: 'अहिले तुरुन्त call गर्ने' },
  { value: 'today_afternoon', label: 'आज दिउँसो ३–५ बीचमा' },
  { value: 'tomorrow_morning', label: 'भोलि बिहान ७–९ बीचमा' },
  { value: 'custom', label: 'आफ्नो समय लेख्ने...' },
];

function TechnicianCallRequestPanel({ callRequest, updateCallStatus, farmerPhone }: { callRequest: CallRequest; updateCallStatus: ReturnType<typeof useUpdateCallRequestStatus>; farmerPhone?: string | null }) {
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [scheduleOption, setScheduleOption] = useState('now');
  const [customTime, setCustomTime] = useState('');
  const [declineReason, setDeclineReason] = useState('busy');
  const [declineNote, setDeclineNote] = useState('');
  const [callSummary, setCallSummary] = useState('');
  const [showSummaryInput, setShowSummaryInput] = useState(false);

  const handleAccept = () => {
    const window = scheduleOption === 'custom' ? customTime.trim() : SCHEDULE_OPTIONS.find(o => o.value === scheduleOption)?.label || '';
    updateCallStatus.mutate({
      requestId: callRequest.id,
      status: 'accepted',
      scheduledWindow: window,
      ticketId: callRequest.ticket_id,
    }, { onSuccess: () => setAcceptDialogOpen(false) });
  };

  const handleDecline = () => {
    updateCallStatus.mutate({
      requestId: callRequest.id,
      status: 'declined',
      declineReason,
      declineNote: declineNote.trim() || undefined,
      ticketId: callRequest.ticket_id,
    }, { onSuccess: () => setDeclineDialogOpen(false) });
  };

  const handleStartCall = () => {
    // Mark as in_progress then open phone dialer
    updateCallStatus.mutate({
      requestId: callRequest.id,
      status: 'in_progress',
      ticketId: callRequest.ticket_id,
    }, {
      onSuccess: () => {
        if (farmerPhone) {
          window.open(`tel:${farmerPhone}`, '_self');
        }
      }
    });
  };

  const handleCompleteCall = () => {
    updateCallStatus.mutate({
      requestId: callRequest.id,
      status: 'completed',
      technicianNote: callSummary.trim() || undefined,
      ticketId: callRequest.ticket_id,
    }, {
      onSuccess: () => {
        setShowSummaryInput(false);
        setCallSummary('');
      }
    });
  };

  return (
    <div className="px-4 pb-2">
      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Phone className="w-4 h-4 text-primary" />
          {callRequest.status === 'requested' && '📞 किसानले Call अनुरोध गरेको छ'}
          {callRequest.status === 'accepted' && '✅ Call स्वीकार भएको छ'}
          {callRequest.status === 'in_progress' && '📞 Call हुँदैछ...'}
        </div>

        {/* Farmer phone display for expert */}
        {farmerPhone && callRequest.status !== 'requested' && (
          <p className="text-xs text-muted-foreground pl-6">
            📱 किसानको नम्बर: <span className="font-mono font-medium text-foreground">{farmerPhone}</span>
          </p>
        )}

        {callRequest.preferred_time && (
          <p className="text-xs text-muted-foreground pl-6">
            <Clock className="w-3 h-3 inline mr-1" />
            समय: {PREFERRED_TIME_LABELS[callRequest.preferred_time] || callRequest.preferred_time}
          </p>
        )}
        {callRequest.farmer_note && (
          <p className="text-xs text-muted-foreground pl-6">💬 नोट: {callRequest.farmer_note}</p>
        )}

        {/* --- STATE: requested --- */}
        {callRequest.status === 'requested' && (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 text-xs" onClick={() => setAcceptDialogOpen(true)}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Call स्वीकार
            </Button>
            <Button size="sm" variant="destructive" className="flex-1 text-xs" onClick={() => setDeclineDialogOpen(true)}>
              <XCircle className="w-3.5 h-3.5 mr-1" /> अस्वीकार
            </Button>
          </div>
        )}

        {/* --- STATE: accepted — show Call Now button --- */}
        {callRequest.status === 'accepted' && (
          <div className="space-y-2">
            {callRequest.scheduled_window && (
              <p className="text-xs font-medium text-green-700 dark:text-green-400 pl-6">
                <Clock className="w-3 h-3 inline mr-1" />
                {callRequest.scheduled_window}
              </p>
            )}
            <Button
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
              disabled={updateCallStatus.isPending}
              onClick={handleStartCall}
            >
              {updateCallStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <PhoneCall className="w-4 h-4 mr-1.5" />}
              📞 Call सुरु गर्नुहोस् (Call now)
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              ⚠️ Call गर्नु अघि किसानको पहिचान पुष्टि गर्नुहोस्
            </p>
          </div>
        )}

        {/* --- STATE: in_progress — Call ongoing --- */}
        {callRequest.status === 'in_progress' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium pl-6 animate-pulse">
              <PhoneCall className="w-3.5 h-3.5" />
              Call चलिरहेको छ...
            </div>
            {!showSummaryInput ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 text-xs"
                  disabled={updateCallStatus.isPending}
                  onClick={() => setShowSummaryInput(true)}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Call सकियो (Call finished)
                </Button>
                {farmerPhone && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => window.open(`tel:${farmerPhone}`, '_self')}
                  >
                    <Phone className="w-3 h-3 mr-1" /> पुन: Call
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  placeholder="Call को संक्षिप्त सारांश लेख्नुहोस् (optional)..."
                  value={callSummary}
                  onChange={e => setCallSummary(e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setShowSummaryInput(false)}>
                    रद्द
                  </Button>
                  <Button size="sm" className="flex-1 text-xs" disabled={updateCallStatus.isPending} onClick={handleCompleteCall}>
                    {updateCallStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '✅ सकियो, save गर्नुहोस्'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Safety tips for expert */}
        {['accepted', 'in_progress'].includes(callRequest.status) && (
          <div className="rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-2 text-[10px] text-amber-800 dark:text-amber-300 space-y-0.5">
            <p>💡 <strong>सुझाव:</strong></p>
            <p>• छोटो र स्पष्ट कुरा गर्नुहोस्, जटिल विषय chat मा लेख्नुहोस्</p>
            <p>• Network कमजोर भए voice note वा chat fallback प्रयोग गर्नुहोस्</p>
          </div>
        )}
      </div>

      {/* Accept dialog */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Phone className="w-5 h-5 text-primary" />
              Call समय तोक्नुहोस्
            </DialogTitle>
            <DialogDescription className="text-xs">किसानलाई कहिले call गर्नुहुन्छ?</DialogDescription>
          </DialogHeader>
          <RadioGroup value={scheduleOption} onValueChange={setScheduleOption} className="space-y-2">
            {SCHEDULE_OPTIONS.map(opt => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`sched-${opt.value}`} />
                <Label htmlFor={`sched-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
          {scheduleOption === 'custom' && (
            <Textarea
              placeholder="उदाहरण: आज ४:३० बजे call गर्छु"
              value={customTime}
              onChange={e => setCustomTime(e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
          )}
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setAcceptDialogOpen(false)}>रद्द</Button>
            <Button className="flex-1" disabled={updateCallStatus.isPending || (scheduleOption === 'custom' && !customTime.trim())} onClick={handleAccept}>
              {updateCallStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'स्वीकार गर्नुहोस्'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decline dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Call अस्वीकार गर्ने कारण</DialogTitle>
            <DialogDescription className="text-xs">किसानलाई कारण देखिनेछ।</DialogDescription>
          </DialogHeader>
          <RadioGroup value={declineReason} onValueChange={setDeclineReason} className="space-y-2">
            {Object.entries(DECLINE_REASONS).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <RadioGroupItem value={key} id={`decline-${key}`} />
                <Label htmlFor={`decline-${key}`} className="text-sm cursor-pointer">{label}</Label>
              </div>
            ))}
          </RadioGroup>
          <Textarea
            placeholder="थप नोट (Optional)"
            value={declineNote}
            onChange={e => setDeclineNote(e.target.value)}
            rows={2}
            className="text-sm resize-none"
          />
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeclineDialogOpen(false)}>रद्द</Button>
            <Button variant="destructive" className="flex-1" disabled={updateCallStatus.isPending} onClick={handleDecline}>
              {updateCallStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'अस्वीकार गर्नुहोस्'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Farmer Call Status Panel ─── */
function FarmerCallStatusPanel({ callRequest, technicianPhone, technicianName }: { callRequest: CallRequest; technicianPhone?: string | null; technicianName?: string }) {
  const status = callRequest.status;

  if (status === 'completed') {
    return (
      <div className="px-4 pb-2">
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>✅ Call सम्पन्न भयो।</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-2">
      <div className={`rounded-lg border-2 p-3 space-y-2 ${
        status === 'requested' ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700' :
        status === 'accepted' ? 'border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700' :
        status === 'in_progress' ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700' :
        status === 'declined' ? 'border-destructive/30 bg-destructive/5' :
        'border-border bg-muted/50'
      }`}>
        {/* Status header */}
        <div className="flex items-center gap-2 text-sm font-medium">
          {status === 'requested' && (
            <>
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700 dark:text-amber-300">⏳ Call अनुरोध प्रतीक्षामा छ</span>
            </>
          )}
          {status === 'accepted' && (
            <>
              <PhoneIncoming className="w-4 h-4 text-green-600" />
              <span className="text-green-700 dark:text-green-300">✅ Call स्वीकार भएको छ!</span>
            </>
          )}
          {status === 'in_progress' && (
            <>
              <PhoneCall className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="text-blue-700 dark:text-blue-300">📞 Call हुँदैछ...</span>
            </>
          )}
          {status === 'declined' && (
            <>
              <PhoneOff className="w-4 h-4 text-destructive" />
              <span className="text-destructive">❌ Call अस्वीकार गरिएको छ</span>
            </>
          )}
        </div>

        {/* Status-specific content */}
        {status === 'requested' && (
          <div className="space-y-1 pl-6">
            <p className="text-xs text-muted-foreground">कृषि विज्ञले तपाईंको अनुरोध हेर्दै हुनुहुन्छ।</p>
            {callRequest.preferred_time && (
              <p className="text-xs text-muted-foreground">
                🕐 समय: {PREFERRED_TIME_LABELS[callRequest.preferred_time] || callRequest.preferred_time}
              </p>
            )}
          </div>
        )}

        {status === 'accepted' && (
          <div className="space-y-2 pl-6">
            {callRequest.scheduled_window && (
              <p className="text-xs font-medium text-green-700 dark:text-green-400">
                🕐 {callRequest.scheduled_window} मा call आउँछ।
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              📱 कृपया आफ्नो फोन नजिकै राख्नुस्। कृषि विज्ञले चाँडै call गर्नुहुनेछ।
            </p>
            {technicianPhone && (
              <div className="pt-1">
                <a
                  href={`tel:${technicianPhone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  📞 विज्ञलाई Call गर्नुहोस्
                </a>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {technicianName && <span>{technicianName} • </span>}
                  {technicianPhone}
                </p>
              </div>
            )}
            <div className="rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-1.5 text-[10px] text-amber-800 dark:text-amber-300">
              💡 नेटवर्क कमजोर भए घाम लागेको खुला ठाउँमा जानुस्।
            </div>
          </div>
        )}

        {status === 'in_progress' && (
          <div className="space-y-1 pl-6">
            <p className="text-xs text-muted-foreground">कृषि विज्ञसँग कुरा भइरहेको छ।</p>
            {technicianPhone && (
              <a
                href={`tel:${technicianPhone}`}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <Phone className="w-3 h-3" /> पुन: Call गर्नुहोस्
              </a>
            )}
          </div>
        )}

        {status === 'declined' && (
          <div className="space-y-1 pl-6">
            <p className="text-xs text-muted-foreground">
              {callRequest.decline_reason === 'busy' && 'अहिले व्यस्त हुनुहुन्छ, कृपया पछि अनुरोध गर्नुस्।'}
              {callRequest.decline_reason === 'wrong_expert' && 'यो विषय अर्को विज्ञको क्षेत्र हो, अर्को विज्ञ छान्नुस्।'}
              {callRequest.decline_reason === 'use_chat' && 'Chat मा लेख्नुस्, जवाफ दिइनेछ।'}
              {callRequest.decline_reason === 'network' && 'Network समस्या छ, पछि प्रयास गर्नुस्।'}
              {!callRequest.decline_reason && 'कृपया chat मा लेख्नुस् वा पछि प्रयास गर्नुस्।'}
            </p>
            {callRequest.decline_note && (
              <p className="text-xs text-muted-foreground italic">"{callRequest.decline_note}"</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ExpertTicketChatProps {
  ticketId: string;
  cropName?: string;
  senderRole?: 'farmer' | 'technician';
  farmId?: string | null;
  farmCropId?: string | null;
  ticketStatus?: string;
  satisfactionScore?: number | null;
  feedbackAt?: string | null;
  technicianId?: string | null;
  farmerPhone?: string | null;
  technicianPhone?: string | null;
  technicianName?: string | null;
}

export function ExpertTicketChat({ ticketId, cropName, senderRole = 'farmer', farmId, farmCropId, ticketStatus, satisfactionScore, feedbackAt, technicianId, farmerPhone, technicianPhone, technicianName }: ExpertTicketChatProps) {
  const { user } = useAuth();
  const { data: messages, isLoading } = useExpertTicketMessages(ticketId);
  const sendMessage = useSendExpertTicketMessage();
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [preferredTime, setPreferredTime] = useState('');
  const [farmerNote, setFarmerNote] = useState('');
  const { data: existingCallRequest } = useTicketCallRequest(ticketId);
  const createCallRequest = useCreateCallRequest();
  const updateCallStatus = useUpdateCallRequestStatus();
  // Recommendation templates start
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  const handleTemplateSelect = (template: ExpertTemplate) => {
    setNewMessage(prev => {
      const prefix = prev.trim() ? prev.trim() + '\n\n' : '';
      return prefix + template.title + '\n\n' + template.body;
    });
  };
  // Recommendation templates end

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage.mutate({
      ticketId,
      message: newMessage.trim(),
      senderType: senderRole,
    });
    setNewMessage('');
  };

  const handleImageSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadExpertImage(file);
      sendMessage.mutate({
        ticketId,
        message: '',
        senderType: senderRole,
        imageUrl: url,
      });
    } catch {
      // handled
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      {(farmId || farmCropId) && (
        <div className="px-4 pt-3">
          <FarmContextLine farmId={farmId} farmCropId={farmCropId} />
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-4 max-h-[450px]">
        {messages && messages.length > 0 ? messages.map(msg => {
          const isOwn = msg.sender_id === user?.id;
          const isTechnician = msg.sender_type === 'technician';
          return (
            <div key={msg.id} className={`max-w-[85%] ${isOwn ? 'ml-auto' : 'mr-auto'}`}>
              <div className={`p-3 rounded-2xl border ${
                isTechnician
                  ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                  : 'bg-primary/10 border-primary/20'
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  {isTechnician ? <Shield className="w-3 h-3 text-blue-600" /> : <User className="w-3 h-3" />}
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {isTechnician ? 'कृषि प्राविधिक' : 'किसान'}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                </div>
                {msg.message_text && <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>}
                {msg.image_url && (
                  <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                    <img src={msg.image_url} alt="attachment" className="mt-2 rounded-lg max-h-48 object-cover" />
                  </a>
                )}
              </div>
            </div>
          );
        }) : (
          <p className="text-center text-sm text-muted-foreground py-8">कुनै सन्देश छैन।</p>
        )}
      </div>

      {/* Feedback card: show when ticket is answered and farmer hasn't given feedback yet */}
      {senderRole === 'farmer' && ticketStatus === 'answered' && (
        <div className="px-4 pb-2">
          <TicketFeedbackCard
            ticketId={ticketId}
            alreadySubmitted={!!feedbackAt}
            existingScore={satisfactionScore || undefined}
          />
        </div>
      )}

      {/* Call request section for farmer — rich status panel */}
      {senderRole === 'farmer' && technicianId && (
        <>
          {existingCallRequest ? (
            <FarmerCallStatusPanel
              callRequest={existingCallRequest}
              technicianPhone={technicianPhone}
              technicianName={technicianName || undefined}
            />
          ) : (
            <div className="px-4 pb-2">
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setCallDialogOpen(true)}>
                <Phone className="w-3.5 h-3.5 mr-1.5" />
                कृषि विज्ञसँग कुरा गर्नुस्
              </Button>
            </div>
          )}
        </>
      )}

      {/* Call request section for technician — rich action panel */}
      {senderRole === 'technician' && existingCallRequest && !['completed', 'missed'].includes(existingCallRequest.status) && existingCallRequest.status !== 'declined' && (
        <TechnicianCallRequestPanel callRequest={existingCallRequest} updateCallStatus={updateCallStatus} farmerPhone={farmerPhone} />
      )}
      {senderRole === 'technician' && existingCallRequest?.status === 'completed' && (
        <div className="px-4 pb-2">
          <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            Call सम्पन्न भयो
            {existingCallRequest.technician_note && <span> — {existingCallRequest.technician_note}</span>}
          </div>
        </div>
      )}
      {senderRole === 'technician' && existingCallRequest?.status === 'declined' && (
        <div className="px-4 pb-2">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-muted-foreground">
            <XCircle className="w-3.5 h-3.5 inline mr-1 text-destructive" />
            Call अस्वीकार गरिएको छ
            {existingCallRequest.decline_reason && <span> — {DECLINE_REASONS[existingCallRequest.decline_reason] || existingCallRequest.decline_reason}</span>}
          </div>
        </div>
      )}

      {/* Call request consent dialog */}
      <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Call अनुरोध पठाउनुहोस्
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              तपाईंको प्रश्न र फोटो expert सँग share हुनेछ। Call record गरिन सक्छ (quality को लागि)।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">कहिले कुरा गर्ने? (Preferred time)</label>
              <Select value={preferredTime} onValueChange={setPreferredTime}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="समय छान्नुहोस्" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">बिहान (8–11 AM)</SelectItem>
                  <SelectItem value="afternoon">दिउँसो (12–3 PM)</SelectItem>
                  <SelectItem value="evening">बेलुका (4–6 PM)</SelectItem>
                  <SelectItem value="anytime">जुनसुकै बेला</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">छोटो नोट (Optional)</label>
              <Textarea
                placeholder="के कुरा गर्नुपर्छ..."
                value={farmerNote}
                onChange={e => setFarmerNote(e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              📞 Expert उपलब्ध हुँदा तपाईंलाई जानकारी दिइनेछ।
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setCallDialogOpen(false)}>
                रद्द गर्नुहोस्
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={createCallRequest.isPending}
                onClick={() => {
                  createCallRequest.mutate({
                    ticketId,
                    technicianId: technicianId!,
                    preferredTime: preferredTime || undefined,
                    farmerNote: farmerNote.trim() || undefined,
                  }, {
                    onSuccess: () => {
                      setCallDialogOpen(false);
                      setPreferredTime('');
                      setFarmerNote('');
                    },
                  });
                }}
              >
                {createCallRequest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                  <Phone className="w-3.5 h-3.5 mr-1" /> पठाउनुहोस्
                </>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="border-t border-border/40 p-3">
        {/* Recommendation templates start */}
        {senderRole === 'technician' && (
          <div className="mb-2">
            <Button variant="outline" size="sm" onClick={() => setTemplatePickerOpen(true)} className="text-xs">
              <FileText className="w-3.5 h-3.5 mr-1" />
              Template बाट लेख्ने
            </Button>
            <TemplatePicker
              open={templatePickerOpen}
              onOpenChange={setTemplatePickerOpen}
              onSelect={handleTemplateSelect}
              defaultCrop={cropName}
            />
          </div>
        )}
        {/* Recommendation templates end */}
        <div className="flex gap-2">
          <Textarea
            placeholder={senderRole === 'farmer' ? 'थप प्रश्न सोध्नुहोस्...' : 'उत्तर लेख्नुहोस्...'}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            rows={2}
            className="resize-none text-sm flex-1"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <div className="flex flex-col gap-1 self-end">
            <label className="cursor-pointer">
              <div className="w-9 h-9 rounded-md border border-input flex items-center justify-center hover:bg-accent/10 transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4 text-muted-foreground" />}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageSend} disabled={uploading} />
            </label>
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMessage.isPending}
            >
              {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
