import { differenceInDays } from 'date-fns';

export interface CropStageInfo {
  stageName: string;
  stageNameNe: string;
  daysSinceSowing: number;
}

export function getCropStage(sowingDate: string | Date | null): CropStageInfo | null {
  if (!sowingDate) return null;
  const days = differenceInDays(new Date(), new Date(sowingDate));
  if (days < 0) return { stageName: 'Not sown yet', stageNameNe: 'अझै रोपिएको छैन', daysSinceSowing: days };
  if (days <= 7) return { stageName: 'Nursery', stageNameNe: 'बिउ/नर्सरी', daysSinceSowing: days };
  if (days <= 25) return { stageName: 'Early growth', stageNameNe: 'प्रारम्भिक वृद्धि', daysSinceSowing: days };
  if (days <= 45) return { stageName: 'Tillering', stageNameNe: 'बोट बढ्दै', daysSinceSowing: days };
  return { stageName: 'Late stage', stageNameNe: 'पाक्ने अवस्था', daysSinceSowing: days };
}
