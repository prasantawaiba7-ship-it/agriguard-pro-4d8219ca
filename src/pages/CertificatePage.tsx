 import { useRef } from 'react';
 import { useParams, useNavigate } from 'react-router-dom';
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import Header from '@/components/layout/Header';
 import Footer from '@/components/layout/Footer';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { useAuth } from '@/hooks/useAuth';
 import { ArrowLeft, Download, Share2, Loader2, Award } from 'lucide-react';
 import html2canvas from 'html2canvas';
 import jsPDF from 'jspdf';
 
 export default function CertificatePage() {
   const { certificateId } = useParams<{ certificateId: string }>();
   const navigate = useNavigate();
   const { user, profile } = useAuth();
   const certRef = useRef<HTMLDivElement>(null);
   
   const { data: certificate, isLoading } = useQuery({
     queryKey: ['certificate', certificateId],
     queryFn: async () => {
       if (!certificateId) return null;
       
       const { data, error } = await supabase
         .from('user_certificates')
         .select(`
           *,
           courses (*, learning_levels (*)),
           certificate_templates (*)
         `)
         .eq('id', certificateId)
         .single();
       
       if (error) throw error;
       return data;
     },
     enabled: !!certificateId,
   });
   
   const template = certificate?.certificate_templates;
   const course = certificate?.courses;
   const level = course?.learning_levels;
   
   const formatDate = (dateStr: string) => {
     const date = new Date(dateStr);
     return date.toLocaleDateString('ne-NP', {
       year: 'numeric',
       month: 'long',
       day: 'numeric',
     });
   };
   
   const replacePlaceholders = (text: string | null) => {
     if (!text) return '';
     return text
       .replace('[farmer_name]', profile?.full_name || 'किसान')
       .replace('[course_title]', course?.title_ne || '')
       .replace('[level_name]', level?.title_ne || '')
       .replace('[date]', formatDate(certificate?.issued_at || new Date().toISOString()));
   };
   
   const handleDownload = async () => {
     if (!certRef.current) return;
     
     try {
       const canvas = await html2canvas(certRef.current, {
         scale: 2,
         useCORS: true,
         backgroundColor: '#ffffff',
       });
       
       const imgData = canvas.toDataURL('image/png');
       const pdf = new jsPDF({
         orientation: 'landscape',
         unit: 'mm',
         format: 'a4',
       });
       
       const pdfWidth = pdf.internal.pageSize.getWidth();
       const pdfHeight = pdf.internal.pageSize.getHeight();
       
       pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
       pdf.save(`certificate-${certificate?.certificate_number}.pdf`);
     } catch (error) {
       console.error('Download error:', error);
     }
   };
   
   const handleShare = async () => {
     if (navigator.share) {
       try {
         await navigator.share({
           title: `${template?.title_ne} प्रमाणपत्र`,
           text: `${profile?.full_name} ले ${course?.title_ne} कोर्स पूरा गर्नुभयो!`,
           url: window.location.href,
         });
       } catch (error) {
         console.error('Share error:', error);
       }
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
   
   if (!certificate) {
     return (
       <div className="min-h-screen bg-background flex flex-col">
         <Header />
         <div className="flex-1 flex items-center justify-center">
           <p className="text-muted-foreground">प्रमाणपत्र फेला परेन।</p>
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
         
         {/* Certificate Display */}
         <Card className="overflow-hidden">
           <CardContent className="p-0">
             <div 
               ref={certRef}
               className="relative aspect-[1.414/1] bg-gradient-to-br from-amber-50 via-white to-amber-50 p-8 md:p-12"
               style={{
                 backgroundImage: template?.background_image_url 
                   ? `url(${template.background_image_url})` 
                   : undefined,
                 backgroundSize: 'cover',
               }}
             >
               {/* Border */}
               <div className="absolute inset-4 md:inset-8 border-4 border-amber-600/30 rounded-lg" />
               <div className="absolute inset-5 md:inset-9 border-2 border-amber-600/20 rounded-lg" />
               
               {/* Content */}
               <div className="relative h-full flex flex-col items-center justify-between text-center py-4 md:py-8">
                 {/* Header */}
                 <div className="space-y-2">
                   <div className="flex items-center justify-center gap-2">
                     <Award className="w-8 h-8 md:w-12 md:h-12 text-amber-600" />
                   </div>
                   <h1 className="text-2xl md:text-4xl font-bold text-amber-800">
                     {template?.title_ne || 'किसान साथी'}
                   </h1>
                   <h2 className="text-lg md:text-2xl text-amber-700">
                     {template?.subtitle_ne || 'प्रशिक्षण प्रमाणपत्र'}
                   </h2>
                 </div>
                 
                 {/* Body */}
                 <div className="space-y-4 max-w-lg">
                   <p className="text-sm md:text-base text-gray-700">
                     {replacePlaceholders(template?.body_text_ne)}
                   </p>
                   <div className="text-2xl md:text-4xl font-bold text-amber-900">
                     {profile?.full_name}
                   </div>
                   <div className="text-sm md:text-lg text-gray-600">
                     कोर्स: {course?.title_ne}
                   </div>
                   <div className="text-sm text-gray-500">
                     मिति: {formatDate(certificate.issued_at)}
                   </div>
                 </div>
                 
                 {/* Footer */}
                 <div className="space-y-2">
                   {template?.signature_image_url && (
                     <img 
                       src={template.signature_image_url} 
                       alt="Signature" 
                       className="h-12 mx-auto"
                     />
                   )}
                   <p className="text-sm text-gray-600">{template?.footer_ne}</p>
                   <p className="text-xs text-gray-400">
                     प्रमाणपत्र नं: {certificate.certificate_number}
                   </p>
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
         
         {/* Action Buttons */}
         <div className="flex flex-col sm:flex-row gap-3">
           <Button size="lg" className="flex-1 gap-2" onClick={handleDownload}>
             <Download className="w-5 h-5" />
             डाउनलोड गर्नुहोस्
           </Button>
           {navigator.share && (
             <Button size="lg" variant="outline" className="flex-1 gap-2" onClick={handleShare}>
               <Share2 className="w-5 h-5" />
               शेयर गर्नुहोस्
             </Button>
           )}
         </div>
       </main>
       
       <Footer />
     </div>
   );
 }