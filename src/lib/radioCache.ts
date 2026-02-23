export interface RadioTip {
  id: string;
  createdAt: string;
  crop: string;
  stage: string;
  location?: string;
  text: string;
}

const CACHE_KEY = 'krishi_radio_tips_cache';
const MAX_TIPS = 50;

export function loadCachedTips(): RadioTip[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RadioTip[];
  } catch {
    return [];
  }
}

export function saveTip(tip: RadioTip): void {
  try {
    const tips = loadCachedTips();
    tips.push(tip);
    // Keep only last MAX_TIPS
    const trimmed = tips.slice(-MAX_TIPS);
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('[RadioCache] Save error:', e);
  }
}

export function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}

export function getCachedTipCount(): number {
  return loadCachedTips().length;
}
