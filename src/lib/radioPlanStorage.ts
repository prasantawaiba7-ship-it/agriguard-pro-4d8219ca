const PLAN_KEY_PREFIX = 'krishi_radio_plan_';

function getTodayKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${PLAN_KEY_PREFIX}${yyyy}-${mm}-${dd}`;
}

export function getTodayPlan(): string | null {
  try {
    return localStorage.getItem(getTodayKey());
  } catch {
    return null;
  }
}

export function saveTodayPlan(plan: string): void {
  try {
    localStorage.setItem(getTodayKey(), plan);
  } catch (e) {
    console.error('[RadioPlan] Save error:', e);
  }
}

export function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 20 || hour === 0;
}
