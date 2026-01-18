import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MessageSquare, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatSession {
  session_id: string;
  first_message: string;
  message_count: number;
  created_at: string;
  last_message_at: string;
}

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmerId: string;
  language: 'ne' | 'hi' | 'en';
  onLoadSession: (messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date; imageUrl?: string }>) => void;
}

export function ChatHistoryModal({ isOpen, onClose, farmerId, language, onLoadSession }: ChatHistoryModalProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && farmerId) {
      loadSessions();
    }
  }, [isOpen, farmerId]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      // Get distinct sessions with their first message and count
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('session_id, content, created_at, role')
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by session
      const sessionMap = new Map<string, ChatSession>();
      
      data?.forEach(msg => {
        if (!sessionMap.has(msg.session_id)) {
          sessionMap.set(msg.session_id, {
            session_id: msg.session_id,
            first_message: msg.role === 'user' ? msg.content.slice(0, 100) : '',
            message_count: 1,
            created_at: msg.created_at,
            last_message_at: msg.created_at
          });
        } else {
          const session = sessionMap.get(msg.session_id)!;
          session.message_count++;
          // Update first message if this is a user message and we don't have one yet
          if (msg.role === 'user' && !session.first_message) {
            session.first_message = msg.content.slice(0, 100);
          }
          // Track earliest and latest
          if (msg.created_at < session.created_at) {
            session.created_at = msg.created_at;
          }
          if (msg.created_at > session.last_message_at) {
            session.last_message_at = msg.created_at;
          }
        }
      });

      // Convert to array and sort by most recent
      const sessionsArray = Array.from(sessionMap.values())
        .filter(s => s.first_message) // Only show sessions with user messages
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      setSessions(sessionsArray);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messages = data?.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        imageUrl: msg.image_url || undefined
      })) || [];

      onLoadSession(messages);
      onClose();
    } catch (error) {
      console.error('Failed to load session messages:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) {
      return language === 'ne' ? 'आज' : language === 'hi' ? 'आज' : 'Today';
    }
    if (isYesterday(date)) {
      return language === 'ne' ? 'हिजो' : language === 'hi' ? 'कल' : 'Yesterday';
    }
    return format(date, 'MMM d, yyyy');
  };

  const formatTime = (dateStr: string) => {
    return format(parseISO(dateStr), 'h:mm a');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-background rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden border border-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg">
                  {language === 'ne' ? 'कुराकानी इतिहास' : language === 'hi' ? 'बातचीत इतिहास' : 'Chat History'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {language === 'ne' ? 'पुरानो कुराकानी हेर्नुहोस्' : language === 'hi' ? 'पुरानी बातचीत देखें' : 'View previous conversations'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh] p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {language === 'ne' ? 'कुनै कुराकानी इतिहास छैन' : language === 'hi' ? 'कोई बातचीत इतिहास नहीं' : 'No chat history yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session, idx) => (
                  <motion.button
                    key={session.session_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => loadSessionMessages(session.session_id)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border border-border",
                      "hover:border-primary/50 hover:bg-primary/5 transition-all",
                      "active:scale-[0.98]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate mb-1">
                          {session.first_message || (language === 'ne' ? 'कुराकानी' : 'Conversation')}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(session.last_message_at)} {formatTime(session.last_message_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {session.message_count}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {sessions.length > 0 && (
            <div className="p-3 border-t border-border bg-muted/30">
              <p className="text-xs text-center text-muted-foreground">
                {language === 'ne' 
                  ? `${sessions.length} कुराकानी सत्रहरू` 
                  : language === 'hi' 
                  ? `${sessions.length} बातचीत सत्र` 
                  : `${sessions.length} conversation sessions`}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
