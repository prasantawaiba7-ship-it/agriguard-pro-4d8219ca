import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ImagePlus, User, Shield, FileText, Mic, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useExpertTicketMessages, useSendExpertTicketMessage, uploadExpertImage } from '@/hooks/useExpertTickets';
import { useTicketMedia, uploadTicketMedia } from '@/hooks/useTicketMedia';
import { formatDistanceToNow } from 'date-fns';
import { TemplatePicker } from './TemplatePicker';
import { AudioRecorder } from '@/components/media/AudioRecorder';
import { MediaAttachmentCard } from '@/components/media/MediaAttachmentCard';
import { useToast } from '@/hooks/use-toast';

interface ExpertTicketChatProps {
  ticketId: string;
  cropName?: string;
  senderRole?: 'farmer' | 'technician';
}

export function ExpertTicketChat({ ticketId, cropName, senderRole = 'farmer' }: ExpertTicketChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: messages, isLoading } = useExpertTicketMessages(ticketId);
  const { data: mediaAttachments } = useTicketMedia(ticketId);
  const sendMessage = useSendExpertTicketMessage();
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Recommendation templates start
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const handleTemplateSelect = (resolved: { title: string; body: string }) => {
    setNewMessage(prev => {
      const prefix = prev.trim() ? prev.trim() + '\n\n' : '';
      return prefix + resolved.title + '\n\n' + resolved.body;
    });
  };
  // Recommendation templates end

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Group media by message_id for rendering
  const mediaByMessage = (mediaAttachments || []).reduce<Record<string, typeof mediaAttachments>>((acc, att) => {
    if (!att) return acc;
    const key = att.message_id;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(att);
    return acc;
  }, {});

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

  // Voice note recording handler
  const handleVoiceRecorded = async (blob: Blob, durationSeconds: number) => {
    if (!user) return;
    setUploadingMedia(true);
    try {
      // First create a message row
      const { data: msgData, error: msgErr } = await (await import('@/integrations/supabase/client')).supabase
        .from('expert_ticket_messages' as any)
        .insert({
          ticket_id: ticketId,
          sender_type: senderRole,
          sender_id: user.id,
          message_text: '🎤 भ्वाइस नोट',
        })
        .select()
        .single();
      if (msgErr) throw msgErr;
      const messageId = (msgData as any).id;

      // Upload media
      await uploadTicketMedia(ticketId, messageId, blob, 'audio', user.id, senderRole, durationSeconds);

      // Update ticket unread flags
      const updates: any = {};
      if (senderRole === 'technician') {
        updates.has_unread_farmer = true;
        updates.status = 'answered';
      } else {
        updates.has_unread_technician = true;
      }
      await (await import('@/integrations/supabase/client')).supabase
        .from('expert_tickets' as any)
        .update(updates)
        .eq('id', ticketId);

      // Refresh queries
      const { useQueryClient } = await import('@tanstack/react-query');

      setShowRecorder(false);
      toast({ title: '✅ भ्वाइस नोट पठाइयो' });
      // Force refetch
      window.dispatchEvent(new Event('voice-sent'));
    } catch (err) {
      console.error('Voice upload error:', err);
      toast({ title: 'भ्वाइस नोट पठाउन सकिएन', variant: 'destructive' });
    } finally {
      setUploadingMedia(false);
    }
  };

  // Video upload handler
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    // Enforce 5MB limit
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'भिडियो १०MB भन्दा सानो हुनुपर्छ', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    setUploadingMedia(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: msgData, error: msgErr } = await (supabase as any)
        .from('expert_ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: senderRole,
          sender_id: user.id,
          message_text: '📹 छोटो भिडियो',
        })
        .select()
        .single();
      if (msgErr) throw msgErr;
      const messageId = (msgData as any).id;

      await uploadTicketMedia(ticketId, messageId, file, 'video', user.id, senderRole);

      const updates: any = {};
      if (senderRole === 'technician') {
        updates.has_unread_farmer = true;
        updates.status = 'answered';
      } else {
        updates.has_unread_technician = true;
      }
      await (supabase as any).from('expert_tickets').update(updates).eq('id', ticketId);

      toast({ title: '✅ भिडियो पठाइयो' });
    } catch (err) {
      console.error('Video upload error:', err);
      toast({ title: 'भिडियो पठाउन सकिएन', variant: 'destructive' });
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-4 max-h-[450px]">
        {messages && messages.length > 0 ? messages.map(msg => {
          const isOwn = msg.sender_id === user?.id;
          const isTechnician = msg.sender_type === 'technician';
          const msgMedia = mediaByMessage[msg.id] || [];
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
                {/* Media attachments (audio/video) */}
                {msgMedia.map((att: any) => (
                  <MediaAttachmentCard
                    key={att.id}
                    type={att.type}
                    fileUrl={att.file_url}
                    durationSeconds={att.duration_seconds}
                  />
                ))}
              </div>
            </div>
          );
        }) : (
          <p className="text-center text-sm text-muted-foreground py-8">कुनै सन्देश छैन।</p>
        )}
      </div>

      <div className="border-t border-border/40 p-3">
        {/* Voice recorder UI */}
        {showRecorder && (
          <div className="mb-2">
            <AudioRecorder
              maxDuration={60}
              onRecorded={handleVoiceRecorded}
              onCancel={() => setShowRecorder(false)}
              disabled={uploadingMedia}
            />
          </div>
        )}

        {uploadingMedia && (
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> अपलोड हुँदैछ...
          </div>
        )}

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
            {/* Voice note button */}
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => setShowRecorder(!showRecorder)}
              disabled={uploadingMedia}
              title="भ्वाइस नोट"
            >
              <Mic className="w-4 h-4 text-muted-foreground" />
            </Button>
            {/* Video upload */}
            <label className="cursor-pointer" title="छोटो भिडियो">
              <div className="w-9 h-9 rounded-md border border-input flex items-center justify-center hover:bg-accent/10 transition-colors">
                {uploadingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4 text-muted-foreground" />}
              </div>
              <input type="file" accept="video/*" capture="environment" className="hidden" onChange={handleVideoUpload} disabled={uploadingMedia} />
            </label>
            {/* Image upload */}
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
