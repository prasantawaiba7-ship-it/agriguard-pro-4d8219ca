import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Camera, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProduceImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ProduceImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 4,
  disabled = false 
}: ProduceImageUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast({
        title: 'अधिकतम फोटो',
        description: `तपाईं ${maxImages} भन्दा बढी फोटो राख्न सक्नुहुन्न।`,
        variant: 'destructive',
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'अमान्य फाइल',
            description: 'कृपया फोटो मात्र अपलोड गर्नुहोस्।',
            variant: 'destructive',
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'फाइल धेरै ठूलो छ',
            description: 'फोटो 5MB भन्दा सानो हुनुपर्छ।',
            variant: 'destructive',
          });
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `produce-listings/${fileName}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('crop-photos')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: 'अपलोड असफल',
            description: 'फोटो अपलोड गर्न सकिएन।',
            variant: 'destructive',
          });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('crop-photos')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        onImagesChange([...images, ...uploadedUrls]);
        toast({
          title: 'फोटो थपियो!',
          description: `${uploadedUrls.length} फोटो सफलतापूर्वक अपलोड भयो।`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'फोटो अपलोड गर्न सकिएन।',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    onImagesChange(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">फोटो ({images.length}/{maxImages})</span>
        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                अपलोड हुँदैछ...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-1" />
                फोटो थप्नुहोस्
              </>
            )}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Image preview grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
              <img
                src={url}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => removeImage(index)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          {/* Add more placeholder */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">थप्नुहोस्</span>
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">अपलोड हुँदैछ...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              <span className="text-sm text-muted-foreground">
                फोटो राख्नुहोस् (वैकल्पिक)
              </span>
              <span className="text-xs text-muted-foreground/70">
                अधिकतम {maxImages} फोटो, प्रति फोटो 5MB
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
