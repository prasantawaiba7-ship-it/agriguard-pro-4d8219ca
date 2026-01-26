import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FlaskConical, Leaf } from "lucide-react";

const soilTestSchema = z.object({
  field_id: z.string().min(1, "खेत छान्नुहोस्"),
  sample_date: z.string().min(1, "मिति आवश्यक छ"),
  ph: z.string().optional(),
  nitrogen_level: z.string().optional(),
  phosphorus_level: z.string().optional(),
  potassium_level: z.string().optional(),
  organic_matter_percent: z.string().optional(),
  ec: z.string().optional(),
  lab_name: z.string().optional(),
  notes: z.string().optional(),
});

type SoilTestFormData = z.infer<typeof soilTestSchema>;

interface Field {
  id: string;
  name: string;
  area: number | null;
  area_unit: string;
}

interface SoilTestFormProps {
  fields: Field[];
  onSuccess?: () => void;
}

export function SoilTestForm({ fields, onSuccess }: SoilTestFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SoilTestFormData>({
    resolver: zodResolver(soilTestSchema),
    defaultValues: {
      sample_date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedFieldId = watch("field_id");

  const onSubmit = async (data: SoilTestFormData) => {
    if (!user) {
      toast({ title: "कृपया लग इन गर्नुहोस्", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("soil_tests").insert({
        field_id: data.field_id,
        user_id: user.id,
        sample_date: data.sample_date,
        ph: data.ph ? parseFloat(data.ph) : null,
        nitrogen_level: data.nitrogen_level ? parseFloat(data.nitrogen_level) : null,
        phosphorus_level: data.phosphorus_level ? parseFloat(data.phosphorus_level) : null,
        potassium_level: data.potassium_level ? parseFloat(data.potassium_level) : null,
        organic_matter_percent: data.organic_matter_percent ? parseFloat(data.organic_matter_percent) : null,
        ec: data.ec ? parseFloat(data.ec) : null,
        lab_name: data.lab_name || null,
        notes: data.notes || null,
      });

      if (error) throw error;

      toast({ title: "माटो परीक्षण सेभ भयो!", description: "तपाईंको माटो डाटा सफलतापूर्वक थपियो।" });
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving soil test:", error);
      toast({ title: "त्रुटि भयो", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FlaskConical className="w-5 h-5 text-primary" />
          माटो परीक्षण थप्नुहोस्
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Field Selection */}
          <div className="space-y-2">
            <Label>खेत छान्नुहोस् *</Label>
            <Select onValueChange={(value) => setValue("field_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="खेत छान्नुहोस्" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    <span className="flex items-center gap-2">
                      <Leaf className="w-4 h-4" />
                      {field.name} ({field.area} {field.area_unit})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.field_id && <p className="text-sm text-destructive">{errors.field_id.message}</p>}
          </div>

          {/* Sample Date */}
          <div className="space-y-2">
            <Label>नमुना लिएको मिति *</Label>
            <Input type="date" {...register("sample_date")} />
            {errors.sample_date && <p className="text-sm text-destructive">{errors.sample_date.message}</p>}
          </div>

          {/* NPK Values Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>pH मान</Label>
              <Input type="number" step="0.1" min="0" max="14" placeholder="6.5" {...register("ph")} />
            </div>
            <div className="space-y-2">
              <Label>EC (dS/m)</Label>
              <Input type="number" step="0.01" placeholder="0.5" {...register("ec")} />
            </div>
            <div className="space-y-2">
              <Label>नाइट्रोजन (N) kg/ha</Label>
              <Input type="number" step="1" placeholder="280" {...register("nitrogen_level")} />
            </div>
            <div className="space-y-2">
              <Label>फस्फोरस (P) kg/ha</Label>
              <Input type="number" step="1" placeholder="15" {...register("phosphorus_level")} />
            </div>
            <div className="space-y-2">
              <Label>पोटासियम (K) kg/ha</Label>
              <Input type="number" step="1" placeholder="150" {...register("potassium_level")} />
            </div>
            <div className="space-y-2">
              <Label>जैविक पदार्थ %</Label>
              <Input type="number" step="0.1" min="0" max="100" placeholder="2.5" {...register("organic_matter_percent")} />
            </div>
          </div>

          {/* Lab Name */}
          <div className="space-y-2">
            <Label>प्रयोगशालाको नाम</Label>
            <Input placeholder="जस्तै: NARC Lab, Khumaltar" {...register("lab_name")} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>टिप्पणी</Label>
            <Textarea placeholder="थप जानकारी..." {...register("notes")} />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                सेभ गर्दै...
              </>
            ) : (
              "माटो परीक्षण सेभ गर्नुहोस्"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
