import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useMyExpertTickets, type ExpertTicket } from '@/hooks/useExpertTickets';
import { ExpertTicketChat } from '@/components/expert/ExpertTicketChat';
import { ArrowLeft, Plus, MessageCircle, Loader2, Clock, CheckCircle2, Eye, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  in_review: { label: 'समीक्षामा', icon: <Clock className="w-3 h-3" />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  assigned: { label: 'तोकिएको', icon: <Eye className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  open: { label: 'नयाँ', icon: <Clock className="w-3 h-3" />, color: 'bg-warning/10 text-warning' },
  in_progress: { label: 'हेर्दै', icon: <Eye className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  answered: { label: 'जवाफ आयो', icon: <CheckCircle2 className="w-3 h-3" />, color: 'bg-primary/10 text-primary' },
  closed: { label: 'बन्द', icon: <XCircle className="w-3 h-3" />, color: 'bg-muted text-muted-foreground' },
};

export default function ExpertQuestionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tickets, isLoading } = useMyExpertTickets();
  const [selectedTicket, setSelectedTicket] = useState<ExpertTicket | null>(null);

  if (!user) { navigate('/auth'); return null; }

  if (selectedTicket) {
    return (
      <>
        <Helmet><title>कुराकानी - Kishan Sathi</title></Helmet>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-20 pb-28 container mx-auto px-4 max-w-2xl">
            <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" /> पछाडि
            </Button>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">{selectedTicket.problem_title}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedTicket.technician?.name || ''} • {selectedTicket.office?.name || ''}
                </p>
            </div>
            <Card className="overflow-hidden">
              <ExpertTicketChat ticketId={selectedTicket.id} senderRole="farmer" />
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>मेरा प्रश्नहरू - Kishan Sathi</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-28 container mx-auto px-4 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/farmer')} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
              </Button>
              <h1 className="text-xl font-bold text-foreground">📋 मेरा प्रश्नहरू</h1>
            </div>
            <Button size="sm" onClick={() => navigate('/ask-expert')}>
              <Plus className="w-4 h-4 mr-1" /> नयाँ प्रश्न
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : tickets && tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map((ticket, i) => {
                const st = STATUS_MAP[ticket.status] || STATUS_MAP.open;
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className={`cursor-pointer hover:shadow-md transition-all ${ticket.has_unread_farmer ? 'ring-2 ring-primary/30' : ''}`}
                      onClick={async () => {
                        // Mark as read
                        if (ticket.has_unread_farmer) {
                          const { supabase } = await import('@/integrations/supabase/client');
                          await (supabase as any).from('expert_tickets').update({ has_unread_farmer: false }).eq('id', ticket.id);
                        }
                        setSelectedTicket(ticket);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${st.color}`}>
                                {st.icon} {st.label}
                              </span>
                              {ticket.has_unread_farmer && (
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              )}
                            </div>
                            <h3 className="font-semibold text-sm text-foreground truncate">{ticket.problem_title}</h3>
                            <p className="text-xs text-muted-foreground truncate">
                              🌾 {ticket.crop_name} • {ticket.technician?.name || ticket.office?.name}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                            </p>
                            <MessageCircle className="w-4 h-4 text-muted-foreground ml-auto mt-1" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">अहिलेसम्म कुनै प्रश्न पठाइएको छैन।</p>
                <Button onClick={() => navigate('/ask-expert')}>
                  <Plus className="w-4 h-4 mr-1" /> कृषि प्राविधिकसँग सोध्नुहोस्
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
}
