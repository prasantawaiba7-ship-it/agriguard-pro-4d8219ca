// =============================================
// Admin view: all expert tickets (read + optional reassign)
// =============================================

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, UserPlus, MessageCircle, Clock, Eye, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ExpertTicketChat } from '@/components/expert/ExpertTicketChat';

interface AdminExpertTicket {
  id: string;
  farmer_id: string;
  office_id: string;
  technician_id: string | null;
  crop_name: string;
  problem_title: string;
  problem_description: string;
  status: string;
  has_unread_farmer: boolean;
  has_unread_technician: boolean;
  created_at: string;
  updated_at: string;
  technician?: { id: string; name: string; role_title: string } | null;
  office?: { id: string; name: string; district: string } | null;
}

interface TechnicianOption {
  id: string;
  name: string;
  role_title: string;
  specialization: string | null;
  is_active: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'नयाँ (Open)', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'हेर्दै', color: 'bg-yellow-100 text-yellow-700' },
  answered: { label: 'जवाफ दिइयो', color: 'bg-green-100 text-green-700' },
  closed: { label: 'बन्द', color: 'bg-muted text-muted-foreground' },
};

// ── Admin ticket overview start ──

export function ExpertTicketsManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [assigningTicketId, setAssigningTicketId] = useState<string | null>(null);
  const [selectedTicketForChat, setSelectedTicketForChat] = useState<AdminExpertTicket | null>(null);

  // Fetch all expert tickets (admin view)
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['admin-expert-tickets', filterStatus],
    queryFn: async () => {
      let q = (supabase as any)
        .from('expert_tickets')
        .select('*, technician:technicians(id, name, role_title), office:ag_offices(id, name, district)')
        .order('updated_at', { ascending: false });
      if (filterStatus !== 'all') q = q.eq('status', filterStatus);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return (data || []) as AdminExpertTicket[];
    },
  });

  // Fetch technicians for the office of the ticket being assigned
  const assigningTicket = tickets?.find(t => t.id === assigningTicketId);
  const { data: techsForOffice, isLoading: techsLoading } = useQuery({
    queryKey: ['technicians-for-office', assigningTicket?.office_id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('technicians')
        .select('id, name, role_title, specialization, is_active')
        .eq('office_id', assigningTicket!.office_id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as TechnicianOption[];
    },
    enabled: !!assigningTicket?.office_id,
  });

  // Realtime for expert_tickets
  useEffect(() => {
    const channel = supabase
      .channel('admin-expert-tickets-rt')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'expert_tickets',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-expert-tickets'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const handleAssign = async (ticketId: string, technicianId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('expert_tickets')
        .update({
          technician_id: technicianId,
          has_unread_technician: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);
      if (error) throw error;
      toast.success('प्राविधिक तोकियो ✅');
      setAssigningTicketId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-expert-tickets'] });
    } catch {
      toast.error('Assign गर्न सकिएन');
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await (supabase as any)
        .from('expert_tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId);
      queryClient.invalidateQueries({ queryKey: ['admin-expert-tickets'] });
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = tickets?.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.problem_title.toLowerCase().includes(s) ||
      t.crop_name.toLowerCase().includes(s) ||
      t.office?.name?.toLowerCase().includes(s) ||
      t.technician?.name?.toLowerCase().includes(s) ||
      t.id.toLowerCase().includes(s)
    );
  }) || [];

  const stats = {
    total: tickets?.length || 0,
    unassigned: tickets?.filter(t => !t.technician_id && t.status !== 'closed').length || 0,
    open: tickets?.filter(t => t.status === 'open').length || 0,
    answered: tickets?.filter(t => t.status === 'answered').length || 0,
  };

  // Chat view for a specific ticket
  if (selectedTicketForChat) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedTicketForChat(null)}>
          ← Back to Ticket List
        </Button>
        <div className="mb-2">
          <h3 className="text-lg font-bold">{selectedTicketForChat.problem_title}</h3>
          <p className="text-sm text-muted-foreground">
            🌾 {selectedTicketForChat.crop_name} • {selectedTicketForChat.office?.name} •
            प्राविधिक: {selectedTicketForChat.technician?.name || 'Unassigned'}
          </p>
        </div>
        <Card className="overflow-hidden">
          <ExpertTicketChat ticketId={selectedTicketForChat.id} senderRole="technician" />
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              विज्ञ टिकट (Expert Tickets)
              {stats.unassigned > 0 && (
                <Badge className="bg-destructive text-destructive-foreground ml-2 animate-pulse">
                  Unassigned ({stats.unassigned})
                </Badge>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-expert-tickets'] })}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'कुल', value: stats.total },
              { label: 'Unassigned', value: stats.unassigned, highlight: stats.unassigned > 0 },
              { label: 'Open', value: stats.open },
              { label: 'Answered', value: stats.answered },
            ].map(s => (
              <div key={s.label} className={`p-3 rounded-lg text-center ${s.highlight ? 'bg-destructive/10 ring-1 ring-destructive/30' : 'bg-muted/50'}`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search crop, title, office..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="answered">Answered</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">कुनै टिकट छैन</div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]"></TableHead>
                  <TableHead>बाली</TableHead>
                  <TableHead>शीर्षक</TableHead>
                  <TableHead>कार्यालय</TableHead>
                  <TableHead>प्राविधिक</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>मिति</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(ticket => {
                  const st = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                  const isUnassigned = !ticket.technician_id;
                  return (
                    <TableRow
                      key={ticket.id}
                      className={`${isUnassigned ? 'bg-amber-50 dark:bg-amber-900/10' : ''} cursor-pointer hover:bg-accent/50`}
                      onClick={() => setSelectedTicketForChat(ticket)}
                    >
                      <TableCell className="pr-0">
                        {isUnassigned && <span className="block h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />}
                      </TableCell>
                      <TableCell className="font-medium">{ticket.crop_name}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{ticket.problem_title}</TableCell>
                      <TableCell className="text-sm">{ticket.office?.name || '—'}</TableCell>
                      <TableCell>
                        {ticket.technician?.name ? (
                          <span className="text-sm">{ticket.technician.name}</span>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${st.color}`}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={(e) => { e.stopPropagation(); setAssigningTicketId(ticket.id); }}
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            {ticket.technician_id ? 'Reassign' : 'Assign'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Assignment Dialog */}
      <Dialog open={!!assigningTicketId} onOpenChange={(open) => !open && setAssigningTicketId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              प्राविधिक तोक्नुहोस् (Assign Technician)
            </DialogTitle>
          </DialogHeader>
          {assigningTicket && (
            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">{assigningTicket.problem_title}</p>
                <p className="text-xs text-muted-foreground">🌾 {assigningTicket.crop_name} • {assigningTicket.office?.name}</p>
              </div>

              {techsLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : techsForOffice && techsForOffice.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {techsForOffice.map(tech => (
                    <div
                      key={tech.id}
                      className={`p-3 rounded-xl border cursor-pointer transition-all hover:border-primary/40 ${
                        assigningTicket.technician_id === tech.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border'
                      }`}
                      onClick={() => handleAssign(assigningTicket.id, tech.id)}
                    >
                      <p className="font-semibold text-sm">{tech.name}</p>
                      <p className="text-xs text-muted-foreground">{tech.role_title}</p>
                      {tech.specialization && <p className="text-xs text-muted-foreground">विशेषज्ञता: {tech.specialization}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  यस कार्यालयमा सक्रिय प्राविधिक छैन।
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Admin ticket overview end ──
