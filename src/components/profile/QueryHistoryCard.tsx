import { useState, useEffect } from 'react';
import { MessageSquare, Clock, Loader2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ChatMessage {
  id: string;
  content: string;
  role: string;
  created_at: string;
  session_id: string;
  message_type: string | null;
}

interface ChatSession {
  session_id: string;
  first_message: string;
  message_count: number;
  last_activity: string;
}

export const QueryHistoryCard = () => {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const isNepali = language === 'ne';

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!profile?.id) return;

      try {
        const { data, error } = await supabase
          .from('ai_chat_history')
          .select('*')
          .eq('farmer_id', profile.id)
          .eq('role', 'user')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by session_id
        const sessionMap = new Map<string, ChatMessage[]>();
        (data || []).forEach((msg: ChatMessage) => {
          const existing = sessionMap.get(msg.session_id) || [];
          existing.push(msg);
          sessionMap.set(msg.session_id, existing);
        });

        // Create session summaries
        const sessionList: ChatSession[] = [];
        sessionMap.forEach((messages, session_id) => {
          const sorted = messages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          sessionList.push({
            session_id,
            first_message: sorted[0]?.content || '',
            message_count: messages.length,
            last_activity: sorted[sorted.length - 1]?.created_at || ''
          });
        });

        // Sort by last activity
        sessionList.sort((a, b) => 
          new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
        );

        setSessions(sessionList.slice(0, 10));
      } catch (error) {
        console.error('Error fetching chat history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, [profile?.id]);

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {isNepali ? 'प्रश्न इतिहास' : 'Query History'}
          </CardTitle>
          <Badge variant="secondary">
            {sessions.length} {isNepali ? 'सत्रहरू' : 'sessions'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{isNepali ? 'अहिलेसम्म कुनै प्रश्न छैन' : 'No queries yet'}</p>
            <Button
              variant="link"
              onClick={() => navigate('/krishi-mitra')}
              className="mt-2"
            >
              {isNepali ? 'कृषि मित्रसँग कुरा गर्नुहोस्' : 'Start chatting with Krishi Mitra'}
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => navigate('/krishi-mitra')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {truncateMessage(session.first_message)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true })}
                        </span>
                        <span>•</span>
                        <span>
                          {session.message_count} {isNepali ? 'प्रश्न' : 'queries'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
