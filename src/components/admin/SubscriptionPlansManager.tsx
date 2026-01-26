import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Plus, Edit, Trash2, Loader2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionPlan {
  id: string;
  name: string;
  name_ne: string | null;
  description: string | null;
  description_ne: string | null;
  plan_type: string;
  price: number;
  currency: string;
  esewa_product_code: string | null;
  ai_call_limit: number | null;
  pdf_report_limit: number | null;
  features: string[];
  is_visible: boolean;
  is_active: boolean;
  display_order: number;
}

const defaultPlan: Partial<SubscriptionPlan> = {
  name: '',
  name_ne: '',
  description: '',
  description_ne: '',
  plan_type: '',
  price: 0,
  currency: 'NPR',
  esewa_product_code: '',
  ai_call_limit: null,
  pdf_report_limit: null,
  features: [],
  is_visible: true,
  is_active: true,
  display_order: 0
};

export const SubscriptionPlansManager = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; plan: Partial<SubscriptionPlan> | null; isNew: boolean }>({
    open: false,
    plan: null,
    isNew: false
  });
  const [featuresText, setFeaturesText] = useState('');

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      const parsedPlans = (data || []).map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : JSON.parse(String(p.features) || '[]')
      }));
      
      setPlans(parsedPlans);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenEdit = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditDialog({ open: true, plan: { ...plan }, isNew: false });
      setFeaturesText(plan.features.join('\n'));
    } else {
      setEditDialog({ open: true, plan: { ...defaultPlan }, isNew: true });
      setFeaturesText('');
    }
  };

  const handleSave = async () => {
    if (!editDialog.plan) return;
    
    const plan = editDialog.plan;
    if (!plan.name || !plan.plan_type) {
      toast.error('Name and Plan Type are required');
      return;
    }

    setSaving(true);
    try {
      const planData = {
        name: plan.name,
        name_ne: plan.name_ne || null,
        description: plan.description || null,
        description_ne: plan.description_ne || null,
        plan_type: plan.plan_type,
        price: plan.price || 0,
        currency: plan.currency || 'NPR',
        esewa_product_code: plan.esewa_product_code || null,
        ai_call_limit: plan.ai_call_limit,
        pdf_report_limit: plan.pdf_report_limit,
        features: featuresText.split('\n').filter(f => f.trim()),
        is_visible: plan.is_visible ?? true,
        is_active: plan.is_active ?? true,
        display_order: plan.display_order || 0
      };

      if (editDialog.isNew) {
        const { error } = await supabase
          .from('subscription_plans')
          .insert([planData]);
        if (error) throw error;
        toast.success('Plan created successfully');
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', plan.id);
        if (error) throw error;
        toast.success('Plan updated successfully');
      }

      setEditDialog({ open: false, plan: null, isNew: false });
      fetchPlans();
    } catch (err) {
      console.error('Failed to save plan:', err);
      toast.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (plan: SubscriptionPlan) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_visible: !plan.is_visible })
        .eq('id', plan.id);

      if (error) throw error;
      toast.success(`Plan ${plan.is_visible ? 'hidden' : 'shown'}`);
      fetchPlans();
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
      toast.error('Failed to update plan');
    }
  };

  const handleDeactivate = async (plan: SubscriptionPlan) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: false, is_visible: false })
        .eq('id', plan.id);

      if (error) throw error;
      toast.success('Plan deactivated');
      fetchPlans();
    } catch (err) {
      console.error('Failed to deactivate plan:', err);
      toast.error('Failed to deactivate plan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Plans</h2>
          <p className="text-muted-foreground">Configure pricing plans and features</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPlans}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => handleOpenEdit()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            All Plans
          </CardTitle>
          <CardDescription>Manage subscription plans shown to farmers</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id} className={!plan.is_active ? 'opacity-50' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        {plan.name_ne && <p className="text-sm text-muted-foreground">{plan.name_ne}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{plan.plan_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {plan.price > 0 ? (
                        <span className="font-medium">{plan.currency} {plan.price}</span>
                      ) : (
                        <span className="text-muted-foreground">Free</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>AI: {plan.ai_call_limit ?? '∞'}</p>
                        <p>PDF: {plan.pdf_report_limit ?? '∞'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {plan.is_active ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {plan.is_visible ? (
                          <Badge variant="outline" className="border-blue-500 text-blue-500">Visible</Badge>
                        ) : (
                          <Badge variant="outline">Hidden</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(plan)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToggleVisibility(plan)}>
                          {plan.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        {plan.is_active && (
                          <Button variant="ghost" size="icon" onClick={() => handleDeactivate(plan)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog.isNew ? 'Create New Plan' : 'Edit Plan'}</DialogTitle>
            <DialogDescription>Configure subscription plan details</DialogDescription>
          </DialogHeader>

          {editDialog.plan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Plan Name (English)</Label>
                  <Input
                    value={editDialog.plan.name || ''}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      plan: { ...editDialog.plan!, name: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Plan Name (Nepali)</Label>
                  <Input
                    value={editDialog.plan.name_ne || ''}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      plan: { ...editDialog.plan!, name_ne: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Description (English)</Label>
                  <Textarea
                    value={editDialog.plan.description || ''}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      plan: { ...editDialog.plan!, description: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Description (Nepali)</Label>
                  <Textarea
                    value={editDialog.plan.description_ne || ''}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      plan: { ...editDialog.plan!, description_ne: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Plan Type (unique key)</Label>
                  <Input
                    value={editDialog.plan.plan_type || ''}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      plan: { ...editDialog.plan!, plan_type: e.target.value }
                    })}
                    placeholder="e.g., free, monthly, yearly"
                    disabled={!editDialog.isNew}
                  />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={editDialog.plan.price || 0}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      plan: { ...editDialog.plan!, price: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input
                    value={editDialog.plan.currency || 'NPR'}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      plan: { ...editDialog.plan!, currency: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>eSewa Product Code</Label>
                  <Input
                    value={editDialog.plan.esewa_product_code || ''}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      plan: { ...editDialog.plan!, esewa_product_code: e.target.value }
                    })}
                    placeholder="EPAYTEST (for testing)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>AI Call Limit (empty = unlimited)</Label>
                  <Input
                    type="number"
                    value={editDialog.plan.ai_call_limit ?? ''}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      plan: { ...editDialog.plan!, ai_call_limit: e.target.value ? Number(e.target.value) : null }
                    })}
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <Label>PDF Report Limit (empty = unlimited)</Label>
                  <Input
                    type="number"
                    value={editDialog.plan.pdf_report_limit ?? ''}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      plan: { ...editDialog.plan!, pdf_report_limit: e.target.value ? Number(e.target.value) : null }
                    })}
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={editDialog.plan.display_order || 0}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      plan: { ...editDialog.plan!, display_order: Number(e.target.value) }
                    })}
                  />
                </div>
              </div>

              <div>
                <Label>Features (one per line)</Label>
                <Textarea
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Unlimited AI queries&#10;Disease detection&#10;Priority support"
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editDialog.plan.is_visible ?? true}
                    onCheckedChange={(checked) => setEditDialog({
                      ...editDialog,
                      plan: { ...editDialog.plan!, is_visible: checked }
                    })}
                  />
                  <Label>Visible to users</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editDialog.plan.is_active ?? true}
                    onCheckedChange={(checked) => setEditDialog({
                      ...editDialog,
                      plan: { ...editDialog.plan!, is_active: checked }
                    })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, plan: null, isNew: false })}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editDialog.isNew ? 'Create Plan' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
