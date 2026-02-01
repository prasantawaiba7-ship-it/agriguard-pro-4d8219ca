import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Loader2, User, Bot, Leaf } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useMyDiagnosisCases, type DiagnosisCaseWithDetails } from '@/hooks/useDiagnosisCases';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type DiagnosisCaseStatus = Database['public']['Enums']['diagnosis_case_status'];

const statusConfig: Record<DiagnosisCaseStatus, { label: string; icon: React.ReactNode; color: string }> = {
  new: { label: 'नयाँ', icon: <Clock className="w-3 h-3" />, color: 'bg-blue-500' },
  ai_suggested: { label: 'प्रारम्भिक अनुमान', icon: <Bot className="w-3 h-3" />, color: 'bg-yellow-500' },
  expert_pending: { label: 'विज्ञको पर्खाइमा', icon: <Clock className="w-3 h-3" />, color: 'bg-orange-500' },
  expert_answered: { label: 'उत्तर आएको छ', icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-500' },
  closed: { label: 'बन्द', icon: <CheckCircle className="w-3 h-3" />, color: 'bg-gray-500' }
};

function CaseCard({ caseData }: { caseData: DiagnosisCaseWithDetails }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const status = statusConfig[caseData.case_status];
  
  const finalSuggestion = caseData.suggestions.find(s => s.is_final);
  const initialSuggestion = caseData.suggestions.find(s => s.source_type === 'rule_engine');

  return (
    <Card className="overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          {caseData.images[0] && (
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={caseData.images[0].image_url}
                alt="Case"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${status.color} text-white text-xs`}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(caseData.created_at), { 
                  addSuffix: true
                })}
              </span>
            </div>
            
            <p className="font-medium text-sm">
              {caseData.crops?.name_ne || 'अज्ञात बाली'}
            </p>
            
            {caseData.farmer_question && (
              <p className="text-xs text-muted-foreground truncate">
                {caseData.farmer_question}
              </p>
            )}
          </div>
          
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0 pb-4 space-y-4">
              {/* Images */}
              {caseData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {caseData.images.map((img) => (
                    <AspectRatio key={img.id} ratio={1}>
                      <img
                        src={img.image_url}
                        alt="Case image"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </AspectRatio>
                  ))}
                </div>
              )}

              {/* Initial Hint (Rule-based) */}
              {initialSuggestion && (
                <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      प्रारम्भिक अनुमान (AI/Rule आधारित – अन्तिम होइन)
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {initialSuggestion.suspected_problem}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {initialSuggestion.advice_text}
                  </p>
                </div>
              )}

              {/* Expert Answer */}
              {finalSuggestion ? (
                <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-success" />
                    <span className="text-xs font-medium text-success">
                      कृषि विज्ञको उत्तर ✓
                    </span>
                  </div>
                  <p className="text-sm font-semibold">
                    {finalSuggestion.suspected_problem}
                  </p>
                  <p className="text-sm mt-2 whitespace-pre-wrap">
                    {finalSuggestion.advice_text}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg text-center">
                  <Clock className="w-5 h-5 mx-auto text-warning mb-1" />
                  <p className="text-sm text-muted-foreground">
                    कृषि विज्ञको उत्तरको पर्खाइमा...
                  </p>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export function MyDiagnosisCases() {
  const { user } = useAuth();
  const { data: cases, isLoading } = useMyDiagnosisCases();

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            आफ्ना केसहरू हेर्न लगइन गर्नुहोस्
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Leaf className="w-5 h-5" />
            मेरा रोग/किरा केसहरू
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Leaf className="w-5 h-5 text-primary" />
          मेरा रोग/किरा केसहरू
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cases && cases.length > 0 ? (
          <div className="space-y-3">
            {cases.map(caseData => (
              <CaseCard key={caseData.id} caseData={caseData} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Leaf className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              अहिलेसम्म कुनै केस पठाइएको छैन
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
