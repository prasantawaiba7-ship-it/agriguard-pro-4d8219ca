// =============================================
// Admin UI to manage technicians and map user_id
// To disable: remove this component and its tab from AdminDashboard.tsx
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
import { Users, Plus, Pencil, Link2, Link2Off, Search } from 'lucide-react';
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

interface AuthUser {
  id: string;
  email: string;
}

export function TechnicianManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingTech, setEditingTech] = useState<TechnicianRow | null>(null);
  const [linkingTechId, setLinkingTechId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userSearch, setUserSearch] = useState('');

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

  // Fetch auth users for linking (using farmer_profiles as proxy)
  const { data: authUsers } = useQuery({
    queryKey: ['admin-auth-users-for-linking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farmer_profiles')
        .select('user_id, full_name')
        .order('full_name');
      if (error) throw error;
      return (data || []).map(p => ({
        id: p.user_id,
        label: `${p.full_name || 'No name'} – ${p.user_id.slice(0, 6)}…`,
      }));
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

  // Link user_id mutation
  const linkMutation = useMutation({
    mutationFn: async ({ techId, userId }: { techId: string; userId: string | null }) => {
      const { error } = await (supabase as any)
        .from('technicians')
        .update({ user_id: userId })
        .eq('id', techId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-technicians'] });
      toast.success('User linked successfully ✅');
      setLinkingTechId(null);
      setSelectedUserId('');
      setUserSearch('');
    },
    onError: () => toast.error('Failed to link user'),
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

  const unmappedCount = technicians?.filter(t => !t.user_id && t.is_active).length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Krishi Bigya (Technicians)
            {unmappedCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground animate-pulse">
                {unmappedCount} unmapped
              </Badge>
            )}
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
                  <TableHead>Name</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead>Auth Link</TableHead>
                  <TableHead>Expert</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(tech => (
                  <TableRow key={tech.id} className={!tech.user_id && tech.is_active ? 'bg-amber-50 dark:bg-amber-900/10' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{tech.name}</p>
                        <p className="text-xs text-muted-foreground">{tech.role_title}</p>
                        {tech.email && <p className="text-xs text-muted-foreground">{tech.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{tech.office?.name || '—'}</TableCell>
                    <TableCell>
                      {tech.user_id ? (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                          <Link2 className="w-3 h-3 mr-1" /> Linked
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                          <Link2Off className="w-3 h-3 mr-1" /> Not linked
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
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setLinkingTechId(tech.id)}>
                          <Link2 className="w-3 h-3 mr-1" /> {tech.user_id ? 'Re-link' : 'Link User'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingTech(tech)}>
                          <Pencil className="w-3 h-3" />
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

      {/* Link User Dialog */}
      {(() => {
        const linkingTech = technicians?.find(t => t.id === linkingTechId);
        return (
          <Dialog open={!!linkingTechId} onOpenChange={open => !open && setLinkingTechId(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary" />
                  Technician ↔ User Link
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Show technician's own info for cross-checking */}
                {linkingTech && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                    <p className="text-sm font-semibold">Technician: {linkingTech.name}</p>
                    <p className="text-xs text-muted-foreground">📧 Email: {linkingTech.email || '—'}</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  यो प्राविधिकलाई कुन Kishan Sathi account सँग link गर्ने हो?
                </p>

                {/* Search to filter users by name */}
                <div>
                  <Label>Search users (name)</Label>
                  <Input
                    placeholder="Search name..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="mb-2"
                  />
                </div>

                {/* Select from registered users */}
                <div>
                  <Label>Select from registered users</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger><SelectValue placeholder="Choose a user..." /></SelectTrigger>
                    <SelectContent>
                      {(userSearch
                        ? authUsers?.filter(u => u.label.toLowerCase().includes(userSearch.toLowerCase()))
                        : authUsers
                      )?.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Or paste user_id directly */}
                <div>
                  <Label>Or paste User ID directly</Label>
                  <Input
                    placeholder="e.g. 52f17d40-646f-4bcd-bc16-ab78c933ba11"
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={!selectedUserId || linkMutation.isPending}
                    onClick={() => linkingTechId && linkMutation.mutate({ techId: linkingTechId, userId: selectedUserId })}
                  >
                    Link User
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={linkMutation.isPending}
                    onClick={() => linkingTechId && linkMutation.mutate({ techId: linkingTechId, userId: null })}
                  >
                    Unlink
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

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
                  <Label>Email</Label>
                  <Input value={editingTech.email || ''} onChange={e => setEditingTech({ ...editingTech, email: e.target.value || null })} />
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
