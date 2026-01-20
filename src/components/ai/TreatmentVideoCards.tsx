import { ExternalLink, Play, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { Link } from 'react-router-dom';

export interface TreatmentVideo {
  id: string;
  crop_name: string;
  disease_or_pest_name: string;
  disease_or_pest_name_ne?: string;
  treatment_title: string;
  treatment_title_ne?: string;
  youtube_video_url?: string;
  severity_level?: string;
}

interface TreatmentVideoCardsProps {
  treatments: TreatmentVideo[];
}

export function TreatmentVideoCards({ treatments }: TreatmentVideoCardsProps) {
  const { language } = useLanguage();
  
  if (!treatments || treatments.length === 0) return null;

  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'severe':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium':
      case 'moderate':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'low':
      case 'mild':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <BookOpen className="w-4 h-4" />
        <span>
          {language === 'ne' ? 'सम्बन्धित उपचार भिडियोहरू' : 'Related Treatment Videos'}
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {treatments.slice(0, 3).map((treatment) => {
          const videoId = getYouTubeVideoId(treatment.youtube_video_url || '');
          const thumbnailUrl = videoId 
            ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
            : null;

          return (
            <Card 
              key={treatment.id} 
              className="overflow-hidden border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex gap-3 p-3">
                {/* Video Thumbnail */}
                {thumbnailUrl && (
                  <div className="relative w-24 h-16 sm:w-32 sm:h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                    <img
                      src={thumbnailUrl}
                      alt={treatment.treatment_title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center">
                        <Play className="w-4 h-4 text-primary-foreground ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium line-clamp-2 mb-1">
                      {language === 'ne' && treatment.treatment_title_ne 
                        ? treatment.treatment_title_ne 
                        : treatment.treatment_title}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] sm:text-xs text-muted-foreground capitalize">
                        {treatment.crop_name} • {language === 'ne' && treatment.disease_or_pest_name_ne 
                          ? treatment.disease_or_pest_name_ne 
                          : treatment.disease_or_pest_name}
                      </span>
                      {treatment.severity_level && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getSeverityColor(treatment.severity_level)}`}>
                          {treatment.severity_level}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {treatment.youtube_video_url && (
                      <a
                        href={treatment.youtube_video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {language === 'ne' ? 'भिडियो हेर्नुहोस्' : 'Watch Video'}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* View All Link */}
      <Link to="/treatment-library">
        <Button variant="outline" size="sm" className="w-full text-xs">
          <BookOpen className="w-3.5 h-3.5 mr-1.5" />
          {language === 'ne' ? 'सबै उपचार पुस्तकालय हेर्नुहोस्' : 'View Full Treatment Library'}
        </Button>
      </Link>
    </div>
  );
}
