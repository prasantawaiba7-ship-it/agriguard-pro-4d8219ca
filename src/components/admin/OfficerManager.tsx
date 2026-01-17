import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, Pencil, Trash2, UserCheck, UserX, Search, 
  MapPin, Phone, Mail, Building2 
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface AgriculturalOfficer {
  id: string;
  name: string;
  name_ne: string | null;
  designation: string;
  designation_ne: string | null;
  phone: string | null;
  alternate_phone: string | null;
  email: string | null;
  district: string;
  province: string;
  municipality: string | null;
  ward_no: number | null;
  office_name: string | null;
  office_name_ne: string | null;
  office_address: string | null;
  office_address_ne: string | null;
  specializations: string[] | null;
  working_hours: string | null;
  is_available: boolean | null;
  is_active: boolean | null;
  profile_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
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

const emptyOfficer: Partial<AgriculturalOfficer> = {
  name: '',
  name_ne: '',
  designation: 'कृषि प्राविधिक',
  designation_ne: 'कृषि प्राविधिक',
  phone: '',
  alternate_phone: '',
  email: '',
  district: '',
  province: 'Bagmati',
  municipality: '',
  ward_no: null,
  office_name: '',
  office_name_ne: '',
  office_address: '',
  office_address_ne: '',
  specializations: [],
  working_hours: '10:00 AM - 5:00 PM',
  is_available: true,
  is_active: true,
  latitude: null,
  longitude: null,
};

export function OfficerManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<Partial<AgriculturalOfficer> | null>(null);
  const [specializationInput, setSpecializationInput] = useState('');
  const queryClient = useQueryClient();

  // Fetch all officers (including inactive for admin)
  const { data: officers, isLoading } = useQuery({
    queryKey: ['admin-agricultural-officers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agricultural_officers')
        .select('*')
        .order('district');
      
      if (error) throw error;
      return data as AgriculturalOfficer[];
    }
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (officer: Partial<AgriculturalOfficer>) => {
      if (officer.id) {
        const { error } = await supabase
          .from('agricultural_officers')
          .update(officer)
          .eq('id', officer.id);
        if (error) throw error;
      } else {
        const { name, district, province, ...rest } = officer;
        if (!name || !district || !province) throw new Error('Missing required fields');
        const { error } = await supabase
          .from('agricultural_officers')
          .insert({ name, district, province, ...rest });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agricultural-officers'] });
      queryClient.invalidateQueries({ queryKey: ['agricultural-officers'] });
      toast.success(editingOfficer?.id ? 'Officer updated successfully' : 'Officer added successfully');
      setIsDialogOpen(false);
      setEditingOfficer(null);
    },
    onError: (error) => {
      toast.error('Failed to save officer: ' + error.message);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agricultural_officers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agricultural-officers'] });
      queryClient.invalidateQueries({ queryKey: ['agricultural-officers'] });
      toast.success('Officer deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete officer: ' + error.message);
    }
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('agricultural_officers')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agricultural-officers'] });
      queryClient.invalidateQueries({ queryKey: ['agricultural-officers'] });
      toast.success('Status updated');
    }
  });

  const filteredOfficers = officers?.filter(officer =>
    officer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.name_ne?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.phone?.includes(searchTerm)
  ) || [];

  const handleSave = () => {
    if (!editingOfficer?.name || !editingOfficer?.district) {
      toast.error('Please fill in required fields (name and district)');
      return;
    }
    saveMutation.mutate(editingOfficer);
  };

  const handleAddSpecialization = () => {
    if (specializationInput.trim() && editingOfficer) {
      setEditingOfficer({
        ...editingOfficer,
        specializations: [...(editingOfficer.specializations || []), specializationInput.trim()]
      });
      setSpecializationInput('');
    }
  };

  const handleRemoveSpecialization = (index: number) => {
    if (editingOfficer) {
      const newSpecs = [...(editingOfficer.specializations || [])];
      newSpecs.splice(index, 1);
      setEditingOfficer({ ...editingOfficer, specializations: newSpecs });
    }
  };

  const openEditDialog = (officer?: AgriculturalOfficer) => {
    setEditingOfficer(officer ? { ...officer } : { ...emptyOfficer });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          कृषि प्राविधिक व्यवस्थापन
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEditDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Officer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOfficer?.id ? 'Edit Officer' : 'Add New Officer'}
              </DialogTitle>
            </DialogHeader>
            
            {editingOfficer && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name (English) *</Label>
                    <Input
                      id="name"
                      value={editingOfficer.name || ''}
                      onChange={(e) => setEditingOfficer({ ...editingOfficer, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name_ne">नाम (नेपाली)</Label>
                    <Input
                      id="name_ne"
                      value={editingOfficer.name_ne || ''}
                      onChange={(e) => setEditingOfficer({ ...editingOfficer, name_ne: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      value={editingOfficer.designation || ''}
                      onChange={(e) => setEditingOfficer({ ...editingOfficer, designation: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="designation_ne">पदनाम (नेपाली)</Label>
                    <Input
                      id="designation_ne"
                      value={editingOfficer.designation_ne || ''}
                      onChange={(e) => setEditingOfficer({ ...editingOfficer, designation_ne: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editingOfficer.phone || ''}
                      onChange={(e) => setEditingOfficer({ ...editingOfficer, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editingOfficer.email || ''}
                      onChange={(e) => setEditingOfficer({ ...editingOfficer, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="province">Province *</Label>
                    <Select
                      value={editingOfficer.province || ''}
                      onValueChange={(value) => setEditingOfficer({ ...editingOfficer, province: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Province" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="district">District *</Label>
                    <Input
                      id="district"
                      value={editingOfficer.district || ''}
                      onChange={(e) => setEditingOfficer({ ...editingOfficer, district: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="municipality">Municipality</Label>
                    <Input
                      id="municipality"
                      value={editingOfficer.municipality || ''}
                      onChange={(e) => setEditingOfficer({ ...editingOfficer, municipality: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ward_no">Ward No.</Label>
                    <Input
                      id="ward_no"
                      type="number"
                      value={editingOfficer.ward_no || ''}
                      onChange={(e) => setEditingOfficer({ ...editingOfficer, ward_no: parseInt(e.target.value) || null })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="office_name_ne">कार्यालय नाम</Label>
                    <Input
                      id="office_name_ne"
                      value={editingOfficer.office_name_ne || ''}
                      onChange={(e) => setEditingOfficer({ ...editingOfficer, office_name_ne: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="office_address_ne">कार्यालय ठेगाना</Label>
                    <Input
                      id="office_address_ne"
                      value={editingOfficer.office_address_ne || ''}
                      onChange={(e) => setEditingOfficer({ ...editingOfficer, office_address_ne: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.0001"
                      value={editingOfficer.latitude || ''}
                      onChange={(e) => setEditingOfficer({ ...editingOfficer, latitude: parseFloat(e.target.value) || null })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.0001"
                      value={editingOfficer.longitude || ''}
                      onChange={(e) => setEditingOfficer({ ...editingOfficer, longitude: parseFloat(e.target.value) || null })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="working_hours">Working Hours</Label>
                  <Input
                    id="working_hours"
                    value={editingOfficer.working_hours || ''}
                    onChange={(e) => setEditingOfficer({ ...editingOfficer, working_hours: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Specializations</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={specializationInput}
                      onChange={(e) => setSpecializationInput(e.target.value)}
                      placeholder="Add specialization"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialization())}
                    />
                    <Button type="button" variant="outline" onClick={handleAddSpecialization}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editingOfficer.specializations?.map((spec, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {spec}
                        <button onClick={() => handleRemoveSpecialization(i)} className="ml-1 hover:text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingOfficer.is_available ?? true}
                      onCheckedChange={(checked) => setEditingOfficer({ ...editingOfficer, is_available: checked })}
                    />
                    <Label>Available</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingOfficer.is_active ?? true}
                      onCheckedChange={(checked) => setEditingOfficer({ ...editingOfficer, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search officers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOfficers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No officers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOfficers.map((officer) => (
                    <TableRow key={officer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{officer.name_ne || officer.name}</p>
                          <p className="text-sm text-muted-foreground">{officer.designation_ne}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {officer.district}
                        </div>
                      </TableCell>
                      <TableCell>
                        {officer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {officer.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {officer.is_active ? (
                            <Badge variant="outline" className="bg-success/10 text-success">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive">Inactive</Badge>
                          )}
                          {officer.is_available && (
                            <Badge variant="secondary">उपलब्ध</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleActiveMutation.mutate({ id: officer.id, is_active: !officer.is_active })}
                          >
                            {officer.is_active ? (
                              <UserX className="w-4 h-4 text-destructive" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-success" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(officer)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this officer?')) {
                                deleteMutation.mutate(officer.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
