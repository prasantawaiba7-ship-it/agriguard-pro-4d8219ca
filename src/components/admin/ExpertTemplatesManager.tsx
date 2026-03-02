import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Search, FileText } from 'lucide-react';
import { useExpertTemplates, useCreateExpertTemplate, useUpdateExpertTemplate, ExpertTemplate } from '@/hooks/useExpertTemplates';

// Recommendation templates start

const LANGUAGES = [
  { value: 'ne', label: 'नेपाली' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
];

const COMMON_CROPS = ['धान', 'गहुँ', 'मकै', 'आलु', 'टमाटर', 'गोलभेडा', 'काउली', 'बन्दा', 'मूला', 'केरा'];

const emptyForm = {
  crop: '',
  disease: '',
  language: 'ne',
  title: '',
  body: '',
  tags: '' as string,
  is_active: true,
};

export function ExpertTemplatesManager() {
  const [filterCrop, setFilterCrop] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [searchText, setSearchText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: templates, isLoading } = useExpertTemplates({
    crop: filterCrop || undefined,
    language: filterLang || undefined,
    search: searchText || undefined,
  });

  const createTemplate = useCreateExpertTemplate();
  const updateTemplate = useUpdateExpertTemplate();

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (t: ExpertTemplate) => {
    setForm({
      crop: t.crop,
      disease: t.disease,
      language: t.language,
      title: t.title,
      body: t.body,
      tags: (t.tags || []).join(', '),
      is_active: t.is_active,
    });
    setEditingId(t.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = {
      crop: form.crop.trim(),
      disease: form.disease.trim(),
      language: form.language,
      title: form.title.trim(),
      body: form.body.trim(),
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      is_active: form.is_active,
    };

    if (!payload.crop || !payload.disease || !payload.title || !payload.body) return;

    if (editingId) {
      updateTemplate.mutate({ id: editingId, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createTemplate.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const toggleActive = (t: ExpertTemplate) => {
    updateTemplate.mutate({ id: t.id, is_active: !t.is_active });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            सिफारिश Templates
          </CardTitle>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> नयाँ Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="खोज्नुहोस्..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterCrop} onValueChange={v => setFilterCrop(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="बाली" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">सबै बाली</SelectItem>
              {COMMON_CROPS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterLang} onValueChange={v => setFilterLang(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="भाषा" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">सबै</SelectItem>
              {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-6">लोड हुँदैछ...</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>शीर्षक</TableHead>
                  <TableHead>बाली</TableHead>
                  <TableHead>रोग/समस्या</TableHead>
                  <TableHead>भाषा</TableHead>
                  <TableHead>सक्रिय</TableHead>
                  <TableHead className="text-right">कार्य</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates && templates.length > 0 ? templates.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{t.title}</TableCell>
                    <TableCell><Badge variant="outline">{t.crop}</Badge></TableCell>
                    <TableCell className="max-w-[150px] truncate">{t.disease}</TableCell>
                    <TableCell>{LANGUAGES.find(l => l.value === t.language)?.label || t.language}</TableCell>
                    <TableCell>
                      <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      कुनै template छैन।
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Template सम्पादन' : 'नयाँ Template'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>बाली *</Label>
                  <Input value={form.crop} onChange={e => setForm(f => ({ ...f, crop: e.target.value }))} placeholder="आलु" />
                </div>
                <div>
                  <Label>रोग/समस्या *</Label>
                  <Input value={form.disease} onChange={e => setForm(f => ({ ...f, disease: e.target.value }))} placeholder="Late blight" />
                </div>
              </div>
              <div>
                <Label>भाषा</Label>
                <Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>शीर्षक *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Short heading" />
              </div>
              <div>
                <Label>सिफारिश विवरण *</Label>
                <Textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  rows={8}
                  placeholder="१) पहिचान: ...&#10;२) उपचार: ...&#10;सावधानी: ..."
                />
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="fungicide, organic" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>सक्रिय</Label>
              </div>
              <Button onClick={handleSave} className="w-full" disabled={createTemplate.isPending || updateTemplate.isPending}>
                {editingId ? 'अपडेट गर्नुहोस्' : 'सिर्जना गर्नुहोस्'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Recommendation templates end
