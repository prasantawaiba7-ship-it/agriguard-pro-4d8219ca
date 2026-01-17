import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a disease detection image to Supabase Storage
 * Returns the public URL of the uploaded image
 */
export async function uploadDiseaseImage(
  dataUrl: string,
  userId?: string
): Promise<string> {
  // Convert data URL to Blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  
  // Generate unique filename
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const extension = blob.type.split('/')[1] || 'jpg';
  const filename = `disease-detection/${userId || 'anonymous'}/${timestamp}-${randomId}.${extension}`;
  
  // Upload to crop-photos bucket
  const { data, error } = await supabase.storage
    .from('crop-photos')
    .upload(filename, blob, {
      contentType: blob.type,
      upsert: false,
    });
  
  if (error) {
    console.error('Failed to upload image:', error);
    throw new Error('फोटो अपलोड गर्न सकिएन');
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('crop-photos')
    .getPublicUrl(data.path);
  
  return urlData.publicUrl;
}

/**
 * Delete a disease detection image from storage
 */
export async function deleteDiseaseImage(imageUrl: string): Promise<void> {
  // Extract path from URL
  const url = new URL(imageUrl);
  const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/crop-photos\/(.+)/);
  
  if (!pathMatch) {
    console.warn('Could not extract path from URL:', imageUrl);
    return;
  }
  
  const filePath = pathMatch[1];
  
  const { error } = await supabase.storage
    .from('crop-photos')
    .remove([filePath]);
  
  if (error) {
    console.error('Failed to delete image:', error);
  }
}
