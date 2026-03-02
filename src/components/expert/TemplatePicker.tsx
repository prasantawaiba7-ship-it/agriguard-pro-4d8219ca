import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, FileText, Sparkles } from 'lucide-react';
import { useExpertTemplates, ExpertTemplate } from '@/hooks/useExpertTemplates';

// Recommendation templates start

const QUICK_CROPS = ['धान', 'गहुँ', 'आलु', 'मकै', 'टमाटर', 'गोलभेडा'];

interface TemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: ExpertTemplate) => void;
  defaultCrop?: string;
  defaultLanguage?: string;
  /** Future: AI-suggested template IDs */
  suggestedTemplateIds?: string[];
}

export function TemplatePicker({
  open,
  onOpenChange,
  onSelect,
  defaultCrop,
  defaultLanguage = 'ne',
  suggestedTemplateIds,
}: TemplatePickerProps) {
  const [cropFilter, setCropFilter] = useState(defaultCrop || '');
  const [searchText, setSearchText] = useState('');

  const { data: templates, isLoading } = useExpertTemplates({
    isActive: true,
    crop: cropFilter || undefined,
    language: defaultLanguage || undefined,
    search: searchText || undefined,
  });

  const handleSelect = (t: ExpertTemplate) => {
    onSelect(t);
    onOpenChange(false);
  };

  // Separate suggested vs rest
  const suggested = suggestedTemplateIds?.length
    ? templates?.filter(t => suggestedTemplateIds.includes(t.id)) || []
    : [];
  const rest = suggestedTemplateIds?.length
    ? templates?.filter(t => !suggestedTemplateIds.includes(t.id)) || []
    : templates || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            सिफारिश Template छान्नुहोस्
          </DialogTitle>
        </DialogHeader>

        {/* Quick crop chips */}
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={cropFilter === '' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setCropFilter('')}
          >
            सबै
          </Badge>
          {QUICK_CROPS.map(c => (
            <Badge
              key={c}
              variant={cropFilter === c ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setCropFilter(cropFilter === c ? '' : c)}
            >
              {c}
            </Badge>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="रोग / शीर्षक खोज्नुहोस्..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground py-6">लोड हुँदैछ...</p>
          ) : (
            <>
              {/* Suggested templates */}
              {suggested.length > 0 && (
                <>
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Suggested
                  </p>
                  {suggested.map(t => (
                    <TemplateCard key={t.id} template={t} onSelect={handleSelect} isSuggested />
                  ))}
                </>
              )}

              {rest.length > 0 ? rest.map(t => (
                <TemplateCard key={t.id} template={t} onSelect={handleSelect} />
              )) : (
                <p className="text-center text-sm text-muted-foreground py-8">कुनै template भेटिएन।</p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({
  template,
  onSelect,
  isSuggested,
}: {
  template: ExpertTemplate;
  onSelect: (t: ExpertTemplate) => void;
  isSuggested?: boolean;
}) {
  const preview = template.body.split('\n').slice(0, 2).join(' ');
  return (
    <button
      onClick={() => onSelect(template)}
      className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent/10 ${
        isSuggested ? 'border-primary/40 bg-primary/5' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{template.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {template.crop} • {template.disease}
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{preview}</p>
        </div>
        {isSuggested && <Badge variant="secondary" className="text-[10px] shrink-0">Suggested</Badge>}
      </div>
    </button>
  );
}

// Recommendation templates end
