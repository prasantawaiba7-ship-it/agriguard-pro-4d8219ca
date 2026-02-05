 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from './useAuth';
 
 export interface LearningLevel {
   id: string;
   code: string;
   title_ne: string;
   description_ne: string | null;
   display_order: number;
   is_active: boolean;
 }
 
 export interface Course {
   id: string;
   level_id: string | null;
   title_ne: string;
   description_ne: string | null;
   thumbnail_url: string | null;
   target_crop_id: number | null;
   estimated_duration_min: number;
   is_published: boolean;
   display_order: number;
   learning_levels?: LearningLevel;
 }
 
 export interface CourseModule {
   id: string;
   course_id: string;
   title_ne: string;
   description_ne: string | null;
   order_index: number;
   lessons?: Lesson[];
 }
 
 export interface Lesson {
   id: string;
   module_id: string;
   title_ne: string;
   content_ne: string | null;
   content_type: string;
   media_url: string | null;
   order_index: number;
   estimated_duration_min: number;
   is_published: boolean;
   lesson_quizzes?: LessonQuiz | LessonQuiz[] | null;
 }
 
 export interface LessonQuiz {
   id: string;
   lesson_id: string;
   pass_score: number;
   max_attempts: number | null;
   is_active: boolean;
 }
 
 export interface QuizQuestion {
   id: string;
   quiz_id: string;
   question_text_ne: string;
   question_type: 'mcq_single' | 'true_false';
   order_index: number;
   quiz_options?: QuizOption[];
 }
 
 export interface QuizOption {
   id: string;
   question_id: string;
   option_text_ne: string;
   is_correct: boolean;
   order_index: number;
 }
 
 export interface QuizAttempt {
   id: string;
   quiz_id: string;
   user_id: string;
   attempt_number: number;
   score: number;
   total_questions: number;
   is_passed: boolean;
   answers_json: Record<string, string> | null;
   started_at: string;
   completed_at: string | null;
 }
 
 export interface UserCourseProgress {
   id: string;
   user_id: string;
   course_id: string;
   started_at: string;
   completed_at: string | null;
   is_completed: boolean;
 }
 
 export interface UserLessonStatus {
   id: string;
   user_id: string;
   lesson_id: string;
   is_completed: boolean;
   completed_at: string | null;
 }
 
 export interface UserCertificate {
   id: string;
   user_id: string;
   course_id: string;
   template_id: string | null;
   certificate_number: string;
   issued_at: string;
   file_url: string | null;
   meta_json: Record<string, any> | null;
   courses?: Course;
   certificate_templates?: CertificateTemplate;
 }
 
 export interface CertificateTemplate {
   id: string;
   code: string;
   title_ne: string;
   subtitle_ne: string | null;
   body_text_ne: string | null;
   footer_ne: string | null;
   background_image_url: string | null;
   signature_image_url: string | null;
   is_active: boolean;
 }
 
 // Fetch learning levels
 export function useLearningLevels() {
   return useQuery({
     queryKey: ['learning-levels'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('learning_levels')
         .select('*')
         .eq('is_active', true)
         .order('display_order');
       
       if (error) throw error;
       return data as LearningLevel[];
     },
   });
 }
 
 // Fetch courses by level
 export function useCourses(levelCode?: string) {
   return useQuery({
     queryKey: ['courses', levelCode],
     queryFn: async () => {
       let query = supabase
         .from('courses')
         .select(`
           *,
           learning_levels (*)
         `)
         .eq('is_published', true)
         .order('display_order');
       
       if (levelCode) {
         const { data: level } = await supabase
           .from('learning_levels')
           .select('id')
           .eq('code', levelCode)
           .single();
         
         if (level) {
           query = query.eq('level_id', level.id);
         }
       }
       
       const { data, error } = await query;
       if (error) throw error;
       return data as Course[];
     },
   });
 }
 
 // Fetch single course with modules and lessons
 export function useCourseDetails(courseId: string | undefined) {
   return useQuery({
     queryKey: ['course-details', courseId],
     queryFn: async () => {
       if (!courseId) return null;
       
       const { data: course, error: courseError } = await supabase
         .from('courses')
         .select(`
           *,
           learning_levels (*)
         `)
         .eq('id', courseId)
         .single();
       
       if (courseError) throw courseError;
       
       const { data: modules, error: modulesError } = await supabase
         .from('course_modules')
         .select(`
           *,
           lessons (
             *,
             lesson_quizzes (*)
           )
         `)
         .eq('course_id', courseId)
         .order('order_index');
       
       if (modulesError) throw modulesError;
       
       return {
         ...course,
         modules: (modules || []) as unknown as CourseModule[],
       };
     },
     enabled: !!courseId,
   });
 }
 
 // Fetch lesson details
 export function useLessonDetails(lessonId: string | undefined) {
   return useQuery({
     queryKey: ['lesson-details', lessonId],
     queryFn: async () => {
       if (!lessonId) return null;
       
       const { data, error } = await supabase
         .from('lessons')
         .select(`
           *,
           lesson_quizzes (*)
         `)
         .eq('id', lessonId)
         .single();
       
       if (error) throw error;
       return data as unknown as Lesson;
     },
     enabled: !!lessonId,
   });
 }
 
 // Fetch quiz questions
 export function useQuizQuestions(quizId: string | undefined) {
   return useQuery({
     queryKey: ['quiz-questions', quizId],
     queryFn: async () => {
       if (!quizId) return [];
       
       const { data, error } = await supabase
         .from('quiz_questions')
         .select(`
           *,
           quiz_options (*)
         `)
         .eq('quiz_id', quizId)
         .order('order_index');
       
       if (error) throw error;
       return data as QuizQuestion[];
     },
     enabled: !!quizId,
   });
 }
 
 // User progress hooks
 export function useUserCourseProgress(courseId: string | undefined) {
   const { user } = useAuth();
   
   return useQuery({
     queryKey: ['user-course-progress', courseId, user?.id],
     queryFn: async () => {
       if (!courseId || !user) return null;
       
       const { data, error } = await supabase
         .from('user_course_progress')
         .select('*')
         .eq('course_id', courseId)
         .eq('user_id', user.id)
         .maybeSingle();
       
       if (error) throw error;
       return data as UserCourseProgress | null;
     },
     enabled: !!courseId && !!user,
   });
 }
 
 export function useUserLessonStatuses(courseId: string | undefined) {
   const { user } = useAuth();
   
   return useQuery({
     queryKey: ['user-lesson-statuses', courseId, user?.id],
     queryFn: async () => {
       if (!courseId || !user) return [];
       
       // Get all lesson IDs for this course
       const { data: modules } = await supabase
         .from('course_modules')
         .select('lessons(id)')
         .eq('course_id', courseId);
       
       const lessonIds = modules?.flatMap(m => (m.lessons as any[])?.map(l => l.id) || []) || [];
       
       if (lessonIds.length === 0) return [];
       
       const { data, error } = await supabase
         .from('user_lesson_status')
         .select('*')
         .eq('user_id', user.id)
         .in('lesson_id', lessonIds);
       
       if (error) throw error;
       return data as UserLessonStatus[];
     },
     enabled: !!courseId && !!user,
   });
 }
 
 // Quiz attempts
 export function useQuizAttempts(quizId: string | undefined) {
   const { user } = useAuth();
   
   return useQuery({
     queryKey: ['quiz-attempts', quizId, user?.id],
     queryFn: async () => {
       if (!quizId || !user) return [];
       
       const { data, error } = await supabase
         .from('quiz_attempts')
         .select('*')
         .eq('quiz_id', quizId)
         .eq('user_id', user.id)
         .order('attempt_number', { ascending: false });
       
       if (error) throw error;
       return data as QuizAttempt[];
     },
     enabled: !!quizId && !!user,
   });
 }
 
 // User certificates
 export function useUserCertificates() {
   const { user } = useAuth();
   
   return useQuery({
     queryKey: ['user-certificates', user?.id],
     queryFn: async () => {
       if (!user) return [];
       
       const { data, error } = await supabase
         .from('user_certificates')
         .select(`
           *,
           courses (*),
           certificate_templates (*)
         `)
         .eq('user_id', user.id)
         .order('issued_at', { ascending: false });
       
       if (error) throw error;
       return data as UserCertificate[];
     },
     enabled: !!user,
   });
 }
 
 // Mutations
 export function useStartCourse() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async (courseId: string) => {
       if (!user) throw new Error('Not authenticated');
       
       const { data, error } = await supabase
         .from('user_course_progress')
         .upsert({
           user_id: user.id,
           course_id: courseId,
           started_at: new Date().toISOString(),
         }, { onConflict: 'user_id,course_id' })
         .select()
         .single();
       
       if (error) throw error;
       return data;
     },
     onSuccess: (_, courseId) => {
       queryClient.invalidateQueries({ queryKey: ['user-course-progress', courseId] });
     },
   });
 }
 
 export function useCompleteLesson() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async (lessonId: string) => {
       if (!user) throw new Error('Not authenticated');
       
       const { data, error } = await supabase
         .from('user_lesson_status')
         .upsert({
           user_id: user.id,
           lesson_id: lessonId,
           is_completed: true,
           completed_at: new Date().toISOString(),
         }, { onConflict: 'user_id,lesson_id' })
         .select()
         .single();
       
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['user-lesson-statuses'] });
     },
   });
 }
 
 export function useSubmitQuiz() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async ({
       quizId,
       answers,
       questions,
       passScore,
     }: {
       quizId: string;
       answers: Record<string, string>;
       questions: QuizQuestion[];
       passScore: number;
     }) => {
       if (!user) throw new Error('Not authenticated');
       
       // Calculate score
       let correctCount = 0;
       questions.forEach(q => {
         const selectedOptionId = answers[q.id];
         const correctOption = q.quiz_options?.find(o => o.is_correct);
         if (correctOption && selectedOptionId === correctOption.id) {
           correctCount++;
         }
       });
       
       const scorePercent = Math.round((correctCount / questions.length) * 100);
       const isPassed = scorePercent >= passScore;
       
       // Get attempt number
       const { data: existingAttempts } = await supabase
         .from('quiz_attempts')
         .select('attempt_number')
         .eq('quiz_id', quizId)
         .eq('user_id', user.id)
         .order('attempt_number', { ascending: false })
         .limit(1);
       
       const attemptNumber = (existingAttempts?.[0]?.attempt_number || 0) + 1;
       
       const { data, error } = await supabase
         .from('quiz_attempts')
         .insert({
           quiz_id: quizId,
           user_id: user.id,
           attempt_number: attemptNumber,
           score: scorePercent,
           total_questions: questions.length,
           is_passed: isPassed,
           answers_json: answers,
           completed_at: new Date().toISOString(),
         })
         .select()
         .single();
       
       if (error) throw error;
       return { ...data, correctCount, totalQuestions: questions.length };
     },
     onSuccess: (_, { quizId }) => {
       queryClient.invalidateQueries({ queryKey: ['quiz-attempts', quizId] });
     },
   });
 }