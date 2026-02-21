import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, Loader2, User, Bot, Leaf, ArrowLeft, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyDiagnosisCases, type DiagnosisCaseWithDetails } from '@/hooks/useDiagnosisCases';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import { useLanguage } from '@/hooks/useLanguage';
import { CaseThread } from './CaseThread';

type DiagnosisCaseStatus = Database['public']['Enums']['diagnosis_case_status'];

const STATUS_CONFIG: Record<DiagnosisCaseStatus, { label: string; icon: React.ReactNode; color: string }> = {
  new: { label: 'नयाँ', icon: <Clock className="w-3 h-3" />, color: 'bg-blue-500' },
  ai_suggested: { label: 'AI सुझाव', icon: <Bot className="w-3 h-3" />, color: 'bg-yellow-500' },
  expert_pending: { label: 'विज्ञ हेर्दै', icon: <Clock className="w-3 h-3" />, color: 'bg-orange-500' },
  expert_answered: { label: 'जवाफ आयो', icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-500' },
  closed: { label: 'बन्द', icon: <CheckCircle className="w-3 h-3" />, color: 'bg-gray-500' }
};

function CaseDetailView({ caseData, onBack }: { caseData: DiagnosisCaseWithDetails; onBack: () => void }) {
  const { language } = useLanguage();
  const status = STATUS_CONFIG[caseData.case_status];
  const finalSuggestion = caseData.suggestions.find(s => s.is_final);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="w-8 h-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">KS-{caseData.id.slice(0, 8).toUpperCase()}</span>
            <Badge className={`${status.color} text-white text-xs`}>
              {status.icon} <span className="ml-1">{status.label}</span>
            </Badge>
          </div>
          <p className="font-medium text-sm mt-0.5">
            {(language === 'ne' ? caseData.crops?.name_ne : caseData.crops?.name_en) || 'अज्ञात बाली'}
            {caseData.districts?.name_ne && ` • ${caseData.districts.name_ne}`}
          </p>
        </div>
      </div>

      {/* AI Summary */}
      {caseData.suggestions.find(s => s.source_type === 'rule_engine') && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">AI प्रारम्भिक अनुमान</span>
          </div>
          <p className="text-sm">{caseData.suggestions.find(s => s.source_type === 'rule_engine')?.suspected_problem}</p>
        </div>
      )}

      {/* Expert Final Answer */}
      {finalSuggestion && (
        <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">कृषि विज्ञको जवाफ</span>
          </div>
          <p className="text-sm font-semibold">{finalSuggestion.suspected_problem}</p>
          <p className="text-sm mt-1 whitespace-pre-wrap">{finalSuggestion.advice_text}</p>
        </div>
      )}

      {/* Photos */}
      {caseData.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {caseData.images.map(img => (
            <div key={img.id} className="aspect-square rounded-xl overflow-hidden border border-border/30">
              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Status hint */}
      {caseData.case_status !== 'closed' && caseData.case_status !== 'expert_answered' && (
        <div className="p-3 bg-muted/40 rounded-xl text-center">
          <p className="text-xs text-muted-foreground">
            तपाईंको प्रश्न कृषि विज्ञले हेर्दै हुनुहुन्छ। जवाफ आउन २४ घण्टा लाग्न सक्छ।
          </p>
        </div>
      )}

      {/* Message Thread */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            सन्देशहरू
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CaseThread caseId={caseData.id} senderRole="farmer" />
        </CardContent>
      </Card>
    </div>
  );
}

function CaseListItem({ caseData, onClick }: { caseData: DiagnosisCaseWithDetails; onClick: () => void }) {
  const { language } = useLanguage();
  const status = STATUS_CONFIG[caseData.case_status];
  const isUrgent = (caseData as any).priority === 'urgent';

  return (
    <div
      className={`p-3 border rounded-xl hover:bg-muted/30 transition-colors cursor-pointer ${isUrgent ? 'border-destructive/30' : 'border-border/40'}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {caseData.images[0] && (
          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
            <img src={caseData.images[0].image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={`${status.color} text-white text-xs`}>
              {status.icon} <span className="ml-1">{status.label}</span>
            </Badge>
            {isUrgent && <Badge variant="destructive" className="text-[10px]">अत्यावश्यक</Badge>}
          </div>
          <p className="font-medium text-sm">
            {(language === 'ne' ? caseData.crops?.name_ne : caseData.crops?.name_en) || 'अज्ञात'}
          </p>
          {caseData.farmer_question && (
            <p className="text-xs text-muted-foreground truncate">{caseData.farmer_question}</p>
          )}
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(caseData.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MyDiagnosisCases() {
  const { user } = useAuth();
  const { data: cases, isLoading } = useMyDiagnosisCases();
  const { t } = useLanguage();
  const [selectedCase, setSelectedCase] = useState<DiagnosisCaseWithDetails | null>(null);

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t('loginToViewCases')}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Leaf className="w-5 h-5" /> {t('myCases')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}</CardContent>
      </Card>
    );
  }

  if (selectedCase) {
    return <CaseDetailView caseData={selectedCase} onBack={() => setSelectedCase(null)} />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Leaf className="w-5 h-5 text-primary" />
          मेरा प्रश्नहरू ({cases?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cases && cases.length > 0 ? (
          <div className="space-y-2">
            {cases.map(c => (
              <CaseListItem key={c.id} caseData={c} onClick={() => setSelectedCase(c)} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Leaf className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t('noCasesYet')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
