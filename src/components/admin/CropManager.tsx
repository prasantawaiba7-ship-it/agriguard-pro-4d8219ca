import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Leaf, RefreshCw, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Crop {
  id: string;
  name: string;
  name_ne: string;
  description: string;
  season: string;
  growing_period_days: number;
  diseases: string[];
  is_active: boolean;
}

// Default crops data (stored in app_settings)
const defaultCrops: Omit<Crop, 'id'>[] = [
  {
    name: "Rice",
    name_ne: "धान",
    description: "Main staple crop of Nepal",
    season: "monsoon",
    growing_period_days: 120,
    diseases: ["Blast", "Brown Spot", "Bacterial Leaf Blight"],
    is_active: true
  },
  {
    name: "Wheat",
    name_ne: "गहुँ",
    description: "Major winter crop",
    season: "winter",
    growing_period_days: 150,
    diseases: ["Rust", "Powdery Mildew", "Leaf Blight"],
    is_active: true
  },
  {
    name: "Maize",
    name_ne: "मकै",
    description: "Important food and fodder crop",
    season: "summer",
    growing_period_days: 90,
    diseases: ["Leaf Blight", "Stalk Rot", "Downy Mildew"],
    is_active: true
  },
  {
    name: "Potato",
    name_ne: "आलु",
    description: "High value vegetable crop",
    season: "winter",
    growing_period_days: 100,
    diseases: ["Late Blight", "Early Blight", "Bacterial Wilt"],
    is_active: true
  },
  {
    name: "Tomato",
    name_ne: "गोलभेडा",
    description: "Popular vegetable crop",
    season: "all",
    growing_period_days: 75,
    diseases: ["Early Blight", "Late Blight", "Bacterial Wilt"],
    is_active: true
  }
];

const CropManager = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_ne: "",
    description: "",
    season: "monsoon",
    growing_period_days: 90,
    diseases: "",
    is_active: true
  });

  const fetchCrops = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'crops_list')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.value) {
        setCrops(data.value as unknown as Crop[]);
      } else {
        // Initialize with default crops
        const initialCrops = defaultCrops.map((crop, index) => ({
          ...crop,
          id: `crop_${index + 1}`
        }));
        setCrops(initialCrops);
        await saveCropsToDb(initialCrops);
      }
    } catch (error) {
      console.error('Error fetching crops:', error);
      toast.error("बाली लोड गर्न असफल");
    } finally {
      setLoading(false);
    }
  };

  const saveCropsToDb = async (cropsData: Crop[]) => {
    // First check if the setting exists
    const { data: existing } = await supabase
      .from('app_settings')
      .select('id')
      .eq('key', 'crops_list')
      .single();

    if (existing) {
      const { error } = await supabase
        .from('app_settings')
        .update({
          value: cropsData as unknown as Json,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'crops_list');
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('app_settings')
        .insert([{
          key: 'crops_list',
          value: cropsData as unknown as Json,
          category: 'system',
          description: 'List of crops available in the system'
        }]);
      if (error) throw error;
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const handleOpenDialog = (crop?: Crop) => {
    if (crop) {
      setEditingCrop(crop);
      setFormData({
        name: crop.name,
        name_ne: crop.name_ne,
        description: crop.description,
        season: crop.season,
        growing_period_days: crop.growing_period_days,
        diseases: crop.diseases.join(", "),
        is_active: crop.is_active
      });
    } else {
      setEditingCrop(null);
      setFormData({
        name: "",
        name_ne: "",
        description: "",
        season: "monsoon",
        growing_period_days: 90,
        diseases: "",
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.name_ne) {
      toast.error("कृपया बालीको नाम भर्नुहोस्");
      return;
    }

    setSaving(true);
    try {
      const cropData: Crop = {
        id: editingCrop?.id || `crop_${Date.now()}`,
        name: formData.name,
        name_ne: formData.name_ne,
        description: formData.description,
        season: formData.season,
        growing_period_days: formData.growing_period_days,
        diseases: formData.diseases.split(",").map(d => d.trim()).filter(Boolean),
        is_active: formData.is_active
      };

      let updatedCrops: Crop[];
      if (editingCrop) {
        updatedCrops = crops.map(c => c.id === editingCrop.id ? cropData : c);
      } else {
        updatedCrops = [...crops, cropData];
      }

      await saveCropsToDb(updatedCrops);
      setCrops(updatedCrops);
      setDialogOpen(false);
      toast.success(editingCrop ? "बाली अपडेट भयो!" : "नयाँ बाली थपियो!");
    } catch (error) {
      console.error('Error saving crop:', error);
      toast.error("बाली सेभ गर्न असफल");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cropId: string) => {
    if (!confirm("के तपाईं यो बाली मेट्न चाहनुहुन्छ?")) return;

    try {
      const updatedCrops = crops.filter(c => c.id !== cropId);
      await saveCropsToDb(updatedCrops);
      setCrops(updatedCrops);
      toast.success("बाली मेटियो!");
    } catch (error) {
      console.error('Error deleting crop:', error);
      toast.error("बाली मेट्न असफल");
    }
  };

  const handleToggleActive = async (crop: Crop) => {
    try {
      const updatedCrops = crops.map(c => 
        c.id === crop.id ? { ...c, is_active: !c.is_active } : c
      );
      await saveCropsToDb(updatedCrops);
      setCrops(updatedCrops);
      toast.success(crop.is_active ? "बाली निष्क्रिय गरियो" : "बाली सक्रिय गरियो");
    } catch (error) {
      console.error('Error toggling crop:', error);
      toast.error("स्थिति परिवर्तन गर्न असफल");
    }
  };

  const getSeasonLabel = (season: string) => {
    const labels: Record<string, string> = {
      monsoon: "वर्षा",
      winter: "हिउँद",
      summer: "गर्मी",
      all: "सबै मौसम"
    };
    return labels[season] || season;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-primary" />
              बाली व्यवस्थापन
            </CardTitle>
            <CardDescription>
              प्रणालीमा उपलब्ध बालीहरू थप्नुहोस्, सम्पादन गर्नुहोस् वा मेट्नुहोस्
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCrops}>
              <RefreshCw className="w-4 h-4 mr-2" />
              रिफ्रेस
            </Button>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              नयाँ बाली
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {crops.map((crop) => (
              <Card key={crop.id} className={`relative ${!crop.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{crop.name_ne}</h3>
                      <p className="text-sm text-muted-foreground">{crop.name}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(crop)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(crop.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{crop.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary">{getSeasonLabel(crop.season)}</Badge>
                    <Badge variant="outline">{crop.growing_period_days} दिन</Badge>
                    <Badge 
                      variant={crop.is_active ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => handleToggleActive(crop)}
                    >
                      {crop.is_active ? "सक्रिय" : "निष्क्रिय"}
                    </Badge>
                  </div>

                  {crop.diseases.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">सम्बन्धित रोगहरू:</p>
                      <div className="flex flex-wrap gap-1">
                        {crop.diseases.slice(0, 3).map((disease, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {disease}
                          </Badge>
                        ))}
                        {crop.diseases.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{crop.diseases.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCrop ? "बाली सम्पादन" : "नयाँ बाली थप्नुहोस्"}
            </DialogTitle>
            <DialogDescription>
              बालीको विवरण भर्नुहोस्
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>English Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Rice"
                />
              </div>
              <div className="space-y-2">
                <Label>नेपाली नाम</Label>
                <Input
                  value={formData.name_ne}
                  onChange={(e) => setFormData({ ...formData, name_ne: e.target.value })}
                  placeholder="जस्तै, धान"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>विवरण</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="बालीको बारेमा छोटो विवरण..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>मौसम</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                >
                  <option value="monsoon">वर्षा</option>
                  <option value="winter">हिउँद</option>
                  <option value="summer">गर्मी</option>
                  <option value="all">सबै मौसम</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>बढ्ने अवधि (दिन)</Label>
                <Input
                  type="number"
                  value={formData.growing_period_days}
                  onChange={(e) => setFormData({ ...formData, growing_period_days: parseInt(e.target.value) || 0 })}
                  min={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>सम्बन्धित रोगहरू (अल्पविरामले छुट्याउनुहोस्)</Label>
              <Input
                value={formData.diseases}
                onChange={(e) => setFormData({ ...formData, diseases: e.target.value })}
                placeholder="Blast, Brown Spot, Leaf Blight"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              रद्द
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "सेभ हुँदैछ..." : "सेभ गर्नुहोस्"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CropManager;