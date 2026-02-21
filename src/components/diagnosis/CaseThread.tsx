import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Shield, Loader2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCaseMessages, useSendCaseMessage, type CaseMessage } from '@/hooks/useCaseMessages';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface CaseThreadProps {
  caseId: string;
  senderRole?: 'farmer' | 'expert';
  showInternalNotes?: boolean;
}

const SENDER_STYLES: Record<string, { bg: string; align: string; icon: React.ReactNode; label: string }> = {
  farmer: { bg: 'bg-primary/10 border-primary/20', align: 'ml-auto', icon: <User className="w-3 h-3" />, label: 'किसान' },
  expert: { bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', align: 'mr-auto', icon: <Shield className="w-3 h-3 text-blue-600" />, label: 'कृषि विज्ञ' },
  system: { bg: 'bg-muted/50 border-border/30', align: 'mx-auto', icon: <Bot className="w-3 h-3" />, label: 'System' },
  ai: { bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800', align: 'mr-auto', icon: <Bot className="w-3 h-3 text-amber-600" />, label: 'AI' },
};

function MessageBubble({ msg, isOwn, showInternal }: { msg: CaseMessage; isOwn: boolean; showInternal?: boolean }) {
  const style = SENDER_STYLES[msg.sender_type] || SENDER_STYLES.system;

  if (msg.is_internal_note && !showInternal) return null;

  return (
    <div className={`max-w-[85%] ${isOwn ? 'ml-auto' : 'mr-auto'}`}>
      <div className={`p-3 rounded-2xl border ${style.bg} ${msg.is_internal_note ? 'border-dashed border-yellow-400' : ''}`}>
        <div className="flex items-center gap-1.5 mb-1">
          {style.icon}
          <span className="text-[10px] font-medium text-muted-foreground">
            {msg.is_internal_note ? '🔒 Internal Note' : style.label}
          </span>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
        {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
          <div className="flex gap-2 mt-2">
            {(msg.attachments as any[]).map((att, i) => (
              <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline flex items-center gap-1">
                <Paperclip className="w-3 h-3" /> {att.type || 'file'}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CaseThread({ caseId, senderRole = 'farmer', showInternalNotes = false }: CaseThreadProps) {
  const { user } = useAuth();
  const { data: messages, isLoading } = useCaseMessages(caseId);
  const sendMessage = useSendCaseMessage();
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage.mutate({
      caseId,
      message: newMessage.trim(),
      senderType: senderRole,
      isInternalNote: senderRole === 'expert' ? isInternalNote : false,
    });
    setNewMessage('');
    setIsInternalNote(false);
  };

  if (isLoading) {
    return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-3 max-h-[400px]">
        {messages && messages.length > 0 ? (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={msg.sender_id === user?.id}
              showInternal={showInternalNotes}
            />
          ))
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">
            कुनै सन्देश छैन। पहिलो सन्देश पठाउनुहोस्।
          </p>
        )}
      </div>

      {/* Reply Box */}
      <div className="border-t border-border/40 p-3 space-y-2">
        {senderRole === 'expert' && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={isInternalNote}
              onChange={e => setIsInternalNote(e.target.checked)}
              className="rounded"
            />
            🔒 Internal note (किसानले देख्दैन)
          </label>
        )}
        <div className="flex gap-2">
          <Textarea
            placeholder={senderRole === 'farmer' ? 'थप प्रश्न सोध्नुहोस्...' : 'उत्तर लेख्नुहोस्...'}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            rows={2}
            className="resize-none text-sm flex-1"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessage.isPending}
            className="self-end"
          >
            {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
