import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, RefreshCw, Loader2, Ban, CheckCircle, Edit, RotateCcw, Crown, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FarmerProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  state: string | null;
  district: string | null;
  village: string | null;
  created_at: string;
  role?: string;
  is_blocked?: boolean;
}

interface UserSubscription {
  user_id: string;
  plan: string;
  status: string;
  queries_used: number;
  queries_limit: number;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<FarmerProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, UserSubscription>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<{ open: boolean; user: FarmerProfile | null }>({ open: false, user: null });
  const [editQueries, setEditQueries] = useState({ used: 0, limit: 3 });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('farmer_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch roles for all users
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Fetch subscriptions
      const { data: subs } = await supabase
        .from('user_subscriptions')
        .select('*');

      const subsMap: Record<string, UserSubscription> = {};
      subs?.forEach(sub => {
        subsMap[sub.user_id] = sub;
      });
      setSubscriptions(subsMap);

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.user_id)?.role || 'farmer',
        is_blocked: false // We'll add a blocked field later if needed
      })) || [];

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAssignRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        await supabase
          .from('user_roles')
          .update({ role: newRole as any })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole as any });
      }

      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
      toast.error("Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  const handleResetQueries = async (userId: string, userName: string) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ queries_used: 0 })
        .eq('user_id', userId);

      if (error) throw error;
      toast.success(`Reset query count for ${userName}`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to reset queries:', err);
      toast.error("Failed to reset query count");
    } finally {
      setUpdating(null);
    }
  };

  const handleSetFreeUses = async (userId: string, limit: number) => {
    setUpdating(userId);
    try {
      // Check if subscription exists
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({ queries_limit: limit })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_subscriptions')
          .insert({ user_id: userId, plan: 'free', queries_limit: limit, queries_used: 0 });
        if (error) throw error;
      }

      toast.success(`Set free uses limit to ${limit}`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to set free uses:', err);
      toast.error("Failed to update free uses");
    } finally {
      setUpdating(null);
    }
  };

  const handleOpenEditDialog = (user: FarmerProfile) => {
    const sub = subscriptions[user.user_id];
    setEditQueries({
      used: sub?.queries_used || 0,
      limit: sub?.queries_limit || 3
    });
    setEditDialog({ open: true, user });
  };

  const handleSaveUserSettings = async () => {
    if (!editDialog.user) return;
    
    const userId = editDialog.user.user_id;
    setUpdating(userId);
    
    try {
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({ 
            queries_used: editQueries.used, 
            queries_limit: editQueries.limit 
          })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_subscriptions')
          .insert({ 
            user_id: userId, 
            plan: 'free', 
            queries_limit: editQueries.limit, 
            queries_used: editQueries.used 
          });
        if (error) throw error;
      }

      toast.success('User settings updated');
      setEditDialog({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      console.error('Failed to update user settings:', err);
      toast.error('Failed to update settings');
    } finally {
      setUpdating(null);
    }
  };

  const handleQuickUpgrade = async (userId: string, userName: string, plan: 'monthly' | 'yearly') => {
    setUpdating(userId);
    try {
      const days = plan === 'monthly' ? 30 : 365;
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + days);

      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single();

      const updateData = {
        plan: plan as 'monthly' | 'yearly',
        status: 'active' as const,
        queries_limit: 999999,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString()
      };

      if (existing) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update(updateData)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_subscriptions')
          .insert({ 
            user_id: userId, 
            plan: plan as 'monthly' | 'yearly',
            status: 'active' as const,
            queries_limit: 999999,
            queries_used: 0,
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString()
          });
        if (error) throw error;
      }

      toast.success(`Upgraded ${userName} to ${plan} plan`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to upgrade subscription:', err);
      toast.error('Failed to upgrade subscription');
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery) ||
    user.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.district?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-purple-500">Admin</Badge>;
      case 'authority': return <Badge className="bg-blue-500">Authority</Badge>;
      case 'field_official': return <Badge className="bg-amber-500">Field Official</Badge>;
      default: return <Badge variant="secondary">Farmer</Badge>;
    }
  };

  const getPlanBadge = (plan?: string) => {
    switch (plan) {
      case 'monthly': return <Badge className="bg-amber-500">Monthly</Badge>;
      case 'yearly': return <Badge className="bg-purple-500">Yearly</Badge>;
      default: return <Badge variant="outline">Free</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>Manage farmers, roles, and subscription limits</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchUsers}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Queries</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const sub = subscriptions[user.user_id];
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {user.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">{user.full_name}</span>
                              {user.phone && (
                                <p className="text-xs text-muted-foreground">{user.phone}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {[user.village, user.district, user.state].filter(Boolean).join(', ') || 
                              <span className="text-muted-foreground">Not set</span>
                            }
                          </span>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role || 'farmer')}</TableCell>
                        <TableCell>{getPlanBadge(sub?.plan)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className={sub?.queries_used >= (sub?.queries_limit || 3) && sub?.plan === 'free' ? 'text-destructive font-medium' : ''}>
                              {sub?.queries_used || 0} / {sub?.plan === 'free' ? (sub?.queries_limit || 3) : '∞'}
                            </span>
                            {sub?.plan === 'free' && (sub?.queries_used || 0) > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleResetQueries(user.user_id, user.full_name)}
                                disabled={updating === user.user_id}
                              >
                                {updating === user.user_id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User Settings
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetQueries(user.user_id, user.full_name)}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset Query Count
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleAssignRole(user.user_id, 'farmer')}>
                                Set as Farmer
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAssignRole(user.user_id, 'field_official')}>
                                Set as Field Official
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAssignRole(user.user_id, 'authority')}>
                                Set as Authority
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAssignRole(user.user_id, 'admin')}>
                                Set as Admin
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Quick Upgrade</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleQuickUpgrade(user.user_id, user.full_name, 'monthly')}>
                                <Crown className="h-4 w-4 mr-2 text-amber-500" />
                                Upgrade to Monthly
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickUpgrade(user.user_id, user.full_name, 'yearly')}>
                                <Crown className="h-4 w-4 mr-2 text-purple-500" />
                                Upgrade to Yearly
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Settings</DialogTitle>
            <DialogDescription>
              Modify subscription limits for {editDialog.user?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Queries Used</Label>
                <Input
                  type="number"
                  min={0}
                  value={editQueries.used}
                  onChange={(e) => setEditQueries({ ...editQueries, used: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Queries Limit (Free Plan)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editQueries.limit}
                  onChange={(e) => setEditQueries({ ...editQueries, limit: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                <strong>Free plan:</strong> User can make {editQueries.limit} AI queries.
                Currently used: {editQueries.used}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Set limit to a high number (e.g., 999999) for effectively unlimited queries.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setEditQueries({ ...editQueries, limit: 3 })}
              >
                Default (3)
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setEditQueries({ ...editQueries, limit: 10 })}
              >
                Extended (10)
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setEditQueries({ ...editQueries, limit: 999999 })}
              >
                Unlimited
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button onClick={handleSaveUserSettings} disabled={updating !== null}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
