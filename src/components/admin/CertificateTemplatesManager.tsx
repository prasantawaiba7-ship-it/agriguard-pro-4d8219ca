 import { useState } from 'react';
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Switch } from '@/components/ui/switch';
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { toast } from 'sonner';
 import { Plus, Pencil, Trash2, Loader2, Award, Eye } from 'lucide-react';
 
 export function CertificateTemplatesManager() {
   const queryClient = useQueryClient();
   const [editingTemplate, setEditingTemplate] = useState<any>(null);
   const [showDialog, setShowDialog] = useState(false);
   const [showPreview, setShowPreview] = useState(false);
   
   const { data: templates, isLoading } = useQuery({
     queryKey: ['admin-certificate-templates'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('certificate_templates')
         .select('*')
         .order('created_at');
       if (error) throw error;
       return data;
     },
   });
   
   const saveTemplate = useMutation({
     mutationFn: async (template: any) => {
       if (template.id) {
         const { error } = await supabase
           .from('certificate_templates')
           .update({
             code: template.code,
             title_ne: template.title_ne,
             subtitle_ne: template.subtitle_ne,
             body_text_ne: template.body_text_ne,
             footer_ne: template.footer_ne,
             background_image_url: template.background_image_url,
             signature_image_url: template.signature_image_url,
             is_active: template.is_active,
           })
           .eq('id', template.id);
         if (error) throw error;
       } else {
         const { error } = await supabase
           .from('certificate_templates')
           .insert({
             code: template.code || 'custom_' + Date.now(),
             title_ne: template.title_ne,
             subtitle_ne: template.subtitle_ne,
             body_text_ne: template.body_text_ne,
             footer_ne: template.footer_ne,
             background_image_url: template.background_image_url,
             signature_image_url: template.signature_image_url,
             is_active: template.is_active ?? true,
           });
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-certificate-templates'] });
       setShowDialog(false);
       setEditingTemplate(null);
       toast.success('टेम्प्लेट सेभ भयो');
     },
   });
   
   const deleteTemplate = useMutation({
     mutationFn: async (templateId: string) => {
       const { error } = await supabase.from('certificate_templates').delete().eq('id', templateId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-certificate-templates'] });
       toast.success('टेम्प्लेट मेटाइयो');
     },
   });
   
   if (isLoading) {
     return (
       <div className="flex justify-center py-12">
         <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
       </div>
     );
   }
   
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-xl font-semibold">प्रमाणपत्र टेम्प्लेट</h2>
           <p className="text-sm text-muted-foreground">प्रमाणपत्रको डिजाइन र सामग्री व्यवस्थापन गर्नुहोस्</p>
         </div>
         <Button onClick={() => { setEditingTemplate({}); setShowDialog(true); }} className="gap-2">
           <Plus className="w-4 h-4" />
           नयाँ टेम्प्लेट
         </Button>
       </div>
       
       <div className="text-sm bg-muted p-3 rounded-md">
         <strong>प्लेसहोल्डरहरू:</strong> [farmer_name], [course_title], [level_name], [date]
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {templates?.map((template) => (
           <Card key={template.id}>
             <CardHeader className="pb-3">
               <div className="flex items-start justify-between">
                 <div className="flex items-center gap-2">
                   <Award className="w-5 h-5 text-amber-600" />
                   <div>
                     <CardTitle className="text-base">{template.title_ne}</CardTitle>
                     <CardDescription>{template.subtitle_ne}</CardDescription>
                   </div>
                 </div>
                 <Badge variant={template.is_active ? 'default' : 'secondary'}>
                   {template.is_active ? 'सक्रिय' : 'निष्क्रिय'}
                 </Badge>
               </div>
             </CardHeader>
             <CardContent>
               <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                 {template.body_text_ne}
               </p>
               <div className="flex gap-2">
                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => { setEditingTemplate(template); setShowPreview(true); }}
                 >
                   <Eye className="w-4 h-4 mr-1" />
                   हेर्नुहोस्
                 </Button>
                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => { setEditingTemplate(template); setShowDialog(true); }}
                 >
                   <Pencil className="w-4 h-4" />
                 </Button>
                 <Button 
                   variant="destructive" 
                   size="sm"
                   onClick={() => deleteTemplate.mutate(template.id)}
                 >
                   <Trash2 className="w-4 h-4" />
                 </Button>
               </div>
             </CardContent>
           </Card>
         ))}
       </div>
       
       {/* Edit Dialog */}
       <Dialog open={showDialog} onOpenChange={setShowDialog}>
         <DialogContent className="max-w-xl">
           <DialogHeader>
             <DialogTitle>{editingTemplate?.id ? 'टेम्प्लेट सम्पादन' : 'नयाँ टेम्प्लेट'}</DialogTitle>
           </DialogHeader>
           <form onSubmit={(e) => { e.preventDefault(); saveTemplate.mutate(editingTemplate); }} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>शीर्षक (माथि)</Label>
                 <Input 
                   value={editingTemplate?.title_ne || ''} 
                   onChange={(e) => setEditingTemplate({ ...editingTemplate, title_ne: e.target.value })}
                   placeholder="किसान साथी"
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label>उपशीर्षक</Label>
                 <Input 
                   value={editingTemplate?.subtitle_ne || ''} 
                   onChange={(e) => setEditingTemplate({ ...editingTemplate, subtitle_ne: e.target.value })}
                   placeholder="प्रशिक्षण प्रमाणपत्र"
                 />
               </div>
             </div>
             <div className="space-y-2">
               <Label>मुख्य सामग्री</Label>
               <Textarea 
                 rows={3}
                 value={editingTemplate?.body_text_ne || ''} 
                 onChange={(e) => setEditingTemplate({ ...editingTemplate, body_text_ne: e.target.value })}
                 placeholder="यो प्रमाणित गरिन्छ कि [farmer_name] ले..."
               />
             </div>
             <div className="space-y-2">
               <Label>फुटर</Label>
               <Input 
                 value={editingTemplate?.footer_ne || ''} 
                 onChange={(e) => setEditingTemplate({ ...editingTemplate, footer_ne: e.target.value })}
                 placeholder="किसान साथी टीम"
               />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>पृष्ठभूमि छवि URL</Label>
                 <Input 
                   value={editingTemplate?.background_image_url || ''} 
                   onChange={(e) => setEditingTemplate({ ...editingTemplate, background_image_url: e.target.value })}
                   placeholder="https://..."
                 />
               </div>
               <div className="space-y-2">
                 <Label>हस्ताक्षर छवि URL</Label>
                 <Input 
                   value={editingTemplate?.signature_image_url || ''} 
                   onChange={(e) => setEditingTemplate({ ...editingTemplate, signature_image_url: e.target.value })}
                   placeholder="https://..."
                 />
               </div>
             </div>
             <div className="flex items-center gap-2">
               <Switch 
                 checked={editingTemplate?.is_active ?? true}
                 onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, is_active: v })}
               />
               <Label>सक्रिय</Label>
             </div>
             <Button type="submit" className="w-full" disabled={saveTemplate.isPending}>
               {saveTemplate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'सेभ गर्नुहोस्'}
             </Button>
           </form>
         </DialogContent>
       </Dialog>
       
       {/* Preview Dialog */}
       <Dialog open={showPreview} onOpenChange={setShowPreview}>
         <DialogContent className="max-w-3xl">
           <DialogHeader>
             <DialogTitle>प्रमाणपत्र पूर्वावलोकन</DialogTitle>
           </DialogHeader>
           <div 
             className="relative aspect-[1.414/1] bg-gradient-to-br from-amber-50 via-white to-amber-50 p-8 rounded-lg border"
             style={{
               backgroundImage: editingTemplate?.background_image_url 
                 ? `url(${editingTemplate.background_image_url})` 
                 : undefined,
               backgroundSize: 'cover',
             }}
           >
             <div className="absolute inset-4 border-4 border-amber-600/30 rounded-lg" />
             <div className="relative h-full flex flex-col items-center justify-between text-center py-4">
               <div className="space-y-2">
                 <Award className="w-10 h-10 text-amber-600 mx-auto" />
                 <h1 className="text-2xl font-bold text-amber-800">{editingTemplate?.title_ne}</h1>
                 <h2 className="text-lg text-amber-700">{editingTemplate?.subtitle_ne}</h2>
               </div>
               <div className="space-y-3">
                 <p className="text-sm text-gray-700">{editingTemplate?.body_text_ne}</p>
                 <div className="text-xl font-bold text-amber-900">[farmer_name]</div>
               </div>
               <div className="space-y-2">
                 {editingTemplate?.signature_image_url && (
                   <img src={editingTemplate.signature_image_url} alt="Signature" className="h-10 mx-auto" />
                 )}
                 <p className="text-sm text-gray-600">{editingTemplate?.footer_ne}</p>
               </div>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 }