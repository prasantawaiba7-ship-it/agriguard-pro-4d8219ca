import { useState } from 'react';
import { useTicketImages, type TicketImage } from '@/hooks/useTicketImages';
import { TicketImageViewer } from './TicketImageViewer';
import { Loader2, User, Shield } from 'lucide-react';

interface TicketImageGalleryProps {
  ticketId: string;
  canEditNotes?: boolean; // true for technicians
}

export function TicketImageGallery({ ticketId, canEditNotes = false }: TicketImageGalleryProps) {
  const { data: images, isLoading } = useTicketImages(ticketId);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (isLoading) {
    return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  if (!images || images.length === 0) return null;

  return (
    <>
      {/* Multi-photo ticket images start */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">📸 फोटोहरू ({images.length})</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className="relative aspect-square rounded-lg overflow-hidden border border-border cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all group"
              onClick={() => setViewerIndex(idx)}
            >
              <img
                src={img.image_url}
                alt={`Ticket photo ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Role badge */}
              <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-medium flex items-center gap-0.5 ${
                img.role === 'technician'
                  ? 'bg-blue-600/80 text-white'
                  : 'bg-primary/80 text-primary-foreground'
              }`}>
                {img.role === 'technician' ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                {img.role === 'technician' ? 'Bigya' : 'Farmer'}
              </div>
              {/* Note indicator */}
              {img.note && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-0.5 truncate">
                  {img.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Multi-photo ticket images end */}

      {viewerIndex !== null && (
        <TicketImageViewer
          images={images}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          canEditNotes={canEditNotes}
        />
      )}
    </>
  );
}
