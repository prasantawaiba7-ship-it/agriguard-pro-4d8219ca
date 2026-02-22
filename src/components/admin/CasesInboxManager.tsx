import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, ArrowLeft, Send, StickyNote, Phone, Smartphone,
  MessageSquare as MsgIcon, PhoneCall, AlertTriangle, Clock,
  User, Bot, ChevronDown, RefreshCw, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface CaseRow {
  id: string;
  farmer_id: string | null;
  farmer_phone: string | null;
  crop: string | null;
  problem_type: string | null;
  district: string | null;
  channel: string | null;
  priority: string | null;
  status: string | null;
  ai_summary: any;
  assigned_expert_id: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketMsg {
  id: string;
  case_id: string;
  sender_type: string | null;
  message: string | null;
  attachments: any;
  created_at: string;
}

interface ExpertOption {
  id: string;
  name: string;
  status: string | null;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-blue-500' },
  { value: 'in_review', label: 'In Review', color: 'bg-yellow-500' },
  { value: 'answered', label: 'Answered', color: 'bg-green-500' },
  { value: 'closed', label: 'Closed', color: 'bg-muted-foreground' },
];

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', color: 'text-destructive' },
  { value: 'medium', label: 'Medium', color: 'text-orange-500' },
  { value: 'low', label: 'Low', color: 'text-green-600' },
];

const CHANNEL_ICONS: Record<string, typeof Phone> = {
  app: Smartphone,
  sms: MsgIcon,
  whatsapp: Phone,
  viber: Phone,
  call: PhoneCall,
};

function StatusBadge({ status }: { status: string | null }) {
  const opt = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  return (
    <Badge variant="outline" className="gap-1.5 text-xs">
      <span className={`h-2 w-2 rounded-full ${opt.color}`} />
      {opt.label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string | null }) {
  const opt = PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[2];
  return <span className={`text-xs font-semibold ${opt.color}`}>{opt.label}</span>;
}

export function CasesInboxManager() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const queryClient = useQueryClient();

  // Fetch all cases (admin)
  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ['admin-cases', filterStatus, filterPriority, filterChannel],
    queryFn: async () => {
      let q = (supabase as any).from('cases').select('*').order('created_at', { ascending: false });
      if (filterStatus !== 'all') q = q.eq('status', filterStatus);
      if (filterPriority !== 'all') q = q.eq('priority', filterPriority);
      if (filterChannel !== 'all') q = q.eq('channel', filterChannel);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return (data || []) as CaseRow[];
    },
  });

  // Fetch experts list for assignment
  const { data: experts } = useQuery({
    queryKey: ['admin-experts-options'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('experts')
        .select('id, name, status')
        .order('name');
      if (error) throw error;
      return (data || []) as ExpertOption[];
    },
  });

  // Realtime subscription for new cases
  useEffect(() => {
    const channel = supabase
      .channel('admin-new-cases')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'cases',
      }, (payload: any) => {
        toast.info(`नयाँ केस प्राप्त भयो — ${payload.new?.crop || 'Unknown crop'}`, {
          description: `District: ${payload.new?.district || '—'} | Priority: ${payload.new?.priority || 'low'}`,
          action: {
            label: 'हेर्नुहोस्',
            onClick: () => setSelectedCaseId(payload.new?.id),
          },
        });
        queryClient.invalidateQueries({ queryKey: ['admin-cases'] });
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'cases',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-cases'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Filter by search
  const filtered = cases?.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.id.toLowerCase().includes(s) ||
      c.farmer_phone?.toLowerCase().includes(s) ||
      c.crop?.toLowerCase().includes(s) ||
      c.district?.toLowerCase().includes(s) ||
      c.problem_type?.toLowerCase().includes(s)
    );
  }) || [];

  const selectedCase = cases?.find(c => c.id === selectedCaseId) || null;

  // Stats
  const newCount = cases?.filter(c => c.status === 'new').length || 0;
  const openCount = cases?.filter(c => c.status !== 'closed').length || 0;
  const highCount = cases?.filter(c => c.priority === 'high' && c.status !== 'closed').length || 0;
  const unassignedCount = cases?.filter(c => !c.assigned_expert_id && c.status !== 'closed').length || 0;

  // Auto-set status to 'in_review' when admin opens a 'new' case
  const handleOpenCase = async (caseRow: CaseRow) => {
    setSelectedCaseId(caseRow.id);
    if (caseRow.status === 'new') {
      await (supabase as any).from('cases').update({ status: 'in_review', updated_at: new Date().toISOString() }).eq('id', caseRow.id);
      queryClient.invalidateQueries({ queryKey: ['admin-cases'] });
    }
  };

  if (selectedCase) {
    return (
      <CaseDetailView
        caseData={selectedCase}
        experts={experts || []}
        onBack={() => setSelectedCaseId(null)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <MsgIcon className="h-5 w-5 text-primary" />
              टिकट केस Inbox
              {newCount > 0 && (
                <Badge className="bg-destructive text-destructive-foreground ml-2 animate-pulse">
                  New ({newCount})
                </Badge>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-cases'] })}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'नयाँ (New)', value: newCount, color: 'text-destructive' },
              { label: 'Open', value: openCount, color: 'text-blue-600' },
              { label: 'High Priority', value: highCount, color: 'text-orange-500' },
              { label: 'Unassigned', value: unassignedCount, color: 'text-muted-foreground' },
            ].map(s => (
              <div key={s.label} className={`p-3 rounded-lg text-center ${s.label === 'नयाँ (New)' && s.value > 0 ? 'bg-destructive/10 ring-1 ring-destructive/30' : 'bg-muted/50'}`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search phone, crop, district..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {PRIORITY_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Channel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channel</SelectItem>
                <SelectItem value="app">App</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="call">Call</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {casesLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">कुनै केस भेटिएन</div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]"></TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => {
                  const ChannelIcon = CHANNEL_ICONS[c.channel || 'app'] || Smartphone;
                  const isNew = c.status === 'new';
                  return (
                    <TableRow
                      key={c.id}
                      className={`cursor-pointer hover:bg-accent/50 ${isNew ? 'bg-yellow-50 dark:bg-yellow-900/10 font-medium' : ''}`}
                      onClick={() => handleOpenCase(c)}
                    >
                      <TableCell className="pr-0">
                        {isNew && <span className="block h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />}
                      </TableCell>
                      <TableCell><ChannelIcon className="h-4 w-4 text-muted-foreground" /></TableCell>
                      <TableCell className="font-mono text-xs">{c.farmer_phone || '—'}</TableCell>
                      <TableCell>{c.crop || '—'}</TableCell>
                      <TableCell className="max-w-[120px] truncate">{c.problem_type || '—'}</TableCell>
                      <TableCell>{c.district || '—'}</TableCell>
                      <TableCell><PriorityBadge priority={c.priority} /></TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                        {isNew && <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">NEW</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Case Detail View ───────────────────────────────────────
function CaseDetailView({
  caseData,
  experts,
  onBack,
}: {
  caseData: CaseRow;
  experts: ExpertOption[];
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [isNote, setIsNote] = useState(false);

  // Fetch messages
  const { data: messages, isLoading: msgsLoading } = useQuery({
    queryKey: ['case-messages', caseData.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ticket_messages')
        .select('*')
        .eq('case_id', caseData.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as TicketMsg[];
    },
  });

  // Realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`admin-ticket-${caseData.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'ticket_messages',
        filter: `case_id=eq.${caseData.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['case-messages', caseData.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [caseData.id, queryClient]);

  // Send reply mutation
  const sendReply = useMutation({
    mutationFn: async () => {
      if (!replyText.trim()) return;
      await (supabase as any).from('ticket_messages').insert({
        case_id: caseData.id,
        sender_type: isNote ? 'expert_note' : 'expert',
        message: replyText.trim(),
      });
      // Update case status if new
      if (!isNote && (caseData.status === 'new' || caseData.status === 'in_review')) {
        await (supabase as any).from('cases').update({ status: 'answered' }).eq('id', caseData.id);
      }
      // Create notification for farmer (if not internal note)
      if (!isNote && caseData.farmer_id) {
        try {
          // Look up farmer_profiles.id from auth user id
          const { data: farmerProfile } = await supabase
            .from('farmer_profiles')
            .select('id')
            .eq('user_id', caseData.farmer_id)
            .single();
          if (farmerProfile) {
            await supabase.from('farmer_notifications').insert({
              farmer_id: farmerProfile.id,
              type: 'expert_reply',
              title: 'कृषि विज्ञको जवाफ आएको छ',
              message: 'तपाईंको प्रश्नमा कृषि विज्ञले नयाँ जवाफ पठाउनुभएको छ।',
              data: { case_id: caseData.id } as any,
            });
          }
        } catch (e) {
          console.warn('Failed to create farmer notification:', e);
        }
      }
    },
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['case-messages', caseData.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-cases'] });
      toast.success(isNote ? 'Internal note saved' : 'Reply sent to farmer ✅');
    },
    onError: () => toast.error('Failed to send'),
  });

  // Update status
  const updateCase = useMutation({
    mutationFn: async (updates: Partial<CaseRow>) => {
      const { error } = await (supabase as any).from('cases').update(updates).eq('id', caseData.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cases'] });
      toast.success('Case updated');
    },
  });

  const ai = caseData.ai_summary;

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to Inbox
      </Button>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left column: Context */}
        <div className="space-y-4">
          {/* Case header */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-muted-foreground">{caseData.id.slice(0, 8)}...</p>
                <StatusBadge status={caseData.status} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Select value={caseData.status || 'new'} onValueChange={v => updateCase.mutate({ status: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Priority</label>
                  <Select value={caseData.priority || 'low'} onValueChange={v => updateCase.mutate({ priority: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Assigned Expert</label>
                <Select
                  value={caseData.assigned_expert_id || 'none'}
                  onValueChange={v => updateCase.mutate({ assigned_expert_id: v === 'none' ? null : v })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Unassigned —</SelectItem>
                    {experts.filter(e => e.status === 'active').map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Farmer info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" /> Farmer Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Phone:</span> {caseData.farmer_phone || '—'}</p>
              <p><span className="text-muted-foreground">Crop:</span> {caseData.crop || '—'}</p>
              <p><span className="text-muted-foreground">District:</span> {caseData.district || '—'}</p>
              <p><span className="text-muted-foreground">Channel:</span> {caseData.channel || 'app'}</p>
              <p><span className="text-muted-foreground">Created:</span> {format(new Date(caseData.created_at), 'yyyy-MM-dd HH:mm')}</p>
            </CardContent>
          </Card>

          {/* AI Summary */}
          {ai && (
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" /> AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {ai.disease && <p><span className="text-muted-foreground">Disease:</span> {ai.disease}</p>}
                {ai.severity && (
                  <p>
                    <span className="text-muted-foreground">Severity:</span>{' '}
                    <span className={ai.severity === 'high' ? 'text-destructive font-semibold' : ''}>{ai.severity}</span>
                  </p>
                )}
                {ai.confidence && <p><span className="text-muted-foreground">Confidence:</span> {Math.round(ai.confidence * 100)}%</p>}
                {ai.recommendation && (
                  <div className="p-2 bg-muted/50 rounded text-xs">{ai.recommendation}</div>
                )}
                {ai.imageUrl && (
                  <img src={ai.imageUrl} alt="Disease" className="w-full rounded-lg border" />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Conversation */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <ScrollArea className="flex-1 min-h-[300px] max-h-[500px] pr-2">
                {msgsLoading ? (
                  <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-3/4" />)}</div>
                ) : messages?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No messages yet</div>
                ) : (
                  <div className="space-y-3 py-2">
                    {messages?.map(msg => {
                      const isFarmer = msg.sender_type === 'farmer';
                      const isExpert = msg.sender_type === 'expert';
                      const isNote = msg.sender_type === 'expert_note';
                      const isSystem = msg.sender_type === 'system' || msg.sender_type === 'ai';

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isFarmer ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                              isFarmer
                                ? 'bg-green-100 dark:bg-green-900/30 text-foreground'
                                : isNote
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-foreground border border-yellow-300 dark:border-yellow-700'
                                : isSystem
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-primary text-primary-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              {isFarmer && <User className="h-3 w-3" />}
                              {isNote && <StickyNote className="h-3 w-3" />}
                              {isSystem && <Bot className="h-3 w-3" />}
                              <span className="text-[10px] opacity-70">
                                {isFarmer ? 'Farmer' : isNote ? 'Internal Note' : isSystem ? 'System' : 'Expert'} · {format(new Date(msg.created_at), 'HH:mm')}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{msg.message}</p>

                            {/* Attachments */}
                            {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {msg.attachments.map((att: any, idx: number) => (
                                  att.type === 'image' && att.url ? (
                                    <img key={idx} src={att.url} alt="Attachment" className="w-20 h-20 object-cover rounded border" />
                                  ) : null
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Reply composer */}
              <div className="border-t pt-3 mt-3 space-y-2">
                <Textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={isNote ? 'Internal note (only visible to experts/admins)...' : 'कृषकलाई जवाफ लेख्नुहोस्…'}
                  className="min-h-[80px]"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant={isNote ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => setIsNote(false)}
                    >
                      <Send className="h-3 w-3 mr-1" /> Reply
                    </Button>
                    <Button
                      variant={isNote ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsNote(true)}
                    >
                      <StickyNote className="h-3 w-3 mr-1" /> Note
                    </Button>
                  </div>
                  <Button
                    onClick={() => sendReply.mutate()}
                    disabled={!replyText.trim() || sendReply.isPending}
                    size="sm"
                  >
                    {sendReply.isPending ? 'Sending...' : isNote ? 'Save Note' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
