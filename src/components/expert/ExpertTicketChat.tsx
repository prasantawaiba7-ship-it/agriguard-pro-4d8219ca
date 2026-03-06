import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ImagePlus, User, Shield, FileText, Phone, Clock, CheckCircle2, XCircle } from 'lucide-react';
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
}

export function ExpertTicketChat({ ticketId, cropName, senderRole = 'farmer', farmId, farmCropId, ticketStatus, satisfactionScore, feedbackAt, technicianId }: ExpertTicketChatProps) {
  const { user } = useAuth();
  const { data: messages, isLoading } = useExpertTicketMessages(ticketId);
  const sendMessage = useSendExpertTicketMessage();
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
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

      {/* Call request section for farmer */}
      {senderRole === 'farmer' && technicianId && (
        <div className="px-4 pb-2">
          {existingCallRequest ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-2.5 text-xs">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1">
                <span className="font-medium">Call अनुरोध:</span>{' '}
                {existingCallRequest.status === 'requested' && <span className="text-amber-600">प्रतीक्षामा <Clock className="w-3 h-3 inline" /></span>}
                {existingCallRequest.status === 'accepted' && <span className="text-green-600">स्वीकृत <CheckCircle2 className="w-3 h-3 inline" /></span>}
                {existingCallRequest.status === 'completed' && <span className="text-muted-foreground">सकियो <CheckCircle2 className="w-3 h-3 inline" /></span>}
                {existingCallRequest.status === 'missed' && <span className="text-destructive">छुटेको <XCircle className="w-3 h-3 inline" /></span>}
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setCallDialogOpen(true)}>
              <Phone className="w-3.5 h-3.5 mr-1.5" />
              कृषि विज्ञसँग कुरा गर्नुस्
            </Button>
          )}
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
