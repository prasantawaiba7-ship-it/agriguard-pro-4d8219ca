 import { useState, useEffect } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
 import { Label } from '@/components/ui/label';
 import { Progress } from '@/components/ui/progress';
 import { useQuizQuestions, useSubmitQuiz, useQuizAttempts } from '@/hooks/useLearning';
 import { 
   ArrowLeft, ArrowRight, CheckCircle2, XCircle, 
   Loader2, Trophy, RefreshCw, HelpCircle 
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface QuizComponentProps {
   quizId: string;
   passScore: number;
   onComplete: (passed: boolean) => void;
   onBack: () => void;
 }
 
 export function QuizComponent({ quizId, passScore, onComplete, onBack }: QuizComponentProps) {
   const { data: questions, isLoading } = useQuizQuestions(quizId);
   const { data: attempts } = useQuizAttempts(quizId);
   const submitQuiz = useSubmitQuiz();
   
   const [currentIndex, setCurrentIndex] = useState(0);
   const [answers, setAnswers] = useState<Record<string, string>>({});
   const [showResult, setShowResult] = useState(false);
   const [result, setResult] = useState<{
     score: number;
     correctCount: number;
     totalQuestions: number;
     passed: boolean;
   } | null>(null);
   
   const currentQuestion = questions?.[currentIndex];
   const totalQuestions = questions?.length || 0;
   const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
   
   const handleAnswer = (optionId: string) => {
     if (currentQuestion) {
       setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }));
     }
   };
   
   const handleNext = () => {
     if (currentIndex < totalQuestions - 1) {
       setCurrentIndex(prev => prev + 1);
     }
   };
   
   const handlePrevious = () => {
     if (currentIndex > 0) {
       setCurrentIndex(prev => prev - 1);
     }
   };
   
   const handleSubmit = async () => {
     if (!questions) return;
     
     try {
       const data = await submitQuiz.mutateAsync({
         quizId,
         answers,
         questions,
         passScore,
       });
       
       setResult({
         score: data.score,
         correctCount: data.correctCount,
         totalQuestions: data.totalQuestions,
         passed: data.is_passed,
       });
       setShowResult(true);
       onComplete(data.is_passed);
     } catch (error) {
       console.error('Quiz submit error:', error);
     }
   };
   
   const handleRetry = () => {
     setCurrentIndex(0);
     setAnswers({});
     setShowResult(false);
     setResult(null);
   };
   
   if (isLoading) {
     return (
       <div className="flex items-center justify-center py-12">
         <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
       </div>
     );
   }
   
   if (!questions || questions.length === 0) {
     return (
       <Card>
         <CardContent className="text-center py-12">
           <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
           <p className="text-muted-foreground">यस पाठमा क्विज उपलब्ध छैन।</p>
           <Button variant="outline" className="mt-4" onClick={onBack}>
             पछाडि जानुहोस्
           </Button>
         </CardContent>
       </Card>
     );
   }
   
   if (showResult && result) {
     return (
       <Card>
         <CardHeader className="text-center">
           <div className={cn(
             "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center",
             result.passed ? "bg-green-100" : "bg-red-100"
           )}>
             {result.passed ? (
               <Trophy className="w-10 h-10 text-green-600" />
             ) : (
               <XCircle className="w-10 h-10 text-red-600" />
             )}
           </div>
           <CardTitle className="text-2xl">
             {result.passed ? 'बधाई छ! 🎉' : 'पुन: प्रयास गर्नुहोस्'}
           </CardTitle>
           <CardDescription>
             तपाईंले {result.correctCount} / {result.totalQuestions} प्रश्नको सही जवाफ दिनुभयो।
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="text-center">
             <div className="text-4xl font-bold mb-2">{result.score}%</div>
             <Badge className={result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
               {result.passed ? 'पास' : 'फेल'} (पास मार्क: {passScore}%)
             </Badge>
           </div>
           
           <div className="flex flex-col gap-2">
             {result.passed ? (
               <Button className="w-full gap-2" onClick={onBack}>
                 <CheckCircle2 className="w-4 h-4" />
                 जारी राख्नुहोस्
               </Button>
             ) : (
               <>
                 <Button className="w-full gap-2" onClick={handleRetry}>
                   <RefreshCw className="w-4 h-4" />
                   पुन: प्रयास गर्नुहोस्
                 </Button>
                 <Button variant="outline" className="w-full" onClick={onBack}>
                   पछाडि जानुहोस्
                 </Button>
               </>
             )}
           </div>
         </CardContent>
       </Card>
     );
   }
   
   return (
     <Card>
       <CardHeader>
         <div className="flex items-center justify-between mb-2">
           <Badge variant="outline">
             प्रश्न {currentIndex + 1} / {totalQuestions}
           </Badge>
           <Badge variant="secondary">पास मार्क: {passScore}%</Badge>
         </div>
         <Progress value={progressPercent} className="h-2" />
       </CardHeader>
       
       <CardContent className="space-y-6">
         {/* Question */}
         <div className="space-y-4">
           <h3 className="text-lg font-medium">{currentQuestion?.question_text_ne}</h3>
           
           {/* Options */}
           <RadioGroup
             value={answers[currentQuestion?.id || '']}
             onValueChange={handleAnswer}
             className="space-y-3"
           >
             {currentQuestion?.quiz_options?.map((option, idx) => (
               <div 
                 key={option.id}
                 className={cn(
                   "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                   answers[currentQuestion.id] === option.id 
                     ? "border-primary bg-primary/5" 
                     : "hover:bg-muted"
                 )}
                 onClick={() => handleAnswer(option.id)}
               >
                 <RadioGroupItem value={option.id} id={option.id} />
                 <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                   {String.fromCharCode(65 + idx)}. {option.option_text_ne}
                 </Label>
               </div>
             ))}
           </RadioGroup>
         </div>
         
         {/* Navigation */}
         <div className="flex justify-between gap-3">
           <Button
             variant="outline"
             onClick={currentIndex === 0 ? onBack : handlePrevious}
             className="gap-2"
           >
             <ArrowLeft className="w-4 h-4" />
             {currentIndex === 0 ? 'रद्द गर्नुहोस्' : 'पछाडि'}
           </Button>
           
           {currentIndex === totalQuestions - 1 ? (
             <Button 
               onClick={handleSubmit}
               disabled={Object.keys(answers).length < totalQuestions || submitQuiz.isPending}
               className="gap-2"
             >
               {submitQuiz.isPending ? (
                 <Loader2 className="w-4 h-4 animate-spin" />
               ) : (
                 <CheckCircle2 className="w-4 h-4" />
               )}
               पेश गर्नुहोस्
             </Button>
           ) : (
             <Button 
               onClick={handleNext}
               disabled={!answers[currentQuestion?.id || '']}
               className="gap-2"
             >
               अर्को
               <ArrowRight className="w-4 h-4" />
             </Button>
           )}
         </div>
       </CardContent>
     </Card>
   );
 }