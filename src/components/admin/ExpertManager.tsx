import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Plus, Pencil, Search, UserCheck, UserX, Phone, Mail,
  Building2, Shield, Clock, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface Expert {
  id: string;
  name: string;
  name_ne: string | null;
  designation: string;
  designation_ne: string | null;
  phone: string | null;
  email: string | null;
  district: string;
  province: string;
  office_name: string | null;
  office_name_ne: string | null;
  specializations: string[] | null;
  is_active: boolean | null;
  is_available: boolean | null;
  working_hours: string | null;
  profile_image_url: string | null;
  max_open_cases: number | null;
  channel_access: string[] | null;
  expertise_areas: string[] | null;
  years_of_experience: number | null;
  preferred_languages: string[] | null;
  permission_level: string | null;
  priority_types: string[] | null;
  open_cases_count: number | null;
  last_active_at: string | null;
}

const PROVINCES = [
  { value: 'Koshi', label: 'कोशी प्रदेश' },
  { value: 'Madhesh', label: 'मधेश प्रदेश' },
  { value: 'Bagmati', label: 'बागमती प्रदेश' },
  { value: 'Gandaki', label: 'गण्डकी प्रदेश' },
  { value: 'Lumbini', label: 'लुम्बिनी प्रदेश' },
  { value: 'Karnali', label: 'कर्णाली प्रदेश' },
  { value: 'Sudurpashchim', label: 'सुदूरपश्चिम प्रदेश' },
];

const EXPERTISE_OPTIONS = [
  'धान', 'मकै', 'गहुँ', 'तरकारी', 'फलफूल',
  'पशुपालन', 'माटो/पोषण', 'कीरा/रोग', 'बजार', 'मौसम', 'अन्य',
];

const CHANNEL_OPTIONS = [
  { value: 'APP', label: 'App' },
  { value: 'SMS', label: 'SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp/Viber' },
  { value: 'CALL', label: 'Call' },
];

const LANGUAGE_OPTIONS = ['नेपाली', 'मैथिली', 'भोजपुरी', 'थारु', 'English'];

const PERMISSION_LEVELS = [
  { value: 'expert', label: 'Expert' },
  { value: 'senior_expert', label: 'Senior Expert' },
  { value: 'admin', label: 'Admin' },
];

const emptyExpert: Partial<Expert> = {
  name: '', name_ne: '',
  designation: 'कृषि प्रसार अधिकृत', designation_ne: 'कृषि प्रसार अधिकृत',
  phone: '', email: '',
  district: '', province: 'Bagmati',
  office_name: '', office_name_ne: '',
  specializations: [], expertise_areas: [],
  is_active: true, is_available: true,
  working_hours: '10:00 AM - 5:00 PM',
  max_open_cases: 50,
  channel_access: ['APP'],
  preferred_languages: ['नेपाली'],
  permission_level: 'expert',
  priority_types: ['NORMAL'],
  years_of_experience: null,
};

export function ExpertManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Expert> | null>(null);
  const queryClient = useQueryClient();

  const { data: experts, isLoading } = useQuery({
    queryKey: ['admin-experts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agricultural_officers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as unknown as Expert[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (expert: Partial<Expert>) => {
      if (expert.id) {
        const { error } = await supabase
          .from('agricultural_officers')
          .update(expert as any)
          .eq('id', expert.id);
        if (error) throw error;
      } else {
        const { name, district, province, ...rest } = expert;
        if (!name || !district || !province) throw new Error('आवश्यक फिल्ड भर्नुहोस्');
        const { error } = await supabase
          .from('agricultural_officers')
          .insert({ name, district, province, ...rest } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-experts'] });
      toast.success(editing?.id ? 'कृषिविज्ञ अपडेट भयो' : 'नयाँ कृषिविज्ञ थपियो');
      setIsDialogOpen(false);
      setEditing(null);
    },
    onError: (error) => toast.error('सुरक्षित गर्न सकिएन: ' + error.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('agricultural_officers')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-experts'] });
      toast.success('स्थिति अपडेट भयो');
    },
  });

  const filtered = experts?.filter(e => {
    const matchSearch = !searchTerm ||
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.name_ne?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.phone?.includes(searchTerm) ||
      e.expertise_areas?.some(a => a.includes(searchTerm));
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && e.is_active) ||
      (filterStatus === 'inactive' && !e.is_active);
    const matchProvince = filterProvince === 'all' || e.province === filterProvince;
    return matchSearch && matchStatus && matchProvince;
  }) || [];

  const openEdit = (expert?: Expert) => {
    setEditing(expert ? { ...expert } : { ...emptyExpert });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editing?.name?.trim()) { toast.error('कृषिविज्ञको नाम आवश्यक छ'); return; }
    if (!editing?.phone?.trim()) { toast.error('फोन नम्बर आवश्यक छ'); return; }
    if (!editing?.district?.trim()) { toast.error('जिल्ला आवश्यक छ'); return; }
    if (!editing?.expertise_areas?.length && !editing?.specializations?.length) {
      toast.error('कम्तिमा एउटा विशेषज्ञता छान्नुहोस्'); return;
    }
    saveMutation.mutate(editing);
  };

  const toggleArrayItem = (field: keyof Expert, value: string) => {
    if (!editing) return;
    const arr = (editing[field] as string[] | null) || [];
    const updated = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
    setEditing({ ...editing, [field]: updated });
  };

  const activeCount = experts?.filter(e => e.is_active).length || 0;
  const totalCases = experts?.reduce((sum, e) => sum + (e.open_cases_count || 0), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-primary" />
              कृषि विज्ञ व्यवस्थापन
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              सक्रिय: {activeCount} · कुल: {experts?.length || 0} · खुला केस: {totalCases}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openEdit()} className="gap-2">
                <Plus className="h-4 w-4" />
                नयाँ कृषिविज्ञ थप्नुहोस्
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing?.id ? 'कृषिविज्ञ सम्पादन' : 'नयाँ कृषिविज्ञ थप्नुहोस्'}</DialogTitle>
              </DialogHeader>

              {editing && (
                <div className="space-y-6 py-4">
                  {/* Section 1: Basic */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">१</span>
                      आधारभूत जानकारी
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>नाम (English) *</Label>
                        <Input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                      </div>
                      <div>
                        <Label>नाम (नेपाली)</Label>
                        <Input value={editing.name_ne || ''} onChange={e => setEditing({ ...editing, name_ne: e.target.value })} />
                      </div>
                      <div>
                        <Label>पद / Role *</Label>
                        <Input value={editing.designation || ''} onChange={e => setEditing({ ...editing, designation: e.target.value })} />
                      </div>
                      <div>
                        <Label>फोन नम्बर *</Label>
                        <Input value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} placeholder="+977-98..." />
                      </div>
                      <div>
                        <Label>इमेल</Label>
                        <Input type="email" value={editing.email || ''} onChange={e => setEditing({ ...editing, email: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Location */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">२</span>
                      स्थान र सेवा क्षेत्र
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>प्रदेश *</Label>
                        <Select value={editing.province || ''} onValueChange={v => setEditing({ ...editing, province: v })}>
                          <SelectTrigger><SelectValue placeholder="प्रदेश छान्नुहोस्" /></SelectTrigger>
                          <SelectContent>
                            {PROVINCES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>जिल्ला *</Label>
                        <Input value={editing.district || ''} onChange={e => setEditing({ ...editing, district: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <Label>कार्यालय / संस्था</Label>
                        <Input value={editing.office_name_ne || ''} onChange={e => setEditing({ ...editing, office_name_ne: e.target.value })} placeholder="कृषि ज्ञान केन्द्र, ..." />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Expertise */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">३</span>
                      विशेषज्ञता र भाषा
                    </h3>
                    <div>
                      <Label className="mb-2 block">विशेषज्ञता क्षेत्र *</Label>
                      <div className="flex flex-wrap gap-2">
                        {EXPERTISE_OPTIONS.map(area => {
                          const selected = editing.expertise_areas?.includes(area);
                          return (
                            <button
                              key={area}
                              type="button"
                              onClick={() => toggleArrayItem('expertise_areas', area)}
                              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-foreground border-border/40 hover:border-primary/40'}`}
                            >
                              {area}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <Label>अनुभव (वर्ष)</Label>
                        <Input type="number" min={0} value={editing.years_of_experience ?? ''} onChange={e => setEditing({ ...editing, years_of_experience: parseInt(e.target.value) || null })} />
                      </div>
                      <div>
                        <Label>भाषा</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {LANGUAGE_OPTIONS.map(lang => {
                            const selected = editing.preferred_languages?.includes(lang);
                            return (
                              <button
                                key={lang}
                                type="button"
                                onClick={() => toggleArrayItem('preferred_languages', lang)}
                                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${selected ? 'bg-primary/15 text-primary border-primary/30' : 'bg-muted/30 text-muted-foreground border-border/30'}`}
                              >
                                {lang}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Routing */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">४</span>
                      प्रणाली सेटिङ
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Switch checked={editing.is_active ?? true} onCheckedChange={c => setEditing({ ...editing, is_active: c })} />
                        <Label>सक्रिय (Active)</Label>
                      </div>
                      <div>
                        <Label>बढीमा खुला केस</Label>
                        <Input type="number" min={1} value={editing.max_open_cases ?? 50} onChange={e => setEditing({ ...editing, max_open_cases: parseInt(e.target.value) || 50 })} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label className="mb-2 block">प्राथमिकता</Label>
                      <div className="flex gap-3">
                        {['NORMAL', 'URGENT'].map(pt => {
                          const selected = editing.priority_types?.includes(pt);
                          return (
                            <label key={pt} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox checked={selected} onCheckedChange={() => toggleArrayItem('priority_types', pt)} />
                              <span className="text-sm">{pt === 'NORMAL' ? 'सामान्य' : 'अत्यावश्यक'}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label className="mb-2 block">Channel Access</Label>
                      <div className="flex flex-wrap gap-3">
                        {CHANNEL_OPTIONS.map(ch => {
                          const selected = editing.channel_access?.includes(ch.value);
                          return (
                            <label key={ch.value} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox checked={selected} onCheckedChange={() => toggleArrayItem('channel_access', ch.value)} />
                              <span className="text-sm">{ch.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Permission */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">५</span>
                      अनुमति
                    </h3>
                    <Select value={editing.permission_level || 'expert'} onValueChange={v => setEditing({ ...editing, permission_level: v })}>
                      <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PERMISSION_LEVELS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Routing explanation */}
                  <div className="p-3 bg-muted/40 rounded-lg border border-border/30 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">📋 Routing कसरी काम गर्छ:</p>
                    <p>केस आउँदा — जिल्ला मिलाएर → विशेषज्ञता मिलाएर → Active र capacity भएको विज्ञलाई पठाइन्छ।</p>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>रद्द गर्नुहोस्</Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'सुरक्षित गर्दै...' : 'कृषिविज्ञ सुरक्षित गर्नुहोस्'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="नाम, फोन, जिल्ला, विशेषज्ञता..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-36"><Filter className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">सबै</SelectItem>
              <SelectItem value="active">सक्रिय</SelectItem>
              <SelectItem value="inactive">निष्क्रिय</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterProvince} onValueChange={setFilterProvince}>
            <SelectTrigger className="w-44"><SelectValue placeholder="प्रदेश" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">सबै प्रदेश</SelectItem>
              {PROVINCES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>कृषिविज्ञ</TableHead>
                  <TableHead className="hidden md:table-cell">पद</TableHead>
                  <TableHead>प्रदेश / जिल्ला</TableHead>
                  <TableHead className="hidden lg:table-cell">विशेषज्ञता</TableHead>
                  <TableHead>स्थिति</TableHead>
                  <TableHead className="hidden md:table-cell">खुला केस</TableHead>
                  <TableHead className="hidden lg:table-cell">Channels</TableHead>
                  <TableHead>कार्य</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">कुनै कृषिविज्ञ फेला परेन</TableCell>
                  </TableRow>
                ) : filtered.map(expert => (
                  <TableRow key={expert.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {(expert.name_ne || expert.name).charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{expert.name_ne || expert.name}</p>
                          {expert.phone && <p className="text-xs text-muted-foreground">{expert.phone}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{expert.designation_ne || expert.designation}</TableCell>
                    <TableCell>
                      <p className="text-sm">{PROVINCES.find(p => p.value === expert.province)?.label || expert.province}</p>
                      <p className="text-xs text-muted-foreground">{expert.district}</p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(expert.expertise_areas || expert.specializations || []).slice(0, 3).map((area, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-1.5">{area}</Badge>
                        ))}
                        {((expert.expertise_areas || expert.specializations || []).length > 3) && (
                          <Badge variant="outline" className="text-[10px] px-1.5">+{(expert.expertise_areas || expert.specializations || []).length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={expert.is_active ? 'default' : 'secondary'} className={`text-xs ${expert.is_active ? 'bg-success/15 text-success border-success/20' : ''}`}>
                        {expert.is_active ? 'सक्रिय' : 'निष्क्रिय'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-center">
                      {expert.open_cases_count || 0} / {expert.max_open_cases || 50}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex gap-1">
                        {(expert.channel_access || ['APP']).map(ch => (
                          <Badge key={ch} variant="outline" className="text-[10px] px-1">{ch}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(expert)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleActiveMutation.mutate({ id: expert.id, is_active: !expert.is_active })}
                        >
                          {expert.is_active ? <UserX className="h-3.5 w-3.5 text-destructive" /> : <UserCheck className="h-3.5 w-3.5 text-success" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
