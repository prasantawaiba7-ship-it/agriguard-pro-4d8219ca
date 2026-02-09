import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLearningLevels, useCourses, useUserCertificates } from '@/hooks/useLearning';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { BookOpen, GraduationCap, Award, Clock, ChevronRight, Trophy, Loader2 } from 'lucide-react';

export default function LearningPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
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

  const getLevelTitle = (level: any) => language === 'ne' ? level.title_ne : (level.title_en || level.title_ne);
  const getLevelDesc = (level: any) => language === 'ne' ? level.description_ne : (level.description_en || level.description_ne);
  const getCourseTitle = (course: any) => language === 'ne' ? course.title_ne : (course.title_en || course.title_ne);
  const getCourseDesc = (course: any) => language === 'ne' ? course.description_ne : (course.description_en || course.description_ne);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-3 py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('learningCenter')}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('learningSubtitle')}
          </p>
        </div>
        
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
                  <CardTitle className="text-lg">{getLevelTitle(level)}</CardTitle>
                  <CardDescription className="text-sm">{getLevelDesc(level)}</CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
        
        <Tabs defaultValue="courses" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="w-4 h-4" />
              {t('courses')}
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2">
              <Award className="w-4 h-4" />
              {t('myCertificates')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="courses" className="space-y-4">
            {selectedLevel !== 'all' && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  {getLevelIcon(selectedLevel)}
                  {levels?.find(l => l.code === selectedLevel)?.title_ne}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLevel('all')}>
                  {t('viewAll')}
                </Button>
              </div>
            )}
            
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
                          alt={getCourseTitle(course)}
                          className="w-full h-32 object-cover rounded-md mb-3"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted rounded-md mb-3 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base line-clamp-2">{getCourseTitle(course)}</CardTitle>
                      </div>
                      {course.learning_levels && (
                        <Badge className={`w-fit text-xs ${getLevelColor(course.learning_levels.code)}`}>
                          {getLevelIcon(course.learning_levels.code)} {getLevelTitle(course.learning_levels)}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {getCourseDesc(course) || t('learnImportantInfo')}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{course.estimated_duration_min} {t('minutes')}</span>
                      </div>
                      <Button 
                        className="w-full gap-2" 
                        onClick={() => navigate(`/learning/course/${course.id}`)}
                      >
                        {t('startCourse')}
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
                  {selectedLevel === 'all' ? t('noCourses') : t('noCoursesLevel')}
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="certificates" className="space-y-4">
            {!user ? (
              <div className="text-center py-12 space-y-3">
                <Award className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">{t('loginForCertificates')}</p>
                <Button onClick={() => navigate('/auth')}>{t('login')}</Button>
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
                            {new Date(cert.issued_at).toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US')}
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
                        {t('viewCertificate')}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <Award className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">{t('noCertificatesYet')}</p>
                <p className="text-sm text-muted-foreground">{t('completeCourseForCert')}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}