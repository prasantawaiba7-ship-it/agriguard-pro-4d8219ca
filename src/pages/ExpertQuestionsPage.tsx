import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useMyExpertTickets, type ExpertTicket } from '@/hooks/useExpertTickets';
import { ExpertTicketChat } from '@/components/expert/ExpertTicketChat';
import { TicketImageGallery } from '@/components/tickets/TicketImageGallery';
import { CallRequestBanner } from '@/components/call/CallRequestBanner';
import { FarmerBottomNav } from '@/components/layout/FarmerBottomNav';
import { ArrowLeft, Plus, MessageCircle, Loader2, Clock, CheckCircle2, Eye, XCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  open: { label: 'Pending', icon: <Clock className="w-3 h-3" />, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  in_progress: { label: 'हेर्दै', icon: <Eye className="w-3 h-3" />, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  answered: { label: 'Expert replied', icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-primary', bg: 'bg-primary/10' },
  closed: { label: 'Closed', icon: <XCircle className="w-3 h-3" />, color: 'text-muted-foreground', bg: 'bg-muted' },
  in_review: { label: 'समीक्षामा', icon: <Clock className="w-3 h-3" />, color: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  assigned: { label: 'तोकिएको', icon: <Eye className="w-3 h-3" />, color: 'text-blue-700', bg: 'bg-blue-100 dark:bg-blue-900/30' },
};

export default function ExpertQuestionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tickets, isLoading } = useMyExpertTickets();
  const [selectedTicket, setSelectedTicket] = useState<ExpertTicket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) { navigate('/auth'); return null; }

  const filteredTickets = tickets?.filter(t =>
    !searchQuery || t.problem_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.crop_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chat view
  if (selectedTicket) {
    return (
      <>
        <Helmet><title>कुराकानी - Kishan Sathi</title></Helmet>
        <div className="min-h-screen bg-background">
          {/* Chat Header */}
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
            <div className="container mx-auto px-4 max-w-2xl">
              <div className="flex items-center gap-3 h-14">
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSelectedTicket(null)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-foreground truncate">{selectedTicket.problem_title}</h2>
                  <p className="text-[11px] text-muted-foreground truncate">
                    👨‍🌾 {selectedTicket.technician?.name || ''} • {selectedTicket.office?.name || ''}
                  </p>
                </div>
                {(() => {
                  const st = STATUS_MAP[selectedTicket.status] || STATUS_MAP.open;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${st.bg} ${st.color}`}>
                      {st.icon} {st.label}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          <main className="pb-28 container mx-auto px-4 max-w-2xl pt-4">
            <TicketImageGallery ticketId={selectedTicket.id} ticketTechnicianId={selectedTicket.technician_id} />
            <CallRequestBanner
              ticketId={selectedTicket.id}
              technicianId={selectedTicket.technician_id}
              technicianPhone={selectedTicket.technician?.phone}
            />
            <Card className="overflow-hidden mt-4 rounded-2xl border-border/40">
              <ExpertTicketChat ticketId={selectedTicket.id} senderRole="farmer" />
            </Card>
          </main>
          <FarmerBottomNav />
        </div>
      </>
    );
  }

  // Ticket List
  return (
    <>
      <Helmet><title>मेरा प्रश्नहरू - Kishan Sathi</title></Helmet>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/farmer')}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-base font-bold text-foreground">📋 मेरा प्रश्नहरू</h1>
              </div>
              <Button size="sm" className="rounded-xl h-9 shadow-sm shadow-primary/20" onClick={() => navigate('/ask-expert')}>
                <Plus className="w-4 h-4 mr-1" /> नयाँ
              </Button>
            </div>
          </div>
        </div>

        <main className="pb-28 container mx-auto px-4 max-w-2xl pt-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="प्रश्न खोज्नुहोस्..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl h-11"
            />
          </div>

          {/* Status summary */}
          {tickets && tickets.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[
                { key: 'all', label: 'सबै', count: tickets.length },
                { key: 'open', label: 'Pending', count: tickets.filter(t => t.status === 'open').length },
                { key: 'answered', label: 'Replied', count: tickets.filter(t => t.status === 'answered').length },
                { key: 'closed', label: 'Closed', count: tickets.filter(t => t.status === 'closed').length },
              ].filter(s => s.count > 0).map(s => (
                <span key={s.key} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground">
                  {s.label} ({s.count})
                </span>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">लोड हुँदैछ...</p>
            </div>
          ) : filteredTickets && filteredTickets.length > 0 ? (
            <div className="space-y-3">
              {filteredTickets.map((ticket, i) => {
                const st = STATUS_MAP[ticket.status] || STATUS_MAP.open;
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card
                      className={`cursor-pointer rounded-2xl border-border/40 transition-all hover:shadow-md active:scale-[0.98] ${
                        ticket.has_unread_farmer ? 'ring-2 ring-primary/30 shadow-md shadow-primary/10' : 'shadow-sm'
                      }`}
                      onClick={async () => {
                        if (ticket.has_unread_farmer) {
                          const { supabase } = await import('@/integrations/supabase/client');
                          await (supabase as any).from('expert_tickets').update({ has_unread_farmer: false }).eq('id', ticket.id);
                        }
                        setSelectedTicket(ticket);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.color}`}>
                                {st.icon} {st.label}
                              </span>
                              {ticket.has_unread_farmer && (
                                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/40" />
                              )}
                            </div>
                            <h3 className="font-bold text-sm text-foreground truncate">{ticket.problem_title}</h3>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              🌾 {ticket.crop_name} • {ticket.technician?.name || ticket.office?.name}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                            <p className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                            </p>
                            <MessageCircle className="w-4 h-4 text-primary/50" />
                          </div>
                        </div>

                        {/* Expert reply preview */}
                        {ticket.status === 'answered' && (
                          <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                            <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3" /> जवाफ आएको छ — हेर्न ट्याप गर्नुहोस्
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="rounded-2xl border-border/40">
              <CardContent className="py-16 text-center">
                <MessageCircle className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium mb-1">अहिलेसम्म कुनै प्रश्न पठाइएको छैन</p>
                <p className="text-xs text-muted-foreground mb-6">कृषि प्राविधिकसँग आफ्नो समस्या सोध्नुहोस्</p>
                <Button onClick={() => navigate('/ask-expert')} className="rounded-xl h-12 text-base">
                  <Plus className="w-5 h-5 mr-1.5" /> कृषि प्राविधिकसँग सोध्नुहोस्
                </Button>
              </CardContent>
            </Card>
          )}
        </main>

        <FarmerBottomNav />
      </div>
    </>
  );
}
