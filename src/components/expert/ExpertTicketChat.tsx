import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ImagePlus, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useExpertTicketMessages, useSendExpertTicketMessage, uploadExpertImage } from '@/hooks/useExpertTickets';
import { formatDistanceToNow } from 'date-fns';

interface ExpertTicketChatProps {
  ticketId: string;
  senderRole?: 'farmer' | 'technician';
}

export function ExpertTicketChat({ ticketId, senderRole = 'farmer' }: ExpertTicketChatProps) {
  const { user } = useAuth();
  const { data: messages, isLoading } = useExpertTicketMessages(ticketId);
  const sendMessage = useSendExpertTicketMessage();
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

      <div className="border-t border-border/40 p-3">
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
