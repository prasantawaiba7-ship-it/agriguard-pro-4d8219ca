import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { GuideSection, SECTION_LABELS } from '@/hooks/useCropGuides';

interface CropGuide {
  id: string;
  crop_name: string;
  section: GuideSection;
  title: string;
  title_ne: string | null;
  content: string;
  content_ne: string | null;
  display_order: number;
  is_active: boolean;
}

const SECTIONS = Object.keys(SECTION_LABELS) as GuideSection[];

export function CropGuidesManager() {
  const { toast } = useToast();
  const [guides, setGuides] = useState<CropGuide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<CropGuide | null>(null);
  const [formData, setFormData] = useState({
    crop_name: '',
    section: 'introduction' as GuideSection,
    title: '',
    title_ne: '',
    content: '',
    content_ne: '',
    display_order: 0,
    is_active: true,
  });

  const fetchGuides = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('crop_guides')
      .select('*')
      .order('crop_name')
      .order('display_order');

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch guides', variant: 'destructive' });
    } else {
      setGuides((data as CropGuide[]) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const handleOpenDialog = (guide?: CropGuide) => {
    if (guide) {
      setEditingGuide(guide);
      setFormData({
        crop_name: guide.crop_name,
        section: guide.section,
        title: guide.title,
        title_ne: guide.title_ne || '',
        content: guide.content,
        content_ne: guide.content_ne || '',
        display_order: guide.display_order,
        is_active: guide.is_active,
      });
    } else {
      setEditingGuide(null);
      setFormData({
        crop_name: '',
        section: 'introduction',
        title: '',
        title_ne: '',
        content: '',
        content_ne: '',
        display_order: 0,
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.crop_name || !formData.title || !formData.content) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    if (editingGuide) {
      const { error } = await supabase
        .from('crop_guides')
        .update({
          crop_name: formData.crop_name,
          section: formData.section,
          title: formData.title,
          title_ne: formData.title_ne || null,
          content: formData.content,
          content_ne: formData.content_ne || null,
          display_order: formData.display_order,
          is_active: formData.is_active,
        })
        .eq('id', editingGuide.id);

      if (error) {
        toast({ title: 'Error', description: 'Failed to update guide', variant: 'destructive' });
      } else {
        toast({ title: 'Updated!', description: 'Guide updated successfully' });
        setIsDialogOpen(false);
        fetchGuides();
      }
    } else {
      const { error } = await supabase
        .from('crop_guides')
        .insert({
          crop_name: formData.crop_name,
          section: formData.section,
          title: formData.title,
          title_ne: formData.title_ne || null,
          content: formData.content,
          content_ne: formData.content_ne || null,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });

      if (error) {
        toast({ title: 'Error', description: 'Failed to create guide', variant: 'destructive' });
      } else {
        toast({ title: 'Created!', description: 'Guide created successfully' });
        setIsDialogOpen(false);
        fetchGuides();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this guide?')) return;

    const { error } = await supabase.from('crop_guides').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete guide', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted!', description: 'Guide deleted successfully' });
      fetchGuides();
    }
  };

  const handleToggleActive = async (guide: CropGuide) => {
    const { error } = await supabase
      .from('crop_guides')
      .update({ is_active: !guide.is_active })
      .eq('id', guide.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      fetchGuides();
    }
  };

  // Group by crop name
  const groupedGuides = guides.reduce((acc, guide) => {
    if (!acc[guide.crop_name]) {
      acc[guide.crop_name] = [];
    }
    acc[guide.crop_name].push(guide);
    return acc;
  }, {} as Record<string, CropGuide[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Crop Guides ({guides.length})
        </h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Guide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGuide ? 'Edit Guide' : 'Add New Guide'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Crop Name *</Label>
                  <Input
                    value={formData.crop_name}
                    onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                    placeholder="e.g., धान, गहुँ"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Section *</Label>
                  <Select 
                    value={formData.section} 
                    onValueChange={(v) => setFormData({ ...formData, section: v as GuideSection })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SECTION_LABELS[s].icon} {SECTION_LABELS[s].ne}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title (English) *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title (नेपाली)</Label>
                  <Input
                    value={formData.title_ne}
                    onChange={(e) => setFormData({ ...formData, title_ne: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content (English) *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Content (नेपाली)</Label>
                <Textarea
                  value={formData.content_ne}
                  onChange={(e) => setFormData({ ...formData, content_ne: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingGuide ? 'Update Guide' : 'Create Guide'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(groupedGuides).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No guides yet. Add your first guide!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedGuides).map(([cropName, cropGuides]) => (
            <Card key={cropName}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{cropName}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cropGuides.map((guide) => (
                      <TableRow key={guide.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {SECTION_LABELS[guide.section]?.icon} {SECTION_LABELS[guide.section]?.ne}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{guide.title}</p>
                            {guide.title_ne && <p className="text-sm text-muted-foreground">{guide.title_ne}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{guide.display_order}</TableCell>
                        <TableCell>
                          <Switch
                            checked={guide.is_active}
                            onCheckedChange={() => handleToggleActive(guide)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleOpenDialog(guide)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(guide.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
