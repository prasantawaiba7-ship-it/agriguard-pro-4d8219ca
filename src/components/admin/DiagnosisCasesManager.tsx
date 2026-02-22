import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Send, Clock, CheckCircle, 
  Bug, Loader2, User, Bot, Image, Eye, 
  Phone, MessageSquare, Smartphone, AlertTriangle,
  UserPlus, Filter, X, MessageCircle, Shield, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useAdminDiagnosisCases, 
  useAddExpertSuggestion, 
  useUpdateCaseStatus,
  type DiagnosisCaseWithDetails 
} from '@/hooks/useDiagnosisCases';
import { useCrops } from '@/hooks/useCrops';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { CaseThread } from '@/components/diagnosis/CaseThread';

type DiagnosisCaseStatus = Database['public']['Enums']['diagnosis_case_status'];

const STATUS_CONFIG: Record<DiagnosisCaseStatus, { label: string; color: string }> = {
  new: { label: 'नयाँ (NEW)', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  ai_suggested: { label: 'AI सुझाव', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  expert_pending: { label: 'IN_REVIEW', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  expert_answered: { label: 'ANSWERED', color: 'bg-green-100 text-green-700 border-green-200' },
  closed: { label: 'CLOSED', color: 'bg-muted text-muted-foreground border-border' }
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  normal: { label: 'सामान्य', color: 'text-green-600' },
  urgent: { label: 'अत्यावश्यक', color: 'text-destructive' },
};

const PROBLEM_TYPES = [
  { value: 'disease', label: 'रोग' },
  { value: 'pest', label: 'कीरा' },
  { value: 'nutrition', label: 'पोषण' },
  { value: 'weather', label: 'मौसम' },
  { value: 'market', label: 'बजार' },
  { value: 'other', label: 'अन्य' },
];

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  APP: <Smartphone className="w-3 h-3" />,
  SMS: <MessageSquare className="w-3 h-3" />,
  WHATSAPP: <Phone className="w-3 h-3" />,
  VIBER: <Phone className="w-3 h-3" />,
  CALL: <Phone className="w-3 h-3" />,
};

function useExperts() {
  return useQuery({
    queryKey: ['experts-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agricultural_officers')
        .select('id, name, name_ne, district, expertise_areas, is_active, open_cases_count, max_open_cases')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });
}

// ─── TICKET DETAIL DIALOG ───
function TicketDetailDialog({ 
  caseData, 
  onClose 
}: { 
  caseData: DiagnosisCaseWithDetails; 
  onClose: () => void;
}) {
  const updateStatus = useUpdateCaseStatus();
  const { data: experts } = useExperts();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState(caseData.case_status);
  const [assigningExpert, setAssigningExpert] = useState(false);
  const [activeTab, setActiveTab] = useState('thread');

  const initialSuggestion = caseData.suggestions.find(s => s.source_type === 'rule_engine');
  const expertSuggestions = caseData.suggestions.filter(s => s.source_type === 'human_expert');
  const status = STATUS_CONFIG[caseData.case_status];
  const priority = PRIORITY_CONFIG[(caseData as any).priority || 'normal'] || PRIORITY_CONFIG.normal;

  const handleStatusChange = async (s: string) => {
    setNewStatus(s as DiagnosisCaseStatus);
    await updateStatus.mutateAsync({ caseId: caseData.id, status: s as DiagnosisCaseStatus });
    if (s === 'closed') {
      await supabase.from('diagnosis_cases').update({ closed_at: new Date().toISOString() }).eq('id', caseData.id);
    }
  };

  const handleAssignExpert = async (expertId: string) => {
    setAssigningExpert(true);
    try {
      await supabase
        .from('diagnosis_cases')
        .update({ assigned_expert_id: expertId, case_status: 'expert_pending' as DiagnosisCaseStatus })
        .eq('id', caseData.id);
      queryClient.invalidateQueries({ queryKey: ['admin-diagnosis-cases'] });
    } finally {
      setAssigningExpert(false);
    }
  };

  const handleAutoRoute = async () => {
    try {
      await supabase.rpc('auto_route_case', { p_case_id: caseData.id });
      queryClient.invalidateQueries({ queryKey: ['admin-diagnosis-cases'] });
      onClose();
    } catch (e) {
      console.error('Auto-route failed:', e);
    }
  };

  return (
    <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base flex-wrap">
          <Bug className="w-5 h-5 text-primary" />
          <span className="font-mono text-sm">KS-{caseData.id.slice(0, 8).toUpperCase()}</span>
          <Badge variant="outline" className={`${status.color} border`}>{status.label}</Badge>
          <Badge variant="outline" className={`text-xs ${priority.color}`}>
            {(caseData as any).priority === 'urgent' && <AlertTriangle className="w-3 h-3 mr-1" />}
            {priority.label}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {CHANNEL_ICONS[(caseData as any).channel || 'APP']}
            <span className="ml-1">{(caseData as any).channel || 'APP'}</span>
          </Badge>
        </DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Info Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Farmer Info */}
          <div className="p-3 bg-muted/40 rounded-xl border border-border/30 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">किसान जानकारी</h4>
            <InfoRow label="बाली" value={caseData.crops?.name_ne || 'अज्ञात'} />
            <InfoRow label="जिल्ला" value={caseData.districts?.name_ne || '—'} />
            <InfoRow label="प्रदेश" value={caseData.provinces?.name_ne || '—'} />
            <InfoRow label="समस्या" value={PROBLEM_TYPES.find(p => p.value === (caseData as any).problem_type)?.label || '—'} />
            <InfoRow label="मिति" value={format(new Date(caseData.created_at), 'yyyy-MM-dd HH:mm')} />
          </div>

          {/* Photos */}
          {caseData.images.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">📷 फोटोहरू ({caseData.images.length})</p>
              <div className="grid grid-cols-2 gap-2">
                {caseData.images.map((img) => (
                  <div key={img.id} className="aspect-square rounded-xl overflow-hidden border border-border/30 cursor-pointer hover:opacity-80">
                    <img src={img.image_url} alt="Case" className="w-full h-full object-cover" onClick={() => window.open(img.image_url, '_blank')} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {initialSuggestion && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">AI अनुमान ({initialSuggestion.confidence_level}%)</span>
              </div>
              <p className="text-sm font-medium">{initialSuggestion.suspected_problem}</p>
              <p className="text-xs text-muted-foreground mt-1">{initialSuggestion.advice_text}</p>
            </div>
          )}

          {/* Assignment + Status Controls */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">विज्ञ तोक्नुहोस्</label>
              <Select
                value={(caseData as any).assigned_expert_id || ''}
                onValueChange={handleAssignExpert}
                disabled={assigningExpert}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="विज्ञ छान्नुहोस्" />
                </SelectTrigger>
                <SelectContent>
                  {experts?.map(e => (
                    <SelectItem key={e.id} value={e.id} className="text-sm">
                      {e.name_ne || e.name} — {e.district} ({e.open_cases_count || 0}/{e.max_open_cases || 50})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="mt-1 w-full text-xs" onClick={handleAutoRoute}>
                <UserPlus className="w-3 h-3 mr-1" /> Auto-Assign
              </Button>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">स्थिति</label>
              <Select value={newStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-sm">{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* RIGHT: Thread + History */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="thread" className="flex-1">
                <MessageCircle className="w-3 h-3 mr-1" /> सन्देश Thread
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1">
                <FileText className="w-3 h-3 mr-1" /> विज्ञ उत्तरहरू
              </TabsTrigger>
            </TabsList>

            <TabsContent value="thread" className="mt-3">
              <Card>
                <CardContent className="p-0">
                  <CaseThread caseId={caseData.id} senderRole="expert" showInternalNotes={true} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-3 space-y-3">
              {/* Farmer Question */}
              {caseData.farmer_question && (
                <div className="p-3 bg-muted/40 rounded-xl border border-border/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">किसानको विवरण:</p>
                  <p className="text-sm whitespace-pre-wrap">{caseData.farmer_question}</p>
                </div>
              )}

              {/* Expert Suggestions */}
              {expertSuggestions.length > 0 ? (
                expertSuggestions.map(s => (
                  <div key={s.id} className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">
                        कृषि विज्ञ ({s.confidence_level}%)
                        {s.is_final && <Badge className="ml-2 bg-green-500 text-white text-[10px]">अन्तिम</Badge>}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{s.suspected_problem}</p>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{s.advice_text}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">कुनै विज्ञ उत्तर छैन</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DialogContent>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

// ─── MAIN COMPONENT ───
export function DiagnosisCasesManager() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [problemTypeFilter, setProblemTypeFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<DiagnosisCaseWithDetails | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [savedView, setSavedView] = useState<string>('all');
  const queryClient = useQueryClient();

  const filters: any = {};
  if (statusFilter !== 'all') filters.status = statusFilter;
  if (priorityFilter !== 'all') filters.priority = priorityFilter;
  if (problemTypeFilter !== 'all') filters.problemType = problemTypeFilter;
  if (channelFilter !== 'all') filters.channel = channelFilter;

  const { data: cases, isLoading, refetch } = useAdminDiagnosisCases(
    Object.keys(filters).length > 0 ? filters : undefined
  );

  // Realtime subscription for new diagnosis cases
  useEffect(() => {
    const channel = supabase
      .channel('admin-diagnosis-realtime')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'diagnosis_cases',
      }, (payload: any) => {
        toast.info('नयाँ केस प्राप्त भयो!', {
          description: `Crop ID: ${payload.new?.crop_id || '—'} | Priority: ${payload.new?.priority || 'normal'}`,
        });
        queryClient.invalidateQueries({ queryKey: ['admin-diagnosis-cases'] });
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'diagnosis_cases',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-diagnosis-cases'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Saved views filtering
  let viewFilteredCases = cases || [];
  if (savedView === 'unassigned') {
    viewFilteredCases = viewFilteredCases.filter(c => !(c as any).assigned_expert_id && c.case_status !== 'closed');
  } else if (savedView === 'high_priority') {
    viewFilteredCases = viewFilteredCases.filter(c => (c as any).priority === 'urgent');
  }

  // Client-side search
  const filteredCases = viewFilteredCases.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.id.toLowerCase().includes(q) ||
      c.crops?.name_ne?.toLowerCase().includes(q) ||
      c.crops?.name_en?.toLowerCase().includes(q) ||
      c.districts?.name_ne?.toLowerCase().includes(q) ||
      c.farmer_question?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: cases?.length || 0,
    new: cases?.filter(c => c.case_status === 'new').length || 0,
    inReview: cases?.filter(c => c.case_status === 'expert_pending' || c.case_status === 'ai_suggested').length || 0,
    answered: cases?.filter(c => c.case_status === 'expert_answered').length || 0,
    urgent: cases?.filter(c => (c as any).priority === 'urgent').length || 0,
    unassigned: cases?.filter(c => !(c as any).assigned_expert_id && c.case_status !== 'closed').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <StatCard label="कुल" value={stats.total} onClick={() => setSavedView('all')} active={savedView === 'all'} />
        <StatCard label="नयाँ" value={stats.new} color="text-destructive" highlight={stats.new > 0} onClick={() => { setSavedView('all'); setStatusFilter('new'); }} />
        <StatCard label="हेर्दै" value={stats.inReview} color="text-orange-500" />
        <StatCard label="उत्तर" value={stats.answered} color="text-green-500" />
        <StatCard label="अत्यावश्यक" value={stats.urgent} color="text-destructive" onClick={() => setSavedView('high_priority')} active={savedView === 'high_priority'} />
        <StatCard label="Unassigned" value={stats.unassigned} color="text-amber-600" onClick={() => setSavedView('unassigned')} active={savedView === 'unassigned'} />
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="केस ID, बाली, जिल्ला खोज्नुहोस्..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-1" /> फिल्टर
        </Button>
        <Button variant="outline" size="sm" onClick={() => refetch()}>रिफ्रेस</Button>
      </div>

      {/* Filter Row */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-muted/30 rounded-xl border border-border/30">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="स्थिति" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">सबै स्थिति</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="प्राथमिकता" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">सबै</SelectItem>
                  <SelectItem value="normal">सामान्य</SelectItem>
                  <SelectItem value="urgent">अत्यावश्यक</SelectItem>
                </SelectContent>
              </Select>
              <Select value={problemTypeFilter} onValueChange={setProblemTypeFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="समस्या" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">सबै समस्या</SelectItem>
                  {PROBLEM_TYPES.map(pt => (
                    <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="च्यानल" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">सबै च्यानल</SelectItem>
                  <SelectItem value="APP">App</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="CALL">Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cases Table */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : filteredCases.length > 0 ? (
        <div className="space-y-2">
          {filteredCases.map(caseData => (
            <CaseRow key={caseData.id} caseData={caseData} onOpen={() => setSelectedCase(caseData)} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Bug className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">कुनै केस भेटिएन</p>
          </CardContent>
        </Card>
      )}

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedCase} onOpenChange={(open) => !open && setSelectedCase(null)}>
        {selectedCase && (
          <TicketDetailDialog caseData={selectedCase} onClose={() => { setSelectedCase(null); refetch(); }} />
        )}
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, color, onClick, active, highlight }: { label: string; value: number; color?: string; onClick?: () => void; active?: boolean; highlight?: boolean }) {
  return (
    <Card className={`cursor-pointer transition-colors ${active ? 'ring-2 ring-primary' : ''} ${highlight ? 'ring-2 ring-destructive/50 bg-destructive/5' : ''}`} onClick={onClick}>
      <CardContent className="pt-3 pb-3 text-center">
        <p className={`text-xl font-bold ${color || ''}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function CaseRow({ caseData, onOpen }: { caseData: DiagnosisCaseWithDetails; onOpen: () => void }) {
  const status = STATUS_CONFIG[caseData.case_status];
  const isUrgent = (caseData as any).priority === 'urgent';
  const channel = (caseData as any).channel || 'APP';
  const assignedExpert = (caseData as any).assigned_expert;

  const isNew = caseData.case_status === 'new' || caseData.case_status === 'ai_suggested';

  return (
    <div
      className={`p-3 sm:p-4 border rounded-xl hover:bg-muted/30 transition-colors cursor-pointer ${
        isUrgent ? 'border-destructive/30 bg-destructive/5' : isNew ? 'border-primary/30 bg-yellow-50 dark:bg-yellow-900/10' : 'border-border/40'
      }`}
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        {caseData.images[0] ? (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 border border-border/30">
            <img src={caseData.images[0].image_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <Image className="w-6 h-6 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[10px] font-mono text-muted-foreground">KS-{caseData.id.slice(0, 8).toUpperCase()}</span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${status.color} border`}>{status.label}</Badge>
            {isUrgent && (
              <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0">
                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />अत्यावश्यक
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {CHANNEL_ICONS[channel]} <span className="ml-0.5">{channel}</span>
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{caseData.crops?.name_ne || 'अज्ञात'}</span>
            {caseData.districts?.name_ne && (
              <span className="text-xs text-muted-foreground">• {caseData.districts.name_ne}</span>
            )}
          </div>

          {caseData.farmer_question && (
            <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[300px]">{caseData.farmer_question.slice(0, 80)}</p>
          )}

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {assignedExpert ? (
              <span className="text-[10px] text-primary flex items-center gap-0.5">
                <UserPlus className="w-3 h-3" /> {assignedExpert.name_ne || assignedExpert.name}
              </span>
            ) : caseData.case_status !== 'closed' ? (
              <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                <UserPlus className="w-3 h-3" /> Unassigned
              </span>
            ) : null}
            <span className="text-[10px] text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(caseData.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        <Button variant="ghost" size="icon" className="flex-shrink-0 w-8 h-8">
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
