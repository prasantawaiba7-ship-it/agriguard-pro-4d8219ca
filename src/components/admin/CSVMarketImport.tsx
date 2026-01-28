import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLocationData } from '@/hooks/useLocationData';
import { format } from 'date-fns';

interface ParsedRow {
  crop_name: string;
  crop_name_ne?: string;
  unit: string;
  price_min: number;
  price_max: number;
  price_avg?: number;
  isValid: boolean;
  errors?: string[];
}

export function CSVMarketImport({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importDate, setImportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [marketName, setMarketName] = useState('');
  const [marketNameNe, setMarketNameNe] = useState('');
  
  const { provinces, districts, handleProvinceChange, selectedProvinceId } = useLocationData();
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('कृपया CSV फाइल मात्र अपलोड गर्नुहोस्');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      toast.error('CSV मा कम्तिमा एउटा डाटा पङ्क्ति चाहिन्छ');
      return;
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    
    // Find column indices
    const cropNameIdx = headers.findIndex(h => h.includes('crop') || h.includes('name') || h.includes('कृषि') || h.includes('उपज'));
    const cropNameNeIdx = headers.findIndex(h => h.includes('nepali') || h.includes('ne') || h.includes('नेपाली'));
    const unitIdx = headers.findIndex(h => h.includes('unit') || h.includes('ईकाइ') || h.includes('एकाइ'));
    const minIdx = headers.findIndex(h => h.includes('min') || h.includes('न्यूनतम'));
    const maxIdx = headers.findIndex(h => h.includes('max') || h.includes('अधिकतम'));
    const avgIdx = headers.findIndex(h => h.includes('avg') || h.includes('average') || h.includes('औसत'));

    if (cropNameIdx === -1 || (minIdx === -1 && maxIdx === -1)) {
      toast.error('CSV मा crop_name र price_min/price_max स्तम्भहरू आवश्यक छन्');
      return;
    }

    // Parse rows
    const parsed: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const cropName = values[cropNameIdx]?.trim() || '';
      const cropNameNe = cropNameNeIdx >= 0 ? values[cropNameNeIdx]?.trim() : undefined;
      const unit = unitIdx >= 0 ? values[unitIdx]?.trim() || 'kg' : 'kg';
      const priceMin = minIdx >= 0 ? parseFloat(values[minIdx]?.replace(/[^\d.]/g, '') || '0') : 0;
      const priceMax = maxIdx >= 0 ? parseFloat(values[maxIdx]?.replace(/[^\d.]/g, '') || '0') : 0;
      const priceAvg = avgIdx >= 0 ? parseFloat(values[avgIdx]?.replace(/[^\d.]/g, '') || '0') : undefined;

      const errors: string[] = [];
      if (!cropName) errors.push('Crop name missing');
      if (priceMin === 0 && priceMax === 0) errors.push('No valid prices');

      parsed.push({
        crop_name: cropName,
        crop_name_ne: cropNameNe,
        unit,
        price_min: priceMin,
        price_max: priceMax,
        price_avg: priceAvg,
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    setParsedData(parsed);
    toast.success(`${parsed.length} पङ्क्तिहरू पार्स गरियो`);
  };

  // Handle quoted CSV values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleImport = async () => {
    const validRows = parsedData.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error('कुनै मान्य डाटा छैन');
      return;
    }

    if (!marketName) {
      toast.error('कृपया बजारको नाम दिनुहोस्');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-market-csv', {
        body: {
          csvData: validRows.map(r => ({
            crop_name: r.crop_name,
            crop_name_ne: r.crop_name_ne,
            unit: r.unit,
            price_min: r.price_min,
            price_max: r.price_max,
            price_avg: r.price_avg,
          })),
          marketName,
          marketNameNe,
          district: districts.find(d => d.id.toString() === selectedDistrict)?.name_en,
          provinceId: selectedProvince ? parseInt(selectedProvince) : null,
          date: importDate,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${data.count} उत्पादनहरू आयात भए!`);
        setIsOpen(false);
        setParsedData([]);
        onImportSuccess?.();
      } else {
        throw new Error(data?.error || 'Import failed');
      }
    } catch (err) {
      console.error('Import error:', err);
      toast.error('आयात असफल भयो');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `crop_name,crop_name_ne,unit,price_min,price_max,price_avg
Tomato,गोलभेडा,kg,50,70,60
Potato,आलु,kg,30,40,35
Onion,प्याज,kg,40,55,47
Cabbage,बन्दा,kg,35,50,42`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'market_prices_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-1" />
          CSV आयात
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            CSV बाट बजार मूल्य आयात
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>CSV ढाँचा</AlertTitle>
            <AlertDescription className="text-sm">
              CSV मा यी स्तम्भहरू हुनुपर्छ: <code>crop_name</code>, <code>price_min</code>, <code>price_max</code>।
              वैकल्पिक: <code>crop_name_ne</code>, <code>unit</code>, <code>price_avg</code>
            </AlertDescription>
          </Alert>

          {/* Settings Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">मिति</Label>
              <Input
                type="date"
                value={importDate}
                onChange={(e) => setImportDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">बजार नाम (EN) *</Label>
              <Input
                value={marketName}
                onChange={(e) => setMarketName(e.target.value)}
                placeholder="Kalimati"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">बजार नाम (NE)</Label>
              <Input
                value={marketNameNe}
                onChange={(e) => setMarketNameNe(e.target.value)}
                placeholder="कालिमाटी"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">प्रदेश</Label>
              <Select
                value={selectedProvince}
                onValueChange={(v) => {
                  setSelectedProvince(v);
                  handleProvinceChange(v ? parseInt(v) : null);
                  setSelectedDistrict('');
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="छान्नुहोस्" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name_ne}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Upload */}
          <div className="flex gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-1" />
              Template
            </Button>
          </div>

          {/* Preview */}
          {parsedData.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>पूर्वावलोकन ({parsedData.length} पङ्क्तिहरू)</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {validCount} मान्य
                    </Badge>
                    {invalidCount > 0 && (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {invalidCount} अमान्य
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[250px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30px]">#</TableHead>
                        <TableHead>बाली</TableHead>
                        <TableHead>नेपाली</TableHead>
                        <TableHead>एकाइ</TableHead>
                        <TableHead className="text-right">न्यूनतम</TableHead>
                        <TableHead className="text-right">अधिकतम</TableHead>
                        <TableHead>स्थिति</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 50).map((row, i) => (
                        <TableRow key={i} className={!row.isValid ? 'bg-destructive/5' : ''}>
                          <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                          <TableCell className="font-medium">{row.crop_name}</TableCell>
                          <TableCell className="text-muted-foreground">{row.crop_name_ne || '-'}</TableCell>
                          <TableCell>{row.unit}</TableCell>
                          <TableCell className="text-right">रु. {row.price_min}</TableCell>
                          <TableCell className="text-right">रु. {row.price_max}</TableCell>
                          <TableCell>
                            {row.isValid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <span className="text-xs text-destructive">{row.errors?.join(', ')}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            रद्द गर्नुहोस्
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={isLoading || validCount === 0 || !marketName}
          >
            {isLoading ? 'आयात हुँदैछ...' : `${validCount} उत्पादनहरू आयात गर्नुहोस्`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
