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
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
 import { useLearningLevels, useCourses } from '@/hooks/useLearning';
 import { toast } from 'sonner';
 import { 
   Plus, Pencil, Trash2, BookOpen, Loader2, 
   GraduationCap, Layers, FileText, HelpCircle 
 } from 'lucide-react';
 
 export function CoursesManager() {
   const queryClient = useQueryClient();
   const [editingCourse, setEditingCourse] = useState<any>(null);
   const [showCourseDialog, setShowCourseDialog] = useState(false);
   const [showModuleDialog, setShowModuleDialog] = useState(false);
   const [showLessonDialog, setShowLessonDialog] = useState(false);
   const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
   const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
   const [editingModule, setEditingModule] = useState<any>(null);
   const [editingLesson, setEditingLesson] = useState<any>(null);
   
   const { data: levels } = useLearningLevels();
   const { data: allCourses, isLoading } = useQuery({
     queryKey: ['admin-courses'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('courses')
         .select(`
           *,
           learning_levels (*),
           course_modules (
             *,
             lessons (
               *,
               lesson_quizzes (*)
             )
           )
         `)
         .order('display_order');
       if (error) throw error;
       return data;
     },
   });
   
   // Course mutations
   const saveCourse = useMutation({
     mutationFn: async (course: any) => {
       if (course.id) {
         const { error } = await supabase
           .from('courses')
           .update({
             title_ne: course.title_ne,
             description_ne: course.description_ne,
             level_id: course.level_id || null,
             estimated_duration_min: course.estimated_duration_min,
             is_published: course.is_published,
           })
           .eq('id', course.id);
         if (error) throw error;
       } else {
         const { error } = await supabase
           .from('courses')
           .insert({
             title_ne: course.title_ne,
             description_ne: course.description_ne,
             level_id: course.level_id || null,
             estimated_duration_min: course.estimated_duration_min,
             is_published: course.is_published || false,
           });
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
       setShowCourseDialog(false);
       setEditingCourse(null);
       toast.success('कोर्स सेभ भयो');
     },
     onError: (error) => {
       toast.error('त्रुटि: ' + error.message);
     },
   });
   
   const deleteCourse = useMutation({
     mutationFn: async (courseId: string) => {
       const { error } = await supabase.from('courses').delete().eq('id', courseId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
       toast.success('कोर्स मेटाइयो');
     },
   });
   
   // Module mutations
   const saveModule = useMutation({
     mutationFn: async (module: any) => {
       if (module.id) {
         const { error } = await supabase
           .from('course_modules')
           .update({
             title_ne: module.title_ne,
             description_ne: module.description_ne,
             order_index: module.order_index || 0,
           })
           .eq('id', module.id);
         if (error) throw error;
       } else {
         const { error } = await supabase
           .from('course_modules')
           .insert({
             course_id: module.course_id,
             title_ne: module.title_ne,
             description_ne: module.description_ne,
             order_index: module.order_index || 0,
           });
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
       setShowModuleDialog(false);
       setEditingModule(null);
       toast.success('मोड्युल सेभ भयो');
     },
   });
   
   const deleteModule = useMutation({
     mutationFn: async (moduleId: string) => {
       const { error } = await supabase.from('course_modules').delete().eq('id', moduleId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
       toast.success('मोड्युल मेटाइयो');
     },
   });
   
   // Lesson mutations
   const saveLesson = useMutation({
     mutationFn: async (lesson: any) => {
       if (lesson.id) {
         const { error } = await supabase
           .from('lessons')
           .update({
             title_ne: lesson.title_ne,
             content_ne: lesson.content_ne,
             content_type: lesson.content_type,
             media_url: lesson.media_url,
             estimated_duration_min: lesson.estimated_duration_min,
             is_published: lesson.is_published,
             order_index: lesson.order_index || 0,
           })
           .eq('id', lesson.id);
         if (error) throw error;
       } else {
         const { error } = await supabase
           .from('lessons')
           .insert({
             module_id: lesson.module_id,
             title_ne: lesson.title_ne,
             content_ne: lesson.content_ne,
             content_type: lesson.content_type || 'text',
             media_url: lesson.media_url,
             estimated_duration_min: lesson.estimated_duration_min || 5,
             is_published: lesson.is_published ?? true,
             order_index: lesson.order_index || 0,
           });
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
       setShowLessonDialog(false);
       setEditingLesson(null);
       toast.success('पाठ सेभ भयो');
     },
   });
   
   const deleteLesson = useMutation({
     mutationFn: async (lessonId: string) => {
       const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
       toast.success('पाठ मेटाइयो');
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
           <h2 className="text-xl font-semibold">कोर्स व्यवस्थापन</h2>
           <p className="text-sm text-muted-foreground">कोर्स, मोड्युल र पाठहरू व्यवस्थापन गर्नुहोस्</p>
         </div>
         <Button onClick={() => { setEditingCourse({}); setShowCourseDialog(true); }} className="gap-2">
           <Plus className="w-4 h-4" />
           नयाँ कोर्स
         </Button>
       </div>
       
       {/* Courses List */}
       <div className="space-y-4">
         {allCourses?.map((course) => (
           <Card key={course.id}>
             <CardHeader className="pb-3">
               <div className="flex items-start justify-between">
                 <div className="space-y-1">
                   <div className="flex items-center gap-2">
                     <GraduationCap className="w-5 h-5 text-primary" />
                     <CardTitle className="text-lg">{course.title_ne}</CardTitle>
                     <Badge variant={course.is_published ? 'default' : 'secondary'}>
                       {course.is_published ? 'प्रकाशित' : 'ड्राफ्ट'}
                     </Badge>
                   </div>
                   <CardDescription>{course.description_ne}</CardDescription>
                   {course.learning_levels && (
                     <Badge variant="outline">{course.learning_levels.title_ne}</Badge>
                   )}
                 </div>
                 <div className="flex gap-2">
                   <Button 
                     variant="outline" 
                     size="sm"
                     onClick={() => { setEditingCourse(course); setShowCourseDialog(true); }}
                   >
                     <Pencil className="w-4 h-4" />
                   </Button>
                   <Button 
                     variant="destructive" 
                     size="sm"
                     onClick={() => deleteCourse.mutate(course.id)}
                   >
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 </div>
               </div>
             </CardHeader>
             <CardContent>
               {/* Modules */}
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <h4 className="font-medium flex items-center gap-2">
                     <Layers className="w-4 h-4" />
                     मोड्युलहरू ({course.course_modules?.length || 0})
                   </h4>
                   <Button 
                     variant="outline" 
                     size="sm"
                     onClick={() => { 
                       setSelectedCourseId(course.id);
                       setEditingModule({ course_id: course.id }); 
                       setShowModuleDialog(true); 
                     }}
                   >
                     <Plus className="w-4 h-4 mr-1" />
                     मोड्युल थप्नुहोस्
                   </Button>
                 </div>
                 
                 <Accordion type="multiple" className="space-y-2">
                   {course.course_modules?.map((module: any) => (
                     <AccordionItem key={module.id} value={module.id} className="border rounded-lg">
                       <AccordionTrigger className="px-4 hover:no-underline">
                         <div className="flex items-center gap-3 text-left flex-1">
                           <span className="font-medium">{module.title_ne}</span>
                           <Badge variant="secondary" className="text-xs">
                             {module.lessons?.length || 0} पाठ
                           </Badge>
                         </div>
                         <div className="flex gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
                           <Button 
                             variant="ghost" 
                             size="sm"
                             onClick={() => { setEditingModule(module); setShowModuleDialog(true); }}
                           >
                             <Pencil className="w-3 h-3" />
                           </Button>
                           <Button 
                             variant="ghost" 
                             size="sm"
                             onClick={() => deleteModule.mutate(module.id)}
                           >
                             <Trash2 className="w-3 h-3" />
                           </Button>
                         </div>
                       </AccordionTrigger>
                       <AccordionContent className="px-4 pb-4">
                         <div className="space-y-2">
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => { 
                               setSelectedModuleId(module.id);
                               setEditingLesson({ module_id: module.id }); 
                               setShowLessonDialog(true); 
                             }}
                           >
                             <Plus className="w-4 h-4 mr-1" />
                             पाठ थप्नुहोस्
                           </Button>
                           
                           {module.lessons?.map((lesson: any) => (
                             <div 
                               key={lesson.id}
                               className="flex items-center justify-between p-2 bg-muted rounded-md"
                             >
                               <div className="flex items-center gap-2">
                                 <FileText className="w-4 h-4 text-muted-foreground" />
                                 <span className="text-sm">{lesson.title_ne}</span>
                                 {lesson.lesson_quizzes && (
                                   <Badge variant="outline" className="text-xs">
                                     <HelpCircle className="w-3 h-3 mr-1" />
                                     क्विज
                                   </Badge>
                                 )}
                               </div>
                               <div className="flex gap-1">
                                 <Button 
                                   variant="ghost" 
                                   size="sm"
                                   onClick={() => { setEditingLesson(lesson); setShowLessonDialog(true); }}
                                 >
                                   <Pencil className="w-3 h-3" />
                                 </Button>
                                 <Button 
                                   variant="ghost" 
                                   size="sm"
                                   onClick={() => deleteLesson.mutate(lesson.id)}
                                 >
                                   <Trash2 className="w-3 h-3" />
                                 </Button>
                               </div>
                             </div>
                           ))}
                         </div>
                       </AccordionContent>
                     </AccordionItem>
                   ))}
                 </Accordion>
               </div>
             </CardContent>
           </Card>
         ))}
         
         {(!allCourses || allCourses.length === 0) && (
           <div className="text-center py-12">
             <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
             <p className="text-muted-foreground">कुनै कोर्स छैन। नयाँ कोर्स थप्नुहोस्।</p>
           </div>
         )}
       </div>
       
       {/* Course Dialog */}
       <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>{editingCourse?.id ? 'कोर्स सम्पादन' : 'नयाँ कोर्स'}</DialogTitle>
           </DialogHeader>
           <form onSubmit={(e) => { e.preventDefault(); saveCourse.mutate(editingCourse); }} className="space-y-4">
             <div className="space-y-2">
               <Label>शीर्षक (नेपाली)</Label>
               <Input 
                 value={editingCourse?.title_ne || ''} 
                 onChange={(e) => setEditingCourse({ ...editingCourse, title_ne: e.target.value })}
                 required
               />
             </div>
             <div className="space-y-2">
               <Label>विवरण</Label>
               <Textarea 
                 value={editingCourse?.description_ne || ''} 
                 onChange={(e) => setEditingCourse({ ...editingCourse, description_ne: e.target.value })}
               />
             </div>
             <div className="space-y-2">
               <Label>स्तर</Label>
               <Select 
                 value={editingCourse?.level_id || ''} 
                 onValueChange={(v) => setEditingCourse({ ...editingCourse, level_id: v })}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="स्तर छान्नुहोस्" />
                 </SelectTrigger>
                 <SelectContent>
                   {levels?.map((level) => (
                     <SelectItem key={level.id} value={level.id}>
                       {level.title_ne}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label>अनुमानित समय (मिनेट)</Label>
               <Input 
                 type="number"
                 value={editingCourse?.estimated_duration_min || 30} 
                 onChange={(e) => setEditingCourse({ ...editingCourse, estimated_duration_min: parseInt(e.target.value) })}
               />
             </div>
             <div className="flex items-center gap-2">
               <Switch 
                 checked={editingCourse?.is_published || false}
                 onCheckedChange={(v) => setEditingCourse({ ...editingCourse, is_published: v })}
               />
               <Label>प्रकाशित गर्नुहोस्</Label>
             </div>
             <Button type="submit" className="w-full" disabled={saveCourse.isPending}>
               {saveCourse.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'सेभ गर्नुहोस्'}
             </Button>
           </form>
         </DialogContent>
       </Dialog>
       
       {/* Module Dialog */}
       <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>{editingModule?.id ? 'मोड्युल सम्पादन' : 'नयाँ मोड्युल'}</DialogTitle>
           </DialogHeader>
           <form onSubmit={(e) => { e.preventDefault(); saveModule.mutate(editingModule); }} className="space-y-4">
             <div className="space-y-2">
               <Label>शीर्षक (नेपाली)</Label>
               <Input 
                 value={editingModule?.title_ne || ''} 
                 onChange={(e) => setEditingModule({ ...editingModule, title_ne: e.target.value })}
                 required
               />
             </div>
             <div className="space-y-2">
               <Label>विवरण</Label>
               <Textarea 
                 value={editingModule?.description_ne || ''} 
                 onChange={(e) => setEditingModule({ ...editingModule, description_ne: e.target.value })}
               />
             </div>
             <div className="space-y-2">
               <Label>क्रम</Label>
               <Input 
                 type="number"
                 value={editingModule?.order_index || 0} 
                 onChange={(e) => setEditingModule({ ...editingModule, order_index: parseInt(e.target.value) })}
               />
             </div>
             <Button type="submit" className="w-full" disabled={saveModule.isPending}>
               {saveModule.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'सेभ गर्नुहोस्'}
             </Button>
           </form>
         </DialogContent>
       </Dialog>
       
       {/* Lesson Dialog */}
       <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle>{editingLesson?.id ? 'पाठ सम्पादन' : 'नयाँ पाठ'}</DialogTitle>
           </DialogHeader>
           <form onSubmit={(e) => { e.preventDefault(); saveLesson.mutate(editingLesson); }} className="space-y-4">
             <div className="space-y-2">
               <Label>शीर्षक (नेपाली)</Label>
               <Input 
                 value={editingLesson?.title_ne || ''} 
                 onChange={(e) => setEditingLesson({ ...editingLesson, title_ne: e.target.value })}
                 required
               />
             </div>
             <div className="space-y-2">
               <Label>विषयवस्तु</Label>
               <Textarea 
                 rows={6}
                 value={editingLesson?.content_ne || ''} 
                 onChange={(e) => setEditingLesson({ ...editingLesson, content_ne: e.target.value })}
                 placeholder="पाठको विषयवस्तु लेख्नुहोस्..."
               />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>प्रकार</Label>
                 <Select 
                   value={editingLesson?.content_type || 'text'} 
                   onValueChange={(v) => setEditingLesson({ ...editingLesson, content_type: v })}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="text">पाठ</SelectItem>
                     <SelectItem value="video">भिडियो</SelectItem>
                     <SelectItem value="audio">अडियो</SelectItem>
                     <SelectItem value="mixed">मिश्रित</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>समय (मिनेट)</Label>
                 <Input 
                   type="number"
                   value={editingLesson?.estimated_duration_min || 5} 
                   onChange={(e) => setEditingLesson({ ...editingLesson, estimated_duration_min: parseInt(e.target.value) })}
                 />
               </div>
             </div>
             <div className="space-y-2">
               <Label>मिडिया URL (भिडियो/अडियो)</Label>
               <Input 
                 value={editingLesson?.media_url || ''} 
                 onChange={(e) => setEditingLesson({ ...editingLesson, media_url: e.target.value })}
                 placeholder="https://..."
               />
             </div>
             <div className="flex items-center gap-2">
               <Switch 
                 checked={editingLesson?.is_published ?? true}
                 onCheckedChange={(v) => setEditingLesson({ ...editingLesson, is_published: v })}
               />
               <Label>प्रकाशित गर्नुहोस्</Label>
             </div>
             <Button type="submit" className="w-full" disabled={saveLesson.isPending}>
               {saveLesson.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'सेभ गर्नुहोस्'}
             </Button>
           </form>
         </DialogContent>
       </Dialog>
     </div>
   );
 }