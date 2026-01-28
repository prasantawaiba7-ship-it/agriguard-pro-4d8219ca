import { useState } from 'react';
import { useCrops, Crop } from '@/hooks/useCrops';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, LeafyGreen, Eye, EyeOff } from 'lucide-react';

const CATEGORIES = [
  { value: 'vegetable', label: 'तरकारी' },
  { value: 'fruit', label: 'फलफूल' },
  { value: 'grain', label: 'अन्न' },
  { value: 'spice', label: 'मसला' },
  { value: 'legume', label: 'दाल' },
];

const UNITS = ['kg', 'piece', 'bundle', 'dozen', 'quintal'];

export function CropsManager() {
  const { crops, isLoading, addCrop, updateCrop, toggleCropActive, deleteCrop, refresh } = useCrops();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ne: '',
    category: 'vegetable',
    unit: 'kg',
    image_url: '',
    display_order: 0,
    is_active: true,
  });

  const filteredCrops = crops.filter(
    (c) =>
      c.name_ne.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name_en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (crop?: Crop) => {
    if (crop) {
      setEditingCrop(crop);
      setFormData({
        name_en: crop.name_en,
        name_ne: crop.name_ne,
        category: crop.category,
        unit: crop.unit,
        image_url: crop.image_url || '',
        display_order: crop.display_order,
        is_active: crop.is_active,
      });
    } else {
      setEditingCrop(null);
      setFormData({
        name_en: '',
        name_ne: '',
        category: 'vegetable',
        unit: 'kg',
        image_url: '',
        display_order: crops.length + 1,
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name_en.trim() || !formData.name_ne.trim()) {
      toast.error('नाम आवश्यक छ।');
      return;
    }

    const cropData = {
      ...formData,
      image_url: formData.image_url || null,
      image_url_ai_suggested: null,
      image_url_uploaded: null,
      image_source: 'none' as const,
      needs_image_review: true,
      region_group: null,
    };

    if (editingCrop) {
      const { error } = await updateCrop(editingCrop.id, cropData);
      if (error) {
        toast.error('अपडेट गर्न सकिएन।');
      } else {
        toast.success('बाली अपडेट भयो!');
        setIsDialogOpen(false);
      }
    } else {
      const { error } = await addCrop(cropData);
      if (error) {
        toast.error('थप्न सकिएन।');
      } else {
        toast.success('नयाँ बाली थपियो!');
        setIsDialogOpen(false);
      }
    }
  };

  const handleToggleActive = async (crop: Crop) => {
    const { error } = await toggleCropActive(crop.id, crop.is_active);
    if (error) {
      toast.error('स्थिति परिवर्तन गर्न सकिएन।');
    } else {
      toast.success(crop.is_active ? 'निष्क्रिय गरियो।' : 'सक्रिय गरियो।');
    }
  };

  const handleDelete = async (crop: Crop) => {
    if (!confirm(`के तपाईं "${crop.name_ne}" हटाउन चाहनुहुन्छ?`)) return;
    
    const { error } = await deleteCrop(crop.id);
    if (error) {
      toast.error('हटाउन सकिएन। पहिले बजार मूल्य data हटाउनुहोस्।');
    } else {
      toast.success('बाली हटाइयो!');
    }
  };

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find(c => c.value === value)?.label || value;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LeafyGreen className="h-5 w-5 text-primary" />
            बाली व्यवस्थापन
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <LeafyGreen className="h-5 w-5 text-primary" />
            बाली व्यवस्थापन ({crops.length})
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                नयाँ बाली
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCrop ? 'बाली सम्पादन' : 'नयाँ बाली थप्नुहोस्'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>नाम (नेपाली)</Label>
                    <Input
                      value={formData.name_ne}
                      onChange={(e) => setFormData({ ...formData, name_ne: e.target.value })}
                      placeholder="टमाटर"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name (English)</Label>
                    <Input
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      placeholder="Tomato"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>श्रेणी</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>एकाइ</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(v) => setFormData({ ...formData, unit: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>तस्बिर URL (optional)</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>क्रम</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    रद्द गर्नुहोस्
                  </Button>
                  <Button type="submit">
                    {editingCrop ? 'अपडेट गर्नुहोस्' : 'थप्नुहोस्'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="बाली खोज्नुहोस्..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>नाम (ने.)</TableHead>
                <TableHead>Name (En)</TableHead>
                <TableHead>श्रेणी</TableHead>
                <TableHead>एकाइ</TableHead>
                <TableHead>स्थिति</TableHead>
                <TableHead className="text-right">कार्य</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCrops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    कुनै बाली फेला परेन।
                  </TableCell>
                </TableRow>
              ) : (
                filteredCrops.map((crop) => (
                  <TableRow key={crop.id}>
                    <TableCell className="font-mono text-muted-foreground">{crop.display_order}</TableCell>
                    <TableCell className="font-medium">{crop.name_ne}</TableCell>
                    <TableCell>{crop.name_en}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(crop.category)}</Badge>
                    </TableCell>
                    <TableCell>{crop.unit}</TableCell>
                    <TableCell>
                      <Badge variant={crop.is_active ? 'default' : 'secondary'}>
                        {crop.is_active ? 'सक्रिय' : 'निष्क्रिय'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(crop)}
                          title={crop.is_active ? 'निष्क्रिय गर्नुहोस्' : 'सक्रिय गर्नुहोस्'}
                        >
                          {crop.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDialog(crop)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(crop)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
