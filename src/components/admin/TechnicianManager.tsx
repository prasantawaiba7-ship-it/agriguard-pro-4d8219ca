// =============================================
// Admin UI to manage technicians (CRUD only, no manual user linking)
// Auto-link happens via email match on login
// =============================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Plus, Pencil, Search, Link2, Link2Off, Info } from 'lucide-react';
import { toast } from 'sonner';

interface TechnicianRow {
  id: string;
  office_id: string;
  user_id: string | null;
  name: string;
  role_title: string;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  is_active: boolean;
  is_primary: boolean;
  is_expert: boolean;
  office?: { id: string; name: string; district: string } | null;
}

export function TechnicianManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingTech, setEditingTech] = useState<TechnicianRow | null>(null);

  // Fetch all technicians with office info
  const { data: technicians, isLoading } = useQuery({
    queryKey: ['admin-technicians'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('technicians')
        .select('*, office:ag_offices(id, name, district)')
        .order('name');
      if (error) throw error;
      return (data || []) as TechnicianRow[];
    },
  });

  // Fetch offices for the edit form
  const { data: offices } = useQuery({
    queryKey: ['admin-ag-offices-list'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ag_offices')
        .select('id, name, district')
        .order('name');
      if (error) throw error;
      return data as { id: string; name: string; district: string }[];
    },
  });

  // Save technician (create/update)
  const saveMutation = useMutation({
    mutationFn: async (tech: Partial<TechnicianRow>) => {
      if (tech.id) {
        const { office, ...rest } = tech as any;
        const { error } = await (supabase as any)
          .from('technicians')
          .update(rest)
          .eq('id', tech.id);
        if (error) throw error;
      } else {
        const { id, office, ...rest } = tech as any;
        const { error } = await (supabase as any)
          .from('technicians')
          .insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-technicians'] });
      toast.success('Technician saved ✅');
      setEditingTech(null);
    },
    onError: (e: any) => toast.error('Save failed: ' + e.message),
  });

  const filtered = technicians?.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return t.name.toLowerCase().includes(s) || t.email?.toLowerCase().includes(s) || t.office?.name?.toLowerCase().includes(s);
  }) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Krishi Bigya (Technicians)
          </CardTitle>
          <Button size="sm" onClick={() => setEditingTech({
            id: '',
            office_id: offices?.[0]?.id || '',
            user_id: null,
            name: '',
            role_title: 'Krishi Prabidhik',
            phone: null,
            email: null,
            specialization: null,
            is_active: true,
            is_primary: false,
            is_expert: false,
          })}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {/* Auto-link info banner */}
        <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2">
          <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Auto-Link:</strong> Bigya को सही email यहाँ सेट गर्नुहोस्। जब उनीहरूले त्यही email ले login गर्छन्, system ले आफैं account link गरिदिन्छ। Manual linking आवश्यक छैन।
          </p>
        </div>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, email, office..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / Email</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead>Auto-Link</TableHead>
                  <TableHead>Expert</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(tech => (
                  <TableRow key={tech.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{tech.name}</p>
                        <p className="text-xs text-muted-foreground">{tech.role_title}</p>
                        {tech.email && <p className="text-xs text-primary font-medium">📧 {tech.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{tech.office?.name || '—'}</TableCell>
                    <TableCell>
                      {tech.user_id ? (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
                          <Link2 className="w-3 h-3 mr-1" /> Linked ✓
                        </Badge>
                      ) : tech.email ? (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 dark:text-amber-300 dark:border-amber-700">
                          <Link2Off className="w-3 h-3 mr-1" /> Pending login
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                          No email set
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {tech.is_expert ? (
                        <Badge className="bg-primary text-primary-foreground text-xs">Expert ✓</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tech.is_active ? 'default' : 'secondary'}>
                        {tech.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setEditingTech(tech)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Technician Dialog */}
      <Dialog open={!!editingTech} onOpenChange={open => !open && setEditingTech(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTech?.id ? 'Edit Technician' : 'Add Technician'}</DialogTitle>
          </DialogHeader>
          {editingTech && (
            <div className="space-y-3">
              <div>
                <Label>Name *</Label>
                <Input value={editingTech.name} onChange={e => setEditingTech({ ...editingTech, name: e.target.value })} />
              </div>
              <div>
                <Label>Office *</Label>
                <Select value={editingTech.office_id} onValueChange={v => setEditingTech({ ...editingTech, office_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select office" /></SelectTrigger>
                  <SelectContent>
                    {offices?.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.name} ({o.district})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Phone</Label>
                  <Input value={editingTech.phone || ''} onChange={e => setEditingTech({ ...editingTech, phone: e.target.value || null })} />
                </div>
                <div>
                  <Label>Email (for auto-link) *</Label>
                  <Input 
                    value={editingTech.email || ''} 
                    onChange={e => setEditingTech({ ...editingTech, email: e.target.value || null })} 
                    placeholder="bigya@example.com"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    यही email ले login गर्दा auto-link हुन्छ
                  </p>
                </div>
              </div>
              <div>
                <Label>Role Title</Label>
                <Input value={editingTech.role_title} onChange={e => setEditingTech({ ...editingTech, role_title: e.target.value })} />
              </div>
              <div>
                <Label>Specialization</Label>
                <Input value={editingTech.specialization || ''} onChange={e => setEditingTech({ ...editingTech, specialization: e.target.value || null })} />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch checked={editingTech.is_active} onCheckedChange={v => setEditingTech({ ...editingTech, is_active: v })} />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editingTech.is_primary} onCheckedChange={v => setEditingTech({ ...editingTech, is_primary: v })} />
                  <Label>Primary</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editingTech.is_expert} onCheckedChange={v => setEditingTech({ ...editingTech, is_expert: v })} />
                  <Label className="text-primary font-semibold">Expert (विज्ञ)</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTech(null)}>Cancel</Button>
            <Button
              disabled={!editingTech?.name || !editingTech?.office_id || saveMutation.isPending}
              onClick={() => editingTech && saveMutation.mutate(editingTech)}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
