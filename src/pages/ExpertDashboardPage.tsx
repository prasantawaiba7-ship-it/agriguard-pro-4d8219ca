import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentTechnician } from '@/hooks/useCurrentTechnician';
import { useExpertAssignedTickets, type ExpertTicket } from '@/hooks/useExpertTickets';
import { ExpertTicketChat } from '@/components/expert/ExpertTicketChat';
import { TicketImageGallery } from '@/components/tickets/TicketImageGallery';
import { CallRequestsPanel } from '@/components/call/CallRequestsPanel';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, CheckCircle2, Eye, XCircle, MessageCircle, Shield, ShieldCheck, Phone, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_FILTERS = [
  { value: 'all', label: 'सबै' },
  { value: 'assigned', label: 'तोकिएको' },
  { value: 'in_progress', label: 'हेर्दै' },
  { value: 'answered', label: 'जवाफ दिइयो' },
];

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  open: { label: 'नयाँ', icon: <ShieldCheck className="w-3 h-3" />, color: 'bg-[hsl(var(--card-weather-bg))] text-[hsl(var(--card-weather-icon))]' },
  assigned: { label: 'तोकिएको', icon: <ShieldCheck className="w-3 h-3" />, color: 'bg-[hsl(var(--card-weather-bg))] text-[hsl(var(--card-weather-icon))]' },
  in_progress: { label: 'हेर्दै', icon: <Eye className="w-3 h-3" />, color: 'bg-[hsl(var(--card-ai-bg))] text-[hsl(var(--card-ai-icon))]' },
  answered: { label: 'जवाफ दिइयो', icon: <CheckCircle2 className="w-3 h-3" />, color: 'bg-[hsl(var(--card-market-bg))] text-[hsl(var(--card-market-icon))]' },
  closed: { label: 'बन्द', icon: <XCircle className="w-3 h-3" />, color: 'bg-muted text-muted-foreground' },
};

export default function ExpertDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: currentTech, isLoading: techLoading } = useCurrentTechnician();
  const { data: tickets, isLoading: ticketsLoading } = useExpertAssignedTickets(currentTech?.id, currentTech?.is_expert);
  const [selectedTicket, setSelectedTicket] = useState<ExpertTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  if (!user) { navigate('/auth'); return null; }

  if (techLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentTech?.is_expert) {
    return (
      <>
        <Helmet><title>Access Denied - Kishan Sathi</title></Helmet>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-20 pb-28 container mx-auto px-4 max-w-2xl">
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
                <Shield className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">पहुँच अस्वीकृत</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">तपाईंलाई कृषि विज्ञको रूपमा तोकिएको छैन। कृपया प्रशासकसँग सम्पर्क गर्नुहोस्।</p>
              <Button onClick={() => navigate('/farmer')} className="rounded-full px-8">Dashboard मा जानुहोस्</Button>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  const filtered = tickets?.filter(t => statusFilter === 'all' || t.status === statusFilter) || [];

  if (selectedTicket) {
    return (
      <>
        <Helmet><title>टिकट जवाफ - Kishan Sathi</title></Helmet>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-20 pb-28 container mx-auto px-4 max-w-3xl">
            <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="mb-4 rounded-full">
              <ArrowLeft className="w-4 h-4 mr-1" /> पछाडि
            </Button>
            <div className="mb-5 bg-card rounded-2xl border border-border/40 p-5">
              <h2 className="text-lg font-bold text-foreground">{selectedTicket.problem_title}</h2>
              <p className="text-sm text-muted-foreground mt-1">🌾 {selectedTicket.crop_name} • किसान</p>
            </div>
            <TicketImageGallery ticketId={selectedTicket.id} ticketTechnicianId={selectedTicket.technician_id} />
            <Card className="overflow-hidden mt-4 rounded-2xl">
              <ExpertTicketChat ticketId={selectedTicket.id} cropName={selectedTicket.crop_name} senderRole="technician" />
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>कृषि विज्ञ Dashboard - Kishan Sathi</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-28 container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button variant="ghost" size="sm" onClick={() => navigate('/farmer')} className="mb-3 rounded-full">
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
            <div className="bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.03] rounded-3xl p-6 sm:p-8 border border-border/40">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                    कृषि विज्ञ Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground">तपाईंलाई पठाइएका टिकटहरू यहाँ देखिन्छन्।</p>
                </div>
              </div>
            </div>
          </motion.div>

          <Tabs defaultValue="tickets" className="mb-6">
            <TabsList className="rounded-2xl p-1.5 bg-muted/50">
              <TabsTrigger value="tickets" className="rounded-xl">टिकटहरू</TabsTrigger>
              <TabsTrigger value="calls" className="gap-1.5 rounded-xl">
                <Phone className="w-3.5 h-3.5" /> Call Requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calls" className="mt-5">
              <CallRequestsPanel technicianId={currentTech!.id} />
            </TabsContent>

            <TabsContent value="tickets" className="mt-5">
              {/* Filters */}
              <div className="flex gap-2 flex-wrap mb-6">
                {STATUS_FILTERS.map(f => (
                  <Button
                    key={f.value}
                    variant={statusFilter === f.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(f.value)}
                    className="rounded-full"
                  >
                    {f.label}
                  </Button>
                ))}
              </div>

              {ticketsLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : filtered.length > 0 ? (
                <div className="space-y-3">
                  {filtered.map((ticket, i) => {
                    const st = STATUS_MAP[ticket.status] || STATUS_MAP.assigned;
                    return (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card
                          className={`cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-2xl ${ticket.has_unread_technician ? 'ring-2 ring-primary/30 bg-primary/5' : 'border-border/40'}`}
                          onClick={async () => {
                            if (ticket.has_unread_technician || ticket.status === 'assigned') {
                              await (supabase as any).from('expert_tickets').update({
                                has_unread_technician: false,
                                status: ticket.status === 'assigned' ? 'in_progress' : ticket.status,
                              }).eq('id', ticket.id);
                            }
                            setSelectedTicket(ticket);
                          }}
                        >
                          <CardContent className="p-5">
                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.color}`}>
                                    {st.icon} {st.label}
                                  </span>
                                  {ticket.has_unread_technician && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                                  )}
                                </div>
                                <h3 className="font-bold text-sm text-foreground truncate">{ticket.problem_title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">🌾 {ticket.crop_name} • {ticket.office?.name}</p>
                              </div>
                              <p className="text-[10px] text-muted-foreground flex-shrink-0">
                                {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <Card className="rounded-2xl">
                  <CardContent className="py-16 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
                      <MessageCircle className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">कुनै तोकिएको टिकट छैन।</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
      </div>
    </>
  );
}
