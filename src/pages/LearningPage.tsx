 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import Header from '@/components/layout/Header';
 import Footer from '@/components/layout/Footer';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Progress } from '@/components/ui/progress';
 import { useLearningLevels, useCourses, useUserCertificates } from '@/hooks/useLearning';
 import { useAuth } from '@/hooks/useAuth';
 import { BookOpen, GraduationCap, Award, Clock, ChevronRight, Trophy, Loader2 } from 'lucide-react';
 
 export default function LearningPage() {
   const navigate = useNavigate();
   const { user } = useAuth();
   const [selectedLevel, setSelectedLevel] = useState<string>('all');
   
   const { data: levels, isLoading: levelsLoading } = useLearningLevels();
   const { data: courses, isLoading: coursesLoading } = useCourses(selectedLevel === 'all' ? undefined : selectedLevel);
   const { data: certificates } = useUserCertificates();
   
   const getLevelIcon = (code: string) => {
     switch (code) {
       case 'beginner': return '🌱';
       case 'intermediate': return '🌿';
       case 'advanced': return '🌳';
       default: return '📚';
     }
   };
   
   const getLevelColor = (code: string) => {
     switch (code) {
       case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
       case 'intermediate': return 'bg-blue-100 text-blue-800 border-blue-200';
       case 'advanced': return 'bg-purple-100 text-purple-800 border-purple-200';
       default: return 'bg-muted text-muted-foreground';
     }
   };
   
   return (
     <div className="min-h-screen bg-background flex flex-col">
       <Header />
       
       <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
         {/* Hero Section */}
         <div className="text-center space-y-3 py-6">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
             <GraduationCap className="w-8 h-8 text-primary" />
           </div>
           <h1 className="text-2xl md:text-3xl font-bold">किसान साथी सिकाइ केन्द्र</h1>
           <p className="text-muted-foreground max-w-md mx-auto">
             खेतीको ज्ञान सिक्नुहोस्, क्विज दिनुहोस्, प्रमाणपत्र पाउनुहोस्
           </p>
         </div>
         
         {/* Level Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {levelsLoading ? (
             <div className="col-span-3 flex justify-center py-8">
               <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
             </div>
           ) : (
             levels?.map((level) => (
               <Card 
                 key={level.id}
                 className={`cursor-pointer transition-all hover:shadow-md ${
                   selectedLevel === level.code ? 'ring-2 ring-primary' : ''
                 }`}
                 onClick={() => setSelectedLevel(level.code)}
               >
                 <CardHeader className="text-center pb-2">
                   <div className="text-4xl mb-2">{getLevelIcon(level.code)}</div>
                   <CardTitle className="text-lg">{level.title_ne}</CardTitle>
                   <CardDescription className="text-sm">{level.description_ne}</CardDescription>
                 </CardHeader>
               </Card>
             ))
           )}
         </div>
         
         {/* Tabs */}
         <Tabs defaultValue="courses" className="space-y-4">
           <TabsList className="grid w-full grid-cols-2">
             <TabsTrigger value="courses" className="gap-2">
               <BookOpen className="w-4 h-4" />
               कोर्सहरू
             </TabsTrigger>
             <TabsTrigger value="certificates" className="gap-2">
               <Award className="w-4 h-4" />
               मेरा प्रमाणपत्रहरू
             </TabsTrigger>
           </TabsList>
           
           <TabsContent value="courses" className="space-y-4">
             {/* Filter Button */}
             {selectedLevel !== 'all' && (
               <div className="flex items-center gap-2">
                 <Badge variant="secondary" className="gap-1">
                   {getLevelIcon(selectedLevel)}
                   {levels?.find(l => l.code === selectedLevel)?.title_ne}
                 </Badge>
                 <Button variant="ghost" size="sm" onClick={() => setSelectedLevel('all')}>
                   सबै हेर्नुहोस्
                 </Button>
               </div>
             )}
             
             {/* Courses Grid */}
             {coursesLoading ? (
               <div className="flex justify-center py-12">
                 <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
               </div>
             ) : courses && courses.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {courses.map((course) => (
                   <Card key={course.id} className="hover:shadow-md transition-shadow">
                     <CardHeader className="pb-3">
                       {course.thumbnail_url ? (
                         <img 
                           src={course.thumbnail_url} 
                           alt={course.title_ne}
                           className="w-full h-32 object-cover rounded-md mb-3"
                         />
                       ) : (
                         <div className="w-full h-32 bg-muted rounded-md mb-3 flex items-center justify-center">
                           <BookOpen className="w-12 h-12 text-muted-foreground/50" />
                         </div>
                       )}
                       <div className="flex items-start justify-between">
                         <CardTitle className="text-base line-clamp-2">{course.title_ne}</CardTitle>
                       </div>
                       {course.learning_levels && (
                         <Badge className={`w-fit text-xs ${getLevelColor(course.learning_levels.code)}`}>
                           {getLevelIcon(course.learning_levels.code)} {course.learning_levels.title_ne}
                         </Badge>
                       )}
                     </CardHeader>
                     <CardContent className="pt-0 space-y-3">
                       <p className="text-sm text-muted-foreground line-clamp-2">
                         {course.description_ne || 'यस कोर्समा खेती सम्बन्धी महत्वपूर्ण जानकारी सिक्नुहोस्।'}
                       </p>
                       <div className="flex items-center gap-2 text-xs text-muted-foreground">
                         <Clock className="w-3 h-3" />
                         <span>{course.estimated_duration_min} मिनेट</span>
                       </div>
                       <Button 
                         className="w-full gap-2" 
                         onClick={() => navigate(`/learning/course/${course.id}`)}
                       >
                         सुरु गर्नुहोस्
                         <ChevronRight className="w-4 h-4" />
                       </Button>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             ) : (
               <div className="text-center py-12 space-y-3">
                 <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50" />
                 <p className="text-muted-foreground">
                   {selectedLevel === 'all' 
                     ? 'अहिले कुनै कोर्स उपलब्ध छैन।'
                     : 'यो स्तरमा कुनै कोर्स उपलब्ध छैन।'}
                 </p>
               </div>
             )}
           </TabsContent>
           
           <TabsContent value="certificates" className="space-y-4">
             {!user ? (
               <div className="text-center py-12 space-y-3">
                 <Award className="w-12 h-12 mx-auto text-muted-foreground/50" />
                 <p className="text-muted-foreground">प्रमाणपत्र हेर्न लगइन गर्नुहोस्।</p>
                 <Button onClick={() => navigate('/auth')}>लगइन गर्नुहोस्</Button>
               </div>
             ) : certificates && certificates.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {certificates.map((cert) => (
                   <Card key={cert.id} className="hover:shadow-md transition-shadow">
                     <CardHeader className="pb-3">
                       <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                           <Trophy className="w-6 h-6 text-yellow-600" />
                         </div>
                         <div>
                           <CardTitle className="text-base">{cert.courses?.title_ne}</CardTitle>
                           <CardDescription className="text-xs">
                             {new Date(cert.issued_at).toLocaleDateString('ne-NP')}
                           </CardDescription>
                         </div>
                       </div>
                     </CardHeader>
                     <CardContent className="pt-0">
                       <Button 
                         variant="outline" 
                         className="w-full gap-2"
                         onClick={() => navigate(`/learning/certificate/${cert.id}`)}
                       >
                         <Award className="w-4 h-4" />
                         प्रमाणपत्र हेर्नुहोस्
                       </Button>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             ) : (
               <div className="text-center py-12 space-y-3">
                 <Award className="w-12 h-12 mx-auto text-muted-foreground/50" />
                 <p className="text-muted-foreground">अहिले सम्म कुनै प्रमाणपत्र पाउनुभएको छैन।</p>
                 <p className="text-sm text-muted-foreground">कोर्स पूरा गरेपछि प्रमाणपत्र पाउनुहुनेछ।</p>
               </div>
             )}
           </TabsContent>
         </Tabs>
       </main>
       
       <Footer />
     </div>
   );
 }