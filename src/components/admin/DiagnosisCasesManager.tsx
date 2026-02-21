import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Send, Clock, CheckCircle, 
  Bug, Loader2, User, Bot, Image, Eye, 
  Phone, MessageSquare, Smartphone, AlertTriangle,
  UserPlus, Filter, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  useAdminDiagnosisCases, 
  useAddExpertSuggestion, 
  useUpdateCaseStatus,
  type DiagnosisCaseWithDetails 
} from '@/hooks/useDiagnosisCases';
import { useCrops } from '@/hooks/useCrops';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type DiagnosisCaseStatus = Database['public']['Enums']['diagnosis_case_status'];

const STATUS_CONFIG: Record<DiagnosisCaseStatus, { label: string; color: string }> = {
  new: { label: 'नयाँ (NEW)', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  ai_suggested: { label: 'AI सुझाव', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  expert_pending: { label: 'IN_REVIEW', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  expert_answered: { label: 'ANSWERED', color: 'bg-green-100 text-green-700 border-green-200' },
  closed: { label: 'CLOSED', color: 'bg-muted text-muted-foreground border-border' }
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

// Hook to fetch experts for assignment dropdown
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
  const addSuggestion = useAddExpertSuggestion();
  const updateStatus = useUpdateCaseStatus();
  const { data: experts } = useExperts();
  const [suspectedProblem, setSuspectedProblem] = useState('');
  const [adviceText, setAdviceText] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState([80]);
  const [isFinal, setIsFinal] = useState(true);
  const [newStatus, setNewStatus] = useState(caseData.case_status);
  const [assigningExpert, setAssigningExpert] = useState(false);

  const initialSuggestion = caseData.suggestions.find(s => s.source_type === 'rule_engine');
  const expertSuggestions = caseData.suggestions.filter(s => s.source_type === 'human_expert');
  const status = STATUS_CONFIG[caseData.case_status];

  const handleSubmitAnswer = async () => {
    if (!suspectedProblem || !adviceText) return;
    await addSuggestion.mutateAsync({
      caseId: caseData.id,
      suspectedProblem,
      adviceText,
      confidenceLevel: confidenceLevel[0],
      isFinal
    });
    setSuspectedProblem('');
    setAdviceText('');
  };

  const handleStatusChange = async (s: string) => {
    setNewStatus(s as DiagnosisCaseStatus);
    await updateStatus.mutateAsync({ caseId: caseData.id, status: s as DiagnosisCaseStatus });
  };

  const handleAssignExpert = async (expertId: string) => {
    setAssigningExpert(true);
    try {
      await supabase
        .from('diagnosis_cases')
        .update({ assigned_expert_id: expertId, case_status: 'expert_pending' as DiagnosisCaseStatus })
        .eq('id', caseData.id);
      onClose();
      onClose();
    } finally {
      setAssigningExpert(false);
    }
  };

  return (
    <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          <Bug className="w-5 h-5 text-primary" />
          केस: <span className="font-mono text-sm">KS-{caseData.id.slice(0, 8).toUpperCase()}</span>
          <Badge variant="outline" className={`ml-2 ${status.color} border`}>{status.label}</Badge>
          {(caseData as any).priority === 'urgent' && (
            <Badge className="bg-destructive text-destructive-foreground text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" /> अत्यावश्यक
            </Badge>
          )}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5">
        {/* ── Farmer Info + Location ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InfoChip label="बाली" value={caseData.crops?.name_ne || 'अज्ञात'} />
          <InfoChip label="जिल्ला" value={caseData.districts?.name_ne || '—'} />
          <InfoChip label="प्रदेश" value={caseData.provinces?.name_ne || '—'} />
          <InfoChip label="च्यानल" value={(caseData as any).channel || 'APP'} icon={CHANNEL_ICONS[(caseData as any).channel || 'APP']} />
          <InfoChip label="समस्या" value={PROBLEM_TYPES.find(p => p.value === (caseData as any).problem_type)?.label || '—'} />
          <InfoChip label="मिति" value={format(new Date(caseData.created_at), 'yyyy-MM-dd HH:mm')} />
        </div>

        {/* ── Photos ── */}
        {caseData.images.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">📷 फोटोहरू ({caseData.images.length})</p>
            <div className="grid grid-cols-3 gap-2">
              {caseData.images.map((img) => (
                <div key={img.id} className="aspect-square rounded-xl overflow-hidden border border-border/30 cursor-pointer hover:opacity-80">
                  <img
                    src={img.image_url}
                    alt="Case"
                    className="w-full h-full object-cover"
                    onClick={() => window.open(img.image_url, '_blank')}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Farmer Question ── */}
        {caseData.farmer_question && (
          <div className="p-3 bg-muted/40 rounded-xl border border-border/30">
            <p className="text-xs font-medium text-muted-foreground mb-1">किसानको विवरण:</p>
            <p className="text-sm whitespace-pre-wrap">{caseData.farmer_question}</p>
          </div>
        )}

        {/* ── AI Suggestion ── */}
        {initialSuggestion && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">AI प्रारम्भिक अनुमान ({initialSuggestion.confidence_level}%)</span>
            </div>
            <p className="text-sm font-medium">{initialSuggestion.suspected_problem}</p>
            <p className="text-xs text-muted-foreground mt-1">{initialSuggestion.advice_text}</p>
          </div>
        )}

        {/* ── Expert Answers History ── */}
        {expertSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">विज्ञ उत्तरहरू:</p>
            {expertSuggestions.map(s => (
              <div key={s.id} className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    कृषि विज्ञको जवाफ ({s.confidence_level}%)
                    {s.is_final && <Badge className="ml-2 bg-green-500 text-white text-[10px]">अन्तिम</Badge>}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm font-medium">{s.suspected_problem}</p>
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{s.advice_text}</p>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* ── Assignment + Status Controls ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block text-muted-foreground">स्थिति बदल्नुहोस्</label>
            <Select value={newStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-sm">{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* ── Reply Composer ── */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" /> उत्तर लेख्नुहोस्
          </h3>
          <Input
            placeholder="पहिचान गरिएको समस्या (जस्तै: Late Blight)"
            value={suspectedProblem}
            onChange={(e) => setSuspectedProblem(e.target.value)}
          />
          <Textarea
            placeholder="विस्तृत निदान र उपचार सल्लाह नेपालीमा..."
            value={adviceText}
            onChange={(e) => setAdviceText(e.target.value)}
            rows={5}
          />
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">विश्वास: {confidenceLevel[0]}%</label>
              <Slider value={confidenceLevel} onValueChange={setConfidenceLevel} min={50} max={100} step={5} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isFinal} onChange={e => setIsFinal(e.target.checked)} className="rounded" />
              अन्तिम उत्तर
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>रद्द</Button>
            <Button
              onClick={handleSubmitAnswer}
              disabled={!suspectedProblem || !adviceText || addSuggestion.isPending}
            >
              {addSuggestion.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              उत्तर पठाउनुहोस्
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

function InfoChip({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="p-2 bg-muted/40 rounded-lg border border-border/30">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium flex items-center gap-1">{icon}{value}</p>
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

  const { crops } = useCrops();

  const filters: any = {};
  if (statusFilter !== 'all') filters.status = statusFilter;
  if (priorityFilter !== 'all') filters.priority = priorityFilter;
  if (problemTypeFilter !== 'all') filters.problemType = problemTypeFilter;
  if (channelFilter !== 'all') filters.channel = channelFilter;

  const { data: cases, isLoading, refetch } = useAdminDiagnosisCases(
    Object.keys(filters).length > 0 ? filters : undefined
  );

  // Client-side search
  const filteredCases = cases?.filter(c => {
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

  // Stats
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
        <StatCard label="कुल" value={stats.total} />
        <StatCard label="नयाँ" value={stats.new} color="text-blue-500" />
        <StatCard label="हेर्दै" value={stats.inReview} color="text-orange-500" />
        <StatCard label="उत्तर" value={stats.answered} color="text-green-500" />
        <StatCard label="अत्यावश्यक" value={stats.urgent} color="text-destructive" />
        <StatCard label="Unassigned" value={stats.unassigned} color="text-amber-600" />
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
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
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
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : filteredCases && filteredCases.length > 0 ? (
        <div className="space-y-2">
          {filteredCases.map(caseData => (
            <CaseRow
              key={caseData.id}
              caseData={caseData}
              onOpen={() => setSelectedCase(caseData)}
            />
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

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-3 pb-3 text-center">
        <p className={`text-xl font-bold ${color || ''}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function CaseRow({ caseData, onOpen }: { caseData: DiagnosisCaseWithDetails; onOpen: () => void }) {
  const status = STATUS_CONFIG[caseData.case_status];
  const hasExpertAnswer = caseData.suggestions.some(s => s.source_type === 'human_expert');
  const isUrgent = (caseData as any).priority === 'urgent';
  const channel = (caseData as any).channel || 'APP';
  const assignedExpert = (caseData as any).assigned_expert;

  return (
    <div
      className={`p-3 sm:p-4 border rounded-xl hover:bg-muted/30 transition-colors cursor-pointer ${
        isUrgent ? 'border-destructive/30 bg-destructive/5' : 'border-border/40'
      }`}
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
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
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${status.color} border`}>
              {status.label}
            </Badge>
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
            <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[300px]">
              {caseData.farmer_question.slice(0, 80)}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {assignedExpert && (
              <span className="text-[10px] text-primary flex items-center gap-0.5">
                <UserPlus className="w-3 h-3" /> {assignedExpert.name_ne || assignedExpert.name}
              </span>
            )}
            {!assignedExpert && caseData.case_status !== 'closed' && (
              <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                <UserPlus className="w-3 h-3" /> Unassigned
              </span>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(caseData.created_at), { addSuffix: true })}
            </span>
            {caseData.images.length > 1 && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Image className="w-3 h-3" />{caseData.images.length}
              </span>
            )}
          </div>
        </div>

        <Button variant="ghost" size="icon" className="flex-shrink-0 w-8 h-8">
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
