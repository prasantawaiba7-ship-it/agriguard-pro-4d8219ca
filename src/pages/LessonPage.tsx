 import { useState, useEffect } from 'react';
 import { useParams, useNavigate } from 'react-router-dom';
 import Header from '@/components/layout/Header';
 import Footer from '@/components/layout/Footer';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { useLessonDetails, useCompleteLesson, LessonQuiz } from '@/hooks/useLearning';
 import { useAuth } from '@/hooks/useAuth';
 import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, BookOpen, HelpCircle } from 'lucide-react';
 import { QuizComponent } from '@/components/learning/QuizComponent';
 
 export default function LessonPage() {
   const { lessonId } = useParams<{ lessonId: string }>();
   const navigate = useNavigate();
   const { user } = useAuth();
   
   const { data: lesson, isLoading } = useLessonDetails(lessonId);
   const completeLesson = useCompleteLesson();
   
   const [showQuiz, setShowQuiz] = useState(false);
   const [lessonCompleted, setLessonCompleted] = useState(false);
   
   const quiz: LessonQuiz | null = Array.isArray(lesson?.lesson_quizzes) 
     ? lesson?.lesson_quizzes[0] || null
     : lesson?.lesson_quizzes || null;
   
   const handleCompleteLesson = async () => {
     if (!user || !lessonId) return;
     
     try {
       await completeLesson.mutateAsync(lessonId);
       setLessonCompleted(true);
     } catch (error) {
       console.error('Failed to complete lesson:', error);
     }
   };
   
   const handleQuizComplete = (passed: boolean) => {
     if (passed) {
       handleCompleteLesson();
     }
   };
   
   if (isLoading) {
     return (
       <div className="min-h-screen bg-background flex flex-col">
         <Header />
         <div className="flex-1 flex items-center justify-center">
           <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
         </div>
         <Footer />
       </div>
     );
   }
   
   if (!lesson) {
     return (
       <div className="min-h-screen bg-background flex flex-col">
         <Header />
         <div className="flex-1 flex items-center justify-center">
           <p className="text-muted-foreground">पाठ फेला परेन।</p>
         </div>
         <Footer />
       </div>
     );
   }
   
   return (
     <div className="min-h-screen bg-background flex flex-col">
       <Header />
       
       <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
         {/* Back Button */}
         <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
           <ArrowLeft className="w-4 h-4" />
           पछाडि जानुहोस्
         </Button>
         
         {showQuiz && quiz ? (
           <QuizComponent 
             quizId={quiz.id} 
             passScore={quiz.pass_score}
             onComplete={handleQuizComplete}
             onBack={() => setShowQuiz(false)}
           />
         ) : (
           <>
             {/* Lesson Content */}
             <Card>
               <CardHeader>
                 <div className="flex items-start justify-between">
                   <div className="space-y-1">
                     <CardTitle className="text-xl">{lesson.title_ne}</CardTitle>
                     <CardDescription className="flex items-center gap-2">
                       <BookOpen className="w-4 h-4" />
                       {lesson.estimated_duration_min} मिनेट
                       {quiz && (
                         <Badge variant="secondary" className="ml-2 gap-1">
                           <HelpCircle className="w-3 h-3" />
                           क्विज संलग्न
                         </Badge>
                       )}
                     </CardDescription>
                   </div>
                   {lessonCompleted && (
                     <Badge className="bg-green-100 text-green-800 gap-1">
                       <CheckCircle2 className="w-3 h-3" />
                       पूरा भयो
                     </Badge>
                   )}
                 </div>
               </CardHeader>
               <CardContent className="space-y-4">
                 {/* Video content */}
                 {lesson.content_type === 'video' && lesson.media_url && (
                   <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                     <iframe
                       src={lesson.media_url}
                       className="w-full h-full"
                       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                       allowFullScreen
                     />
                   </div>
                 )}
                 
                 {/* Text content */}
                 {lesson.content_ne && (
                   <div 
                     className="prose prose-sm max-w-none"
                     dangerouslySetInnerHTML={{ __html: lesson.content_ne }}
                   />
                 )}
                 
                 {/* Audio content */}
                 {lesson.content_type === 'audio' && lesson.media_url && (
                   <audio controls className="w-full">
                     <source src={lesson.media_url} />
                   </audio>
                 )}
               </CardContent>
             </Card>
             
             {/* Action Buttons */}
             <div className="flex flex-col sm:flex-row gap-3">
               {quiz ? (
                 <Button 
                   size="lg" 
                   className="flex-1 gap-2"
                   onClick={() => setShowQuiz(true)}
                 >
                   <HelpCircle className="w-5 h-5" />
                   क्विज दिनुहोस्
                 </Button>
               ) : (
                 <Button 
                   size="lg" 
                   className="flex-1 gap-2"
                   onClick={handleCompleteLesson}
                   disabled={completeLesson.isPending || lessonCompleted}
                 >
                   {completeLesson.isPending ? (
                     <Loader2 className="w-5 h-5 animate-spin" />
                   ) : lessonCompleted ? (
                     <CheckCircle2 className="w-5 h-5" />
                   ) : (
                     <ArrowRight className="w-5 h-5" />
                   )}
                   {lessonCompleted ? 'पूरा भयो' : 'पाठ पूरा गर्नुहोस्'}
                 </Button>
               )}
             </div>
           </>
         )}
       </main>
       
       <Footer />
     </div>
   );
 }