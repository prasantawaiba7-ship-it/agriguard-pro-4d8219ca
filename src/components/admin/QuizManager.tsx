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
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
 import { toast } from 'sonner';
 import { Plus, Pencil, Trash2, Loader2, HelpCircle, CheckCircle2 } from 'lucide-react';
 
 export function QuizManager() {
   const queryClient = useQueryClient();
   const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
   const [showQuizDialog, setShowQuizDialog] = useState(false);
   const [showQuestionDialog, setShowQuestionDialog] = useState(false);
   const [editingQuiz, setEditingQuiz] = useState<any>(null);
   const [editingQuestion, setEditingQuestion] = useState<any>(null);
   const [newOptions, setNewOptions] = useState<{text: string, isCorrect: boolean}[]>([
     { text: '', isCorrect: true },
     { text: '', isCorrect: false },
     { text: '', isCorrect: false },
     { text: '', isCorrect: false },
   ]);
   
   // Fetch all lessons with their quizzes
   const { data: lessons, isLoading } = useQuery({
     queryKey: ['admin-lessons-quizzes'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('lessons')
         .select(`
           *,
           course_modules (
             title_ne,
             courses (title_ne)
           ),
           lesson_quizzes (
             *,
             quiz_questions (
               *,
               quiz_options (*)
             )
           )
         `)
         .order('created_at', { ascending: false });
       if (error) throw error;
       return data;
     },
   });
   
   // Create/update quiz
   const saveQuiz = useMutation({
     mutationFn: async (quiz: any) => {
       if (quiz.id) {
         const { error } = await supabase
           .from('lesson_quizzes')
           .update({
             pass_score: quiz.pass_score,
             max_attempts: quiz.max_attempts,
             is_active: quiz.is_active,
           })
           .eq('id', quiz.id);
         if (error) throw error;
       } else {
         const { error } = await supabase
           .from('lesson_quizzes')
           .insert({
             lesson_id: quiz.lesson_id,
             pass_score: quiz.pass_score || 60,
             max_attempts: quiz.max_attempts,
             is_active: quiz.is_active ?? true,
           });
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-lessons-quizzes'] });
       setShowQuizDialog(false);
       setEditingQuiz(null);
       toast.success('क्विज सेभ भयो');
     },
   });
   
   // Delete quiz
   const deleteQuiz = useMutation({
     mutationFn: async (quizId: string) => {
       const { error } = await supabase.from('lesson_quizzes').delete().eq('id', quizId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-lessons-quizzes'] });
       toast.success('क्विज मेटाइयो');
     },
   });
   
   // Save question with options
   const saveQuestion = useMutation({
     mutationFn: async ({ question, options }: { question: any, options: typeof newOptions }) => {
       if (question.id) {
         // Update question
         const { error: qError } = await supabase
           .from('quiz_questions')
           .update({
             question_text_ne: question.question_text_ne,
             question_type: question.question_type,
             order_index: question.order_index,
           })
           .eq('id', question.id);
         if (qError) throw qError;
         
         // Delete old options and insert new ones
         await supabase.from('quiz_options').delete().eq('question_id', question.id);
         
         const { error: oError } = await supabase
           .from('quiz_options')
           .insert(options.filter(o => o.text.trim()).map((o, idx) => ({
             question_id: question.id,
             option_text_ne: o.text,
             is_correct: o.isCorrect,
             order_index: idx,
           })));
         if (oError) throw oError;
       } else {
         // Insert question
         const { data: newQ, error: qError } = await supabase
           .from('quiz_questions')
           .insert({
             quiz_id: question.quiz_id,
             question_text_ne: question.question_text_ne,
             question_type: question.question_type || 'mcq_single',
             order_index: question.order_index || 0,
           })
           .select()
           .single();
         if (qError) throw qError;
         
         // Insert options
         const { error: oError } = await supabase
           .from('quiz_options')
           .insert(options.filter(o => o.text.trim()).map((o, idx) => ({
             question_id: newQ.id,
             option_text_ne: o.text,
             is_correct: o.isCorrect,
             order_index: idx,
           })));
         if (oError) throw oError;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-lessons-quizzes'] });
       setShowQuestionDialog(false);
       setEditingQuestion(null);
       setNewOptions([
         { text: '', isCorrect: true },
         { text: '', isCorrect: false },
         { text: '', isCorrect: false },
         { text: '', isCorrect: false },
       ]);
       toast.success('प्रश्न सेभ भयो');
     },
   });
   
   // Delete question
   const deleteQuestion = useMutation({
     mutationFn: async (questionId: string) => {
       const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-lessons-quizzes'] });
       toast.success('प्रश्न मेटाइयो');
     },
   });
   
   const openQuestionDialog = (question: any, quizId: string) => {
     if (question.id) {
       setEditingQuestion(question);
       setNewOptions(
         question.quiz_options?.map((o: any) => ({ text: o.option_text_ne, isCorrect: o.is_correct })) || 
         [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }]
       );
     } else {
       setEditingQuestion({ quiz_id: quizId });
       setNewOptions([
         { text: '', isCorrect: true },
         { text: '', isCorrect: false },
         { text: '', isCorrect: false },
         { text: '', isCorrect: false },
       ]);
     }
     setShowQuestionDialog(true);
   };
   
   if (isLoading) {
     return (
       <div className="flex justify-center py-12">
         <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
       </div>
     );
   }
   
   return (
     <div className="space-y-6">
       <div>
         <h2 className="text-xl font-semibold">क्विज व्यवस्थापन</h2>
         <p className="text-sm text-muted-foreground">पाठका क्विज र प्रश्नहरू व्यवस्थापन गर्नुहोस्</p>
       </div>
       
       <div className="space-y-4">
         {lessons?.map((lesson: any) => {
           const quiz = lesson.lesson_quizzes;
           const courseName = lesson.course_modules?.courses?.title_ne;
           const moduleName = lesson.course_modules?.title_ne;
           
           return (
             <Card key={lesson.id}>
               <CardHeader className="pb-3">
                 <div className="flex items-start justify-between">
                   <div>
                     <CardTitle className="text-base">{lesson.title_ne}</CardTitle>
                     <CardDescription className="text-xs">
                       {courseName} → {moduleName}
                     </CardDescription>
                   </div>
                   {!quiz ? (
                     <Button 
                       size="sm"
                       onClick={() => { 
                         setEditingQuiz({ lesson_id: lesson.id }); 
                         setShowQuizDialog(true); 
                       }}
                     >
                       <Plus className="w-4 h-4 mr-1" />
                       क्विज थप्नुहोस्
                     </Button>
                   ) : (
                     <div className="flex items-center gap-2">
                       <Badge variant={quiz.is_active ? 'default' : 'secondary'}>
                         {quiz.is_active ? 'सक्रिय' : 'निष्क्रिय'}
                       </Badge>
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => { setEditingQuiz(quiz); setShowQuizDialog(true); }}
                       >
                         <Pencil className="w-3 h-3" />
                       </Button>
                       <Button 
                         variant="destructive" 
                         size="sm"
                         onClick={() => deleteQuiz.mutate(quiz.id)}
                       >
                         <Trash2 className="w-3 h-3" />
                       </Button>
                     </div>
                   )}
                 </div>
               </CardHeader>
               
               {quiz && (
                 <CardContent className="pt-0">
                   <div className="text-sm text-muted-foreground mb-3">
                     पास मार्क: {quiz.pass_score}% | प्रश्नहरू: {quiz.quiz_questions?.length || 0}
                   </div>
                   
                   <div className="space-y-2">
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => openQuestionDialog({}, quiz.id)}
                     >
                       <Plus className="w-4 h-4 mr-1" />
                       प्रश्न थप्नुहोस्
                     </Button>
                     
                     {quiz.quiz_questions?.map((q: any, idx: number) => (
                       <div key={q.id} className="flex items-start justify-between p-3 bg-muted rounded-md">
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-1">
                             <Badge variant="outline" className="text-xs">Q{idx + 1}</Badge>
                             <span className="text-sm font-medium">{q.question_text_ne}</span>
                           </div>
                           <div className="flex flex-wrap gap-1 mt-1">
                             {q.quiz_options?.map((o: any) => (
                               <Badge 
                                 key={o.id} 
                                 variant={o.is_correct ? 'default' : 'secondary'}
                                 className="text-xs"
                               >
                                 {o.is_correct && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                 {o.option_text_ne}
                               </Badge>
                             ))}
                           </div>
                         </div>
                         <div className="flex gap-1">
                           <Button 
                             variant="ghost" 
                             size="sm"
                             onClick={() => openQuestionDialog(q, quiz.id)}
                           >
                             <Pencil className="w-3 h-3" />
                           </Button>
                           <Button 
                             variant="ghost" 
                             size="sm"
                             onClick={() => deleteQuestion.mutate(q.id)}
                           >
                             <Trash2 className="w-3 h-3" />
                           </Button>
                         </div>
                       </div>
                     ))}
                   </div>
                 </CardContent>
               )}
             </Card>
           );
         })}
       </div>
       
       {/* Quiz Settings Dialog */}
       <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>{editingQuiz?.id ? 'क्विज सम्पादन' : 'नयाँ क्विज'}</DialogTitle>
           </DialogHeader>
           <form onSubmit={(e) => { e.preventDefault(); saveQuiz.mutate(editingQuiz); }} className="space-y-4">
             <div className="space-y-2">
               <Label>पास मार्क (%)</Label>
               <Input 
                 type="number"
                 min="0"
                 max="100"
                 value={editingQuiz?.pass_score || 60} 
                 onChange={(e) => setEditingQuiz({ ...editingQuiz, pass_score: parseInt(e.target.value) })}
               />
             </div>
             <div className="space-y-2">
               <Label>अधिकतम प्रयास (खाली = असीमित)</Label>
               <Input 
                 type="number"
                 min="1"
                 value={editingQuiz?.max_attempts || ''} 
                 onChange={(e) => setEditingQuiz({ ...editingQuiz, max_attempts: e.target.value ? parseInt(e.target.value) : null })}
               />
             </div>
             <div className="flex items-center gap-2">
               <Switch 
                 checked={editingQuiz?.is_active ?? true}
                 onCheckedChange={(v) => setEditingQuiz({ ...editingQuiz, is_active: v })}
               />
               <Label>सक्रिय</Label>
             </div>
             <Button type="submit" className="w-full" disabled={saveQuiz.isPending}>
               {saveQuiz.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'सेभ गर्नुहोस्'}
             </Button>
           </form>
         </DialogContent>
       </Dialog>
       
       {/* Question Dialog */}
       <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
         <DialogContent className="max-w-xl">
           <DialogHeader>
             <DialogTitle>{editingQuestion?.id ? 'प्रश्न सम्पादन' : 'नयाँ प्रश्न'}</DialogTitle>
           </DialogHeader>
           <form onSubmit={(e) => { e.preventDefault(); saveQuestion.mutate({ question: editingQuestion, options: newOptions }); }} className="space-y-4">
             <div className="space-y-2">
               <Label>प्रश्न (नेपाली)</Label>
               <Textarea 
                 value={editingQuestion?.question_text_ne || ''} 
                 onChange={(e) => setEditingQuestion({ ...editingQuestion, question_text_ne: e.target.value })}
                 required
               />
             </div>
             <div className="space-y-2">
               <Label>प्रश्नको प्रकार</Label>
               <Select 
                 value={editingQuestion?.question_type || 'mcq_single'} 
                 onValueChange={(v) => setEditingQuestion({ ...editingQuestion, question_type: v })}
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="mcq_single">बहुविकल्पीय (एक उत्तर)</SelectItem>
                   <SelectItem value="true_false">सही/गलत</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             <div className="space-y-3">
               <Label>विकल्पहरू (सही उत्तर छान्नुहोस्)</Label>
               {newOptions.map((opt, idx) => (
                 <div key={idx} className="flex items-center gap-2">
                   <input
                     type="radio"
                     name="correct"
                     checked={opt.isCorrect}
                     onChange={() => {
                       setNewOptions(prev => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
                     }}
                     className="w-4 h-4"
                   />
                   <Input 
                     placeholder={`विकल्प ${String.fromCharCode(65 + idx)}`}
                     value={opt.text}
                     onChange={(e) => {
                       setNewOptions(prev => prev.map((o, i) => i === idx ? { ...o, text: e.target.value } : o));
                     }}
                   />
                 </div>
               ))}
             </div>
             
             <Button type="submit" className="w-full" disabled={saveQuestion.isPending}>
               {saveQuestion.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'सेभ गर्नुहोस्'}
             </Button>
           </form>
         </DialogContent>
       </Dialog>
     </div>
   );
 }