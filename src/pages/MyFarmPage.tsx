import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Home, MapPin, Droplets, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { useFarms, useDeleteFarm, Farm } from '@/hooks/useFarms';
import { FarmSetupForm } from '@/components/farm/FarmSetupForm';
import { FarmCropsList } from '@/components/farm/FarmCropsList';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function MyFarmPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: farms, isLoading } = useFarms();
  const deleteFarm = useDeleteFarm();
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editFarm, setEditFarm] = useState<Farm | null>(null);

  const selectedFarm = farms?.find(f => f.id === selectedFarmId) || farms?.[0] || null;

  // Auto-select first farm
  if (farms && farms.length > 0 && !selectedFarmId) {
    setSelectedFarmId(farms[0].id);
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <>
      <Helmet><title>मेरो खेत - Kishan Sathi</title></Helmet>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/farmer')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold">🌾 मेरो खेत</h1>
            </div>
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-3 h-3 mr-1" />नयाँ खेत</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <FarmSetupForm onSuccess={() => setShowCreateForm(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {isLoading && (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          )}

          {!isLoading && (!farms || farms.length === 0) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="text-center py-8">
                <CardContent>
                  <Home className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-lg font-semibold mb-1">तपाईंको पहिलो खेत थप्नुहोस्</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    खेत र बालीको जानकारी राख्नुहोस् — AI सल्लाह, विशेषज्ञ प्रश्नमा context मिल्छ
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}><Plus className="w-4 h-4 mr-1" />खेत थप्नुहोस्</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {farms && farms.length > 0 && (
            <>
              {/* Farm selector */}
              {farms.length > 1 && (
                <Select value={selectedFarm?.id || ''} onValueChange={setSelectedFarmId}>
                  <SelectTrigger>
                    <SelectValue placeholder="खेत छान्नुहोस्" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.farm_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedFarm && (
                <motion.div key={selectedFarm.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* Farm summary card */}
                  <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-base">{selectedFarm.farm_name}</CardTitle>
                      <div className="flex gap-1">
                        <Dialog open={!!editFarm} onOpenChange={o => !o && setEditFarm(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditFarm(selectedFarm)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[90vh] overflow-y-auto">
                            {editFarm && <FarmSetupForm editFarm={editFarm} onSuccess={() => setEditFarm(null)} />}
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => { deleteFarm.mutate(selectedFarm.id); setSelectedFarmId(null); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {selectedFarm.village && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" /> {selectedFarm.village}
                            {selectedFarm.district && `, ${selectedFarm.district}`}
                          </div>
                        )}
                        {selectedFarm.total_area && (
                          <div className="text-muted-foreground">
                            📐 {selectedFarm.total_area} {selectedFarm.area_unit}
                          </div>
                        )}
                        {selectedFarm.irrigation_type && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Droplets className="w-3.5 h-3.5" /> {selectedFarm.irrigation_type}
                          </div>
                        )}
                      </div>
                      {selectedFarm.main_crops?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedFarm.main_crops.map(c => (
                            <span key={c} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{c}</span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Farm crops */}
                  <FarmCropsList farmId={selectedFarm.id} />
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
