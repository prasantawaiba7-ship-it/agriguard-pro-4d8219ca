import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Users, TrendingUp, DollarSign, RefreshCw, Loader2, RotateCcw, Edit, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SubscriptionData {
  id: string;
  user_id: string;
  plan: 'free' | 'monthly' | 'yearly';
  status: 'active' | 'expired' | 'cancelled';
  queries_used: number;
  queries_limit: number;
  current_period_end: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

interface SubscriptionStats {
  totalSubscribers: number;
  monthlySubscribers: number;
  yearlySubscribers: number;
  freeUsers: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
}

export const SubscriptionAnalytics = () => {
  const { plans } = useSubscription();
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({
    totalSubscribers: 0,
    monthlySubscribers: 0,
    yearlySubscribers: 0,
    freeUsers: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Edit dialog state
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    subscription: SubscriptionData | null;
  }>({ open: false, subscription: null });
  const [editPlan, setEditPlan] = useState<'free' | 'monthly' | 'yearly'>('free');
  const [editStatus, setEditStatus] = useState<'active' | 'expired' | 'cancelled'>('active');

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data: subs, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: profiles } = await supabase
        .from('farmer_profiles')
        .select('user_id, full_name');

      const subsWithNames = (subs || []).map(sub => ({
        ...sub,
        user_name: profiles?.find(p => p.user_id === sub.user_id)?.full_name || 'Unknown'
      }));

      setSubscriptions(subsWithNames);

      const monthly = subsWithNames.filter(s => s.plan === 'monthly' && s.status === 'active');
      const yearly = subsWithNames.filter(s => s.plan === 'yearly' && s.status === 'active');
      const free = subsWithNames.filter(s => s.plan === 'free');

      // Get prices from plans array
      const monthlyPrice = plans.find(p => p.plan_type === 'monthly')?.price || 99;
      const yearlyPrice = plans.find(p => p.plan_type === 'yearly')?.price || 999;

      setStats({
        totalSubscribers: monthly.length + yearly.length,
        monthlySubscribers: monthly.length,
        yearlySubscribers: yearly.length,
        freeUsers: free.length,
        monthlyRevenue: monthly.length * monthlyPrice,
        yearlyRevenue: yearly.length * yearlyPrice
      });
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleResetQueries = async (userId: string, userName: string) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ queries_used: 0 })
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success(`Reset query count for ${userName}`);
      fetchSubscriptions();
    } catch (err) {
      console.error('Failed to reset queries:', err);
      toast.error('Failed to reset query count');
    } finally {
      setUpdating(null);
    }
  };

  const handleOpenEditDialog = (sub: SubscriptionData) => {
    setEditPlan(sub.plan);
    setEditStatus(sub.status);
    setEditDialog({ open: true, subscription: sub });
  };

  const handleUpdateSubscription = async () => {
    if (!editDialog.subscription) return;
    
    const sub = editDialog.subscription;
    setUpdating(sub.user_id);
    
    try {
      const updateData: any = {
        plan: editPlan,
        status: editStatus,
        updated_at: new Date().toISOString()
      };

      // If upgrading to paid plan, set unlimited queries
      if (editPlan !== 'free') {
        updateData.queries_limit = 999999;
        // Set period end to 30 days (monthly) or 365 days (yearly) from now
        const days = editPlan === 'monthly' ? 30 : 365;
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + days);
        updateData.current_period_end = periodEnd.toISOString();
        updateData.current_period_start = new Date().toISOString();
      } else {
        // Free plan defaults
        updateData.queries_limit = 3;
        updateData.current_period_end = null;
        updateData.current_period_start = null;
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('user_id', sub.user_id);

      if (error) throw error;

      toast.success(`Updated subscription for ${sub.user_name}`);
      setEditDialog({ open: false, subscription: null });
      fetchSubscriptions();
    } catch (err) {
      console.error('Failed to update subscription:', err);
      toast.error('Failed to update subscription');
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

      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          plan,
          status: 'active',
          queries_limit: 999999,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(`Upgraded ${userName} to ${plan} plan`);
      fetchSubscriptions();
    } catch (err) {
      console.error('Failed to upgrade subscription:', err);
      toast.error('Failed to upgrade subscription');
    } finally {
      setUpdating(null);
    }
  };

  const handleCancelSubscription = async (userId: string, userName: string) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          plan: 'free',
          status: 'cancelled',
          queries_limit: 3,
          current_period_end: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(`Cancelled subscription for ${userName}`);
      fetchSubscriptions();
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      toast.error('Failed to cancel subscription');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'monthly':
        return <Badge className="bg-amber-500">Monthly</Badge>;
      case 'yearly':
        return <Badge className="bg-purple-500">Yearly</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSubscribers}</p>
                <p className="text-sm text-muted-foreground">Premium Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.monthlySubscribers}</p>
                <p className="text-sm text-muted-foreground">Monthly Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.yearlySubscribers}</p>
                <p className="text-sm text-muted-foreground">Yearly Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">रु. {stats.monthlyRevenue + stats.yearlyRevenue}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscribers</span>
                <span className="font-medium">{stats.monthlySubscribers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-medium">रु. {plans.find(p => p.plan_type === 'monthly')?.price || 99}/month</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Monthly Total</span>
                <span className="font-bold text-primary">रु. {stats.monthlyRevenue}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Yearly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscribers</span>
                <span className="font-medium">{stats.yearlySubscribers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-medium">रु. {plans.find(p => p.plan_type === 'yearly')?.price || 999}/year</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Yearly Total</span>
                <span className="font-bold text-primary">रु. {stats.yearlyRevenue}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                All Subscriptions
              </CardTitle>
              <CardDescription>Manage user subscriptions, update plans, and reset query counts</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSubscriptions} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Crown className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No subscriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Queries Used</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {sub.user_name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <span className="font-medium">{sub.user_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={sub.queries_used >= sub.queries_limit && sub.plan === 'free' ? 'text-destructive' : ''}>
                            {sub.queries_used} / {sub.plan === 'free' ? sub.queries_limit : '∞'}
                          </span>
                          {sub.plan === 'free' && sub.queries_used > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleResetQueries(sub.user_id, sub.user_name || 'User')}
                              disabled={updating === sub.user_id}
                            >
                              {updating === sub.user_id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sub.current_period_end 
                          ? format(new Date(sub.current_period_end), 'MMM d, yyyy')
                          : '—'
                        }
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
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(sub)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Subscription
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleResetQueries(sub.user_id, sub.user_name || 'User')}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reset Query Count
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {sub.plan === 'free' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleQuickUpgrade(sub.user_id, sub.user_name || 'User', 'monthly')}
                                >
                                  <Crown className="h-4 w-4 mr-2 text-amber-500" />
                                  Upgrade to Monthly
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleQuickUpgrade(sub.user_id, sub.user_name || 'User', 'yearly')}
                                >
                                  <Crown className="h-4 w-4 mr-2 text-purple-500" />
                                  Upgrade to Yearly
                                </DropdownMenuItem>
                              </>
                            )}
                            {sub.plan !== 'free' && (
                              <DropdownMenuItem 
                                onClick={() => handleCancelSubscription(sub.user_id, sub.user_name || 'User')}
                                className="text-destructive"
                              >
                                <Crown className="h-4 w-4 mr-2" />
                                Cancel Subscription
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Subscription Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, subscription: open ? editDialog.subscription : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update subscription for {editDialog.subscription?.user_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan</label>
              <Select value={editPlan} onValueChange={(v) => setEditPlan(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (3 queries)</SelectItem>
                  <SelectItem value="monthly">Monthly (रु. 99/month)</SelectItem>
                  <SelectItem value="yearly">Yearly (रु. 999/year)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editPlan !== 'free' && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="text-muted-foreground">
                  Setting a paid plan will grant unlimited queries and set the subscription period to{' '}
                  {editPlan === 'monthly' ? '30 days' : '365 days'} from now.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, subscription: null })}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubscription} disabled={updating !== null}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
