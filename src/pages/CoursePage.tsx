 import { useState, useEffect } from 'react';
 import { useParams, useNavigate } from 'react-router-dom';
 import Header from '@/components/layout/Header';
 import Footer from '@/components/layout/Footer';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
 import { useCourseDetails, useUserCourseProgress, useUserLessonStatuses, useStartCourse } from '@/hooks/useLearning';
 import { useAuth } from '@/hooks/useAuth';
 import { 
   ArrowLeft, BookOpen, Clock, CheckCircle2, Circle, 
   PlayCircle, FileText, Loader2, GraduationCap 
 } from 'lucide-react';
 
 export default function CoursePage() {
   const { courseId } = useParams<{ courseId: string }>();
   const navigate = useNavigate();
   const { user } = useAuth();
   
   const { data: course, isLoading } = useCourseDetails(courseId);
   const { data: progress } = useUserCourseProgress(courseId);
   const { data: lessonStatuses } = useUserLessonStatuses(courseId);
   const startCourseMutation = useStartCourse();
   
   const completedLessons = lessonStatuses?.filter(s => s.is_completed).length || 0;
   const totalLessons = course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
   const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
   
   const isLessonCompleted = (lessonId: string) => {
     return lessonStatuses?.some(s => s.lesson_id === lessonId && s.is_completed);
   };
   
   const handleStartCourse = async () => {
     if (!user) {
       navigate('/auth');
       return;
     }
     
     if (courseId && !progress) {
       await startCourseMutation.mutateAsync(courseId);
     }
     
     // Navigate to first lesson
     const firstLesson = course?.modules?.[0]?.lessons?.[0];
     if (firstLesson) {
       navigate(`/learning/lesson/${firstLesson.id}`);
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
   
   if (!course) {
     return (
       <div className="min-h-screen bg-background flex flex-col">
         <Header />
         <div className="flex-1 flex items-center justify-center">
           <p className="text-muted-foreground">कोर्स फेला परेन।</p>
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
         <Button variant="ghost" size="sm" onClick={() => navigate('/learning')} className="gap-2">
           <ArrowLeft className="w-4 h-4" />
           सिकाइ केन्द्रमा फर्कनुहोस्
         </Button>
         
         {/* Course Header */}
         <Card>
           <CardHeader>
             <div className="flex flex-col md:flex-row gap-4">
               {course.thumbnail_url ? (
                 <img 
                   src={course.thumbnail_url} 
                   alt={course.title_ne}
                   className="w-full md:w-48 h-32 object-cover rounded-md"
                 />
               ) : (
                 <div className="w-full md:w-48 h-32 bg-muted rounded-md flex items-center justify-center">
                   <GraduationCap className="w-12 h-12 text-muted-foreground/50" />
                 </div>
               )}
               <div className="flex-1 space-y-2">
                 <CardTitle className="text-xl">{course.title_ne}</CardTitle>
                 {course.learning_levels && (
                   <Badge variant="secondary" className="gap-1">
                     {course.learning_levels.code === 'beginner' ? '🌱' : 
                      course.learning_levels.code === 'intermediate' ? '🌿' : '🌳'}
                     {course.learning_levels.title_ne}
                   </Badge>
                 )}
                 <CardDescription>{course.description_ne}</CardDescription>
                 <div className="flex items-center gap-4 text-sm text-muted-foreground">
                   <span className="flex items-center gap-1">
                     <Clock className="w-4 h-4" />
                     {course.estimated_duration_min} मिनेट
                   </span>
                   <span className="flex items-center gap-1">
                     <BookOpen className="w-4 h-4" />
                     {totalLessons} पाठ
                   </span>
                 </div>
               </div>
             </div>
           </CardHeader>
           
           {user && progress && (
             <CardContent className="pt-0">
               <div className="space-y-2">
                 <div className="flex justify-between text-sm">
                   <span>प्रगति</span>
                   <span>{progressPercent}%</span>
                 </div>
                 <Progress value={progressPercent} className="h-2" />
                 <p className="text-xs text-muted-foreground">
                   {completedLessons} / {totalLessons} पाठ पूरा
                 </p>
               </div>
             </CardContent>
           )}
         </Card>
         
         {/* Start Button */}
         {(!progress || progressPercent < 100) && (
           <Button 
             size="lg" 
             className="w-full gap-2"
             onClick={handleStartCourse}
             disabled={startCourseMutation.isPending}
           >
             {startCourseMutation.isPending ? (
               <Loader2 className="w-4 h-4 animate-spin" />
             ) : (
               <PlayCircle className="w-5 h-5" />
             )}
             {progress ? 'जारी राख्नुहोस्' : 'सुरु गर्नुहोस्'}
           </Button>
         )}
         
         {/* Modules and Lessons */}
         <div className="space-y-4">
           <h2 className="text-lg font-semibold">पाठ्यक्रम</h2>
           
           <Accordion type="multiple" className="space-y-2">
             {course.modules?.map((module, moduleIndex) => (
               <AccordionItem key={module.id} value={module.id} className="border rounded-lg">
                 <AccordionTrigger className="px-4 hover:no-underline">
                   <div className="flex items-center gap-3 text-left">
                     <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                       {moduleIndex + 1}
                     </div>
                     <div>
                       <p className="font-medium">{module.title_ne}</p>
                       <p className="text-xs text-muted-foreground">
                         {module.lessons?.length || 0} पाठ
                       </p>
                     </div>
                   </div>
                 </AccordionTrigger>
                 <AccordionContent className="px-4 pb-4">
                   <div className="space-y-2 ml-11">
                     {module.lessons?.map((lesson, lessonIndex) => {
                       const completed = isLessonCompleted(lesson.id);
                       const hasQuiz = Array.isArray(lesson.lesson_quizzes) 
                         ? lesson.lesson_quizzes.length > 0 
                         : !!lesson.lesson_quizzes;
                       
                       return (
                         <div 
                           key={lesson.id}
                           className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                           onClick={() => navigate(`/learning/lesson/${lesson.id}`)}
                         >
                           {completed ? (
                             <CheckCircle2 className="w-5 h-5 text-green-600" />
                           ) : (
                             <Circle className="w-5 h-5 text-muted-foreground" />
                           )}
                           <div className="flex-1">
                             <p className={`text-sm ${completed ? 'text-muted-foreground' : ''}`}>
                               {lesson.title_ne}
                             </p>
                             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                               <span>{lesson.estimated_duration_min} मिनेट</span>
                               {hasQuiz && (
                                 <Badge variant="outline" className="text-xs">क्विज</Badge>
                               )}
                             </div>
                           </div>
                           {lesson.content_type === 'video' ? (
                             <PlayCircle className="w-4 h-4 text-muted-foreground" />
                           ) : (
                             <FileText className="w-4 h-4 text-muted-foreground" />
                           )}
                         </div>
                       );
                     })}
                   </div>
                 </AccordionContent>
               </AccordionItem>
             ))}
           </Accordion>
         </div>
       </main>
       
       <Footer />
     </div>
   );
 }