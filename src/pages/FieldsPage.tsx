import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useFields, Field } from '@/hooks/useFields';
import { useCropSeasons, CropSeason } from '@/hooks/useCropSeasons';
import { SoilTestForm } from '@/components/soil/SoilTestForm';
import { SoilAdvisoryCard } from '@/components/soil/SoilAdvisoryCard';
import { 
  MapPin, Plus, Edit, Trash2, Leaf, Calendar, ChevronRight,
  Sprout, TestTube, Loader2, Mountain
} from 'lucide-react';
import { format } from 'date-fns';

const areaUnits = [
  { value: 'ropani', label: 'रोपनी' },
  { value: 'katha', label: 'कठ्ठा' },
  { value: 'bigha', label: 'बिघा' },
  { value: 'hectare', label: 'हेक्टर' },
];

const FieldsPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { fields, isLoading: fieldsLoading, addField, updateField, deleteField } = useFields();
  const { seasons, createSeason, updateSeason } = useCropSeasons();
  
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [isAddSeasonOpen, setIsAddSeasonOpen] = useState(false);
  const [isSoilTestOpen, setIsSoilTestOpen] = useState(false);
  
  const [newField, setNewField] = useState({
    name: '',
    area: '',
    area_unit: 'ropani',
    district: '',
    municipality: '',
  });
  
  const [newSeason, setNewSeason] = useState({
    crop_name: '',
    variety: '',
    season_start_date: format(new Date(), 'yyyy-MM-dd'),
    expected_yield: '',
    notes: '',
  });

  if (authLoading || fieldsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleCreateField = async () => {
    if (!newField.name) return;

    await addField({
      name: newField.name,
      area: newField.area ? parseFloat(newField.area) : null,
      area_unit: newField.area_unit,
      district: newField.district || null,
      municipality: newField.municipality || null,
      latitude: null,
      longitude: null,
    });

    setNewField({ name: '', area: '', area_unit: 'ropani', district: '', municipality: '' });
    setIsAddFieldOpen(false);
  };

  const handleDeleteField = async (id: string) => {
    if (confirm('के तपाईं यो खेत हटाउन चाहनुहुन्छ?')) {
      await deleteField(id);
      if (selectedField?.id === id) setSelectedField(null);
    }
  };

  const handleCreateSeason = async () => {
    if (!selectedField || !newSeason.crop_name) return;

    await createSeason({
      field_id: selectedField.id,
      crop_name: newSeason.crop_name,
      variety: newSeason.variety || null,
      season_start_date: newSeason.season_start_date,
      season_end_date: null,
      expected_yield: newSeason.expected_yield ? parseFloat(newSeason.expected_yield) : null,
      actual_yield: null,
      notes: newSeason.notes || null,
      is_active: true,
    });

    setNewSeason({
      crop_name: '',
      variety: '',
      season_start_date: format(new Date(), 'yyyy-MM-dd'),
      expected_yield: '',
      notes: '',
    });
    setIsAddSeasonOpen(false);
  };

  const fieldSeasons = seasons.filter(s => s.field_id === selectedField?.id);

  return (
    <>
      <Helmet>
        <title>मेरो खेत - Kisan Sathi</title>
        <meta name="description" content="Manage your fields, crops, and soil tests" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 sm:pt-24 pb-20">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Mountain className="h-6 w-6 text-primary" />
                  मेरो खेत
                </h1>
                <p className="text-muted-foreground">खेत, बाली र माटो परीक्षण व्यवस्थापन</p>
              </div>
              
              <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    नयाँ खेत
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>नयाँ खेत थप्नुहोस्</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>खेतको नाम *</Label>
                      <Input
                        placeholder="जस्तै: पूर्वी खेत"
                        value={newField.name}
                        onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>क्षेत्रफल</Label>
                        <Input
                          type="number"
                          placeholder="5"
                          value={newField.area}
                          onChange={(e) => setNewField({ ...newField, area: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>एकाइ</Label>
                        <Select
                          value={newField.area_unit}
                          onValueChange={(v) => setNewField({ ...newField, area_unit: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {areaUnits.map((u) => (
                              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>जिल्ला</Label>
                        <Input
                          placeholder="काठमाडौं"
                          value={newField.district}
                          onChange={(e) => setNewField({ ...newField, district: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>नगरपालिका</Label>
                        <Input
                          placeholder="बूढानीलकण्ठ"
                          value={newField.municipality}
                          onChange={(e) => setNewField({ ...newField, municipality: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button onClick={handleCreateField} className="w-full">
                      खेत थप्नुहोस्
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Fields List */}
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">खेतहरू ({fields.length})</h2>
                
                {fields.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                      <Mountain className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">कुनै खेत छैन</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setIsAddFieldOpen(true)}
                      >
                        पहिलो खेत थप्नुहोस्
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  fields.map((field) => (
                    <Card 
                      key={field.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedField?.id === field.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedField(field)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {field.name}
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </h3>
                            {field.area && (
                              <p className="text-sm text-muted-foreground">
                                {field.area} {areaUnits.find(u => u.value === field.area_unit)?.label}
                              </p>
                            )}
                            {field.district && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {field.municipality && `${field.municipality}, `}{field.district}
                              </p>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteField(field.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Field Detail */}
              <div className="md:col-span-2 space-y-6">
                {!selectedField ? (
                  <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                      <Leaf className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">खेत छान्नुहोस्</h3>
                      <p className="text-muted-foreground">
                        बायाँबाट खेत छान्नुहोस् वा नयाँ खेत थप्नुहोस्
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Selected Field Header */}
                    <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Mountain className="h-5 w-5 text-primary" />
                            {selectedField.name}
                          </span>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setIsSoilTestOpen(true)}
                            >
                              <TestTube className="h-4 w-4 mr-1" />
                              माटो परीक्षण
                            </Button>
                            <Dialog open={isAddSeasonOpen} onOpenChange={setIsAddSeasonOpen}>
                              <DialogTrigger asChild>
                                <Button size="sm">
                                  <Sprout className="h-4 w-4 mr-1" />
                                  बाली थप्ने
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>नयाँ बाली सिजन</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <div>
                                    <Label>बालीको नाम *</Label>
                                    <Input
                                      placeholder="धान, गहुँ, मकै..."
                                      value={newSeason.crop_name}
                                      onChange={(e) => setNewSeason({ ...newSeason, crop_name: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>जात (variety)</Label>
                                    <Input
                                      placeholder="hybrid, local..."
                                      value={newSeason.variety}
                                      onChange={(e) => setNewSeason({ ...newSeason, variety: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>सुरु मिति</Label>
                                    <Input
                                      type="date"
                                      value={newSeason.season_start_date}
                                      onChange={(e) => setNewSeason({ ...newSeason, season_start_date: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>अपेक्षित उत्पादन (क्विन्टल)</Label>
                                    <Input
                                      type="number"
                                      placeholder="10"
                                      value={newSeason.expected_yield}
                                      onChange={(e) => setNewSeason({ ...newSeason, expected_yield: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>नोट</Label>
                                    <Textarea
                                      placeholder="थप जानकारी..."
                                      value={newSeason.notes}
                                      onChange={(e) => setNewSeason({ ...newSeason, notes: e.target.value })}
                                    />
                                  </div>
                                  <Button onClick={handleCreateSeason} className="w-full">
                                    बाली थप्नुहोस्
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-4 text-sm">
                          {selectedField.area && (
                            <span>
                              <strong>क्षेत्रफल:</strong> {selectedField.area} {areaUnits.find(u => u.value === selectedField.area_unit)?.label}
                            </span>
                          )}
                          {selectedField.district && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {selectedField.municipality && `${selectedField.municipality}, `}{selectedField.district}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Soil Advisory */}
                    <SoilAdvisoryCard fields={selectedField ? [selectedField] : []} />

                    {/* Crop Seasons */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Leaf className="h-5 w-5 text-success" />
                          बाली सिजनहरू
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {fieldSeasons.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Sprout className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>यस खेतमा कुनै बाली छैन</p>
                            <Button 
                              variant="outline" 
                              className="mt-4"
                              onClick={() => setIsAddSeasonOpen(true)}
                            >
                              बाली थप्नुहोस्
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {fieldSeasons.map((season) => (
                              <div 
                                key={season.id}
                                className="flex justify-between items-center p-4 rounded-lg bg-muted/50"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">{season.crop_name}</h4>
                                    {season.variety && (
                                      <span className="text-sm text-muted-foreground">({season.variety})</span>
                                    )}
                                    <Badge variant={season.is_active ? 'default' : 'secondary'}>
                                      {season.is_active ? 'सक्रिय' : 'समाप्त'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(season.season_start_date), 'yyyy-MM-dd')}
                                      {season.season_end_date && ` → ${format(new Date(season.season_end_date), 'yyyy-MM-dd')}`}
                                    </span>
                                    {season.expected_yield && (
                                      <span>अपेक्षित: {season.expected_yield} क्विन्टल</span>
                                    )}
                                  </div>
                                </div>
                                {season.is_active && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => updateSeason(season.id, { 
                                      is_active: false, 
                                      season_end_date: format(new Date(), 'yyyy-MM-dd')
                                    })}
                                  >
                                    सिजन समाप्त
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>

            {/* Soil Test Dialog */}
            <Dialog open={isSoilTestOpen} onOpenChange={setIsSoilTestOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>माटो परीक्षण थप्नुहोस्</DialogTitle>
                </DialogHeader>
                {selectedField && (
                  <SoilTestForm 
                    fields={[selectedField]} 
                    onSuccess={() => setIsSoilTestOpen(false)}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FieldsPage;
