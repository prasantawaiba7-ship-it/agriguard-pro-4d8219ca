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
import { ArrowLeft, Loader2, CheckCircle2, Eye, XCircle, MessageCircle, Shield, ShieldCheck, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_FILTERS = [
  { value: 'all', label: 'सबै' },
  { value: 'assigned', label: 'तोकिएको' },
  { value: 'in_progress', label: 'हेर्दै' },
  { value: 'answered', label: 'जवाफ दिइयो' },
];

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  open: { label: 'नयाँ', icon: <ShieldCheck className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  assigned: { label: 'तोकिएको', icon: <ShieldCheck className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  in_progress: { label: 'हेर्दै', icon: <Eye className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  answered: { label: 'जवाफ दिइयो', icon: <CheckCircle2 className="w-3 h-3" />, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
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

  // Guard: loading state
  if (techLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Guard: only experts can access
  if (!currentTech?.is_expert) {
    return (
      <>
        <Helmet><title>Access Denied - Kishan Sathi</title></Helmet>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-20 pb-28 container mx-auto px-4 max-w-2xl">
            <div className="text-center py-16">
              <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">पहुँच अस्वीकृत</h2>
              <p className="text-muted-foreground mb-4">तपाईंलाई कृषि विज्ञको रूपमा तोकिएको छैन।</p>
              <p className="text-sm text-muted-foreground mb-6">कृपया प्रशासकसँग सम्पर्क गर्नुहोस्।</p>
              <Button onClick={() => navigate('/farmer')}>Dashboard मा जानुहोस्</Button>
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
          <main className="pt-20 pb-28 container mx-auto px-4 max-w-2xl">
            <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" /> पछाडि
            </Button>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">{selectedTicket.problem_title}</h2>
              <p className="text-sm text-muted-foreground">🌾 {selectedTicket.crop_name} • किसान</p>
            </div>
            {/* Multi-photo ticket images start */}
            <TicketImageGallery ticketId={selectedTicket.id} ticketTechnicianId={selectedTicket.technician_id} />
            {/* Multi-photo ticket images end */}
            <Card className="overflow-hidden mt-4">
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
        <main className="pt-20 pb-28 container mx-auto px-4 max-w-3xl">
          <Button variant="ghost" size="sm" onClick={() => navigate('/farmer')} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
          <h1 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            कृषि विज्ञ Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mb-4">तपाईंलाई पठाइएका टिकटहरू यहाँ देखिन्छन्।</p>

          <Tabs defaultValue="tickets" className="mb-6">
            <TabsList>
              <TabsTrigger value="tickets">टिकटहरू</TabsTrigger>
              <TabsTrigger value="calls" className="gap-1">
                <Phone className="w-3.5 h-3.5" /> Call Requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calls" className="mt-4">
              <CallRequestsPanel technicianId={currentTech!.id} />
            </TabsContent>

            <TabsContent value="tickets" className="mt-4">

          {/* Filters */}
          <div className="flex gap-2 flex-wrap mb-6">
            {STATUS_FILTERS.map(f => (
              <Button
                key={f.value}
                variant={statusFilter === f.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {ticketsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
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
                      className={`cursor-pointer hover:shadow-md transition-all ${ticket.has_unread_technician ? 'ring-2 ring-primary/30 bg-primary/5' : ''}`}
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
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${st.color}`}>
                                {st.icon} {st.label}
                              </span>
                              {ticket.has_unread_technician && (
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              )}
                            </div>
                            <h3 className="font-semibold text-sm text-foreground truncate">{ticket.problem_title}</h3>
                            <p className="text-xs text-muted-foreground">🌾 {ticket.crop_name} • {ticket.office?.name}</p>
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
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">कुनै तोकिएको टिकट छैन।</p>
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
