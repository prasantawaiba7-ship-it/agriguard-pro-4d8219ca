-- Drop the check constraint that's limiting section types
ALTER TABLE public.crop_guides DROP CONSTRAINT IF EXISTS crop_guides_section_check;

-- Add new constraint with all valid section types including climate and market
ALTER TABLE public.crop_guides ADD CONSTRAINT crop_guides_section_check 
  CHECK (section IN (
    'introduction', 
    'climate', 
    'soil', 
    'land_preparation', 
    'sowing', 
    'fertilizer', 
    'irrigation', 
    'pests', 
    'diseases', 
    'harvest', 
    'storage', 
    'market', 
    'tips'
  ));