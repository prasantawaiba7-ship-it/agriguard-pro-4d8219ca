import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Eye, Send, Clock, CheckCircle, AlertCircle, 
  Bug, ChevronDown, ChevronUp, Loader2, User, Bot, X, Image
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Slider } from '@/components/ui/slider';
import { 
  useAdminDiagnosisCases, 
  useAddExpertSuggestion, 
  useUpdateCaseStatus,
  type DiagnosisCaseWithDetails 
} from '@/hooks/useDiagnosisCases';
import { useCrops } from '@/hooks/useCrops';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type DiagnosisCaseStatus = Database['public']['Enums']['diagnosis_case_status'];

const statusConfig: Record<DiagnosisCaseStatus, { label: string; color: string }> = {
  new: { label: 'नयाँ', color: 'bg-blue-500' },
  ai_suggested: { label: 'AI सुझाव', color: 'bg-yellow-500' },
  expert_pending: { label: 'पेन्डिङ', color: 'bg-orange-500' },
  expert_answered: { label: 'उत्तर दिइयो', color: 'bg-green-500' },
  closed: { label: 'बन्द', color: 'bg-gray-500' }
};

function ExpertAnswerDialog({ 
  caseData, 
  onClose 
}: { 
  caseData: DiagnosisCaseWithDetails; 
  onClose: () => void;
}) {
  const addSuggestion = useAddExpertSuggestion();
  const [suspectedProblem, setSuspectedProblem] = useState('');
  const [adviceText, setAdviceText] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState([80]);
  const [isFinal, setIsFinal] = useState(true);

  const handleSubmit = async () => {
    if (!suspectedProblem || !adviceText) return;

    await addSuggestion.mutateAsync({
      caseId: caseData.id,
      suspectedProblem,
      adviceText,
      confidenceLevel: confidenceLevel[0],
      isFinal
    });

    onClose();
  };

  const initialSuggestion = caseData.suggestions.find(s => s.source_type === 'rule_engine');

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          विज्ञ उत्तर दिनुहोस्
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Case Info */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">
              {caseData.crops?.name_ne || 'अज्ञात बाली'}
            </Badge>
            {caseData.districts?.name_ne && (
              <Badge variant="outline">{caseData.districts.name_ne}</Badge>
            )}
          </div>
          {caseData.farmer_question && (
            <p className="text-sm text-muted-foreground">
              "{caseData.farmer_question}"
            </p>
          )}
        </div>

        {/* Images */}
        {caseData.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {caseData.images.map((img) => (
              <AspectRatio key={img.id} ratio={1}>
                <img
                  src={img.image_url}
                  alt="Case"
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80"
                  onClick={() => window.open(img.image_url, '_blank')}
                />
              </AspectRatio>
            ))}
          </div>
        )}

        {/* Initial Suggestion */}
        {initialSuggestion && (
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-4 h-4 text-warning" />
              <span className="text-xs font-medium">Rule-based अनुमान:</span>
            </div>
            <p className="text-sm font-medium">{initialSuggestion.suspected_problem}</p>
            <p className="text-xs text-muted-foreground">{initialSuggestion.advice_text}</p>
          </div>
        )}

        {/* Expert Input Form */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">
              पहिचान गरिएको समस्या *
            </label>
            <Input
              placeholder="जस्तै: Late Blight, Aphid Attack, नाइट्रोजन कमी..."
              value={suspectedProblem}
              onChange={(e) => setSuspectedProblem(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              निदान र उपचार सल्लाह *
            </label>
            <Textarea
              placeholder="विस्तृत निदान र उपचार चरणहरू नेपालीमा लेख्नुहोस्..."
              value={adviceText}
              onChange={(e) => setAdviceText(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground mt-1">
              ⚠️ रासायनिक उपचार सुझाव दिँदा सधैं सावधानी र स्थानीय नियम पालनाको चेतावनी दिनुहोस्।
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              विश्वास स्तर: {confidenceLevel[0]}%
            </label>
            <Slider
              value={confidenceLevel}
              onValueChange={setConfidenceLevel}
              min={50}
              max={100}
              step={5}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFinal"
              checked={isFinal}
              onChange={(e) => setIsFinal(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isFinal" className="text-sm">
              यो अन्तिम उत्तर हो (किसानलाई सूचना जानेछ)
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            रद्द गर्नुहोस्
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!suspectedProblem || !adviceText || addSuggestion.isPending}
          >
            {addSuggestion.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            उत्तर पठाउनुहोस्
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

function CaseRow({ 
  caseData, 
  onAnswer 
}: { 
  caseData: DiagnosisCaseWithDetails; 
  onAnswer: () => void;
}) {
  const status = statusConfig[caseData.case_status];
  const updateStatus = useUpdateCaseStatus();

  const hasExpertAnswer = caseData.suggestions.some(s => s.source_type === 'human_expert');

  return (
    <div className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        {caseData.images[0] ? (
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={caseData.images[0].image_url}
              alt="Case"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Image className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge className={`${status.color} text-white text-xs`}>
              {status.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {caseData.crops?.name_ne || 'अज्ञात'}
            </Badge>
            {caseData.districts?.name_ne && (
              <Badge variant="outline" className="text-xs">
                {caseData.districts.name_ne}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(caseData.created_at), { addSuffix: true })}
            </span>
          </div>

          {caseData.farmer_question && (
            <p className="text-sm text-muted-foreground truncate mb-2">
              "{caseData.farmer_question}"
            </p>
          )}

          {/* Quick actions */}
          <div className="flex gap-2 flex-wrap">
            {!hasExpertAnswer && (
              <Button size="sm" onClick={onAnswer}>
                <Send className="w-3 h-3 mr-1" />
                उत्तर दिनुहोस्
              </Button>
            )}
            {hasExpertAnswer && caseData.case_status !== 'closed' && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => updateStatus.mutate({ caseId: caseData.id, status: 'closed' })}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                बन्द गर्नुहोस्
              </Button>
            )}
            {caseData.images.length > 1 && (
              <span className="text-xs text-muted-foreground flex items-center">
                <Image className="w-3 h-3 mr-1" />
                {caseData.images.length} फोटो
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DiagnosisCasesManager() {
  const [statusFilter, setStatusFilter] = useState<DiagnosisCaseStatus | 'all'>('all');
  const [selectedCase, setSelectedCase] = useState<DiagnosisCaseWithDetails | null>(null);
  
  const { crops } = useCrops();
  const { data: cases, isLoading, refetch } = useAdminDiagnosisCases(
    statusFilter !== 'all' ? { status: statusFilter as DiagnosisCaseStatus } : undefined
  );

  // Stats
  const stats = {
    total: cases?.length || 0,
    new: cases?.filter(c => c.case_status === 'new').length || 0,
    pending: cases?.filter(c => c.case_status === 'ai_suggested' || c.case_status === 'expert_pending').length || 0,
    answered: cases?.filter(c => c.case_status === 'expert_answered').length || 0
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">कुल केस</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{stats.new}</p>
            <p className="text-xs text-muted-foreground">नयाँ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">पेन्डिङ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.answered}</p>
            <p className="text-xs text-muted-foreground">उत्तर दिइयो</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="स्थिति" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">सबै स्थिति</SelectItem>
            <SelectItem value="new">नयाँ</SelectItem>
            <SelectItem value="ai_suggested">AI सुझाव</SelectItem>
            <SelectItem value="expert_pending">पेन्डिङ</SelectItem>
            <SelectItem value="expert_answered">उत्तर दिइयो</SelectItem>
            <SelectItem value="closed">बन्द</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => refetch()}>
          रिफ्रेस गर्नुहोस्
        </Button>
      </div>

      {/* Cases List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : cases && cases.length > 0 ? (
        <div className="space-y-3">
          {cases.map(caseData => (
            <CaseRow 
              key={caseData.id} 
              caseData={caseData} 
              onAnswer={() => setSelectedCase(caseData)}
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

      {/* Answer Dialog */}
      <Dialog open={!!selectedCase} onOpenChange={(open) => !open && setSelectedCase(null)}>
        {selectedCase && (
          <ExpertAnswerDialog 
            caseData={selectedCase} 
            onClose={() => setSelectedCase(null)} 
          />
        )}
      </Dialog>
    </div>
  );
}
