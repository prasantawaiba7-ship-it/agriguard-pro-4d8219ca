import { useState, useEffect, useCallback, useRef } from 'react';
import { getTodayPlan, saveTodayPlan, isNightTime } from '@/lib/radioPlanStorage';
import { loadCachedTips } from '@/lib/radioCache';

const PLAN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tomorrow-plan`;

interface UseTomorrowPlanOptions {
  crop: string;
  stage: string;
  location?: string;
}

export function useTomorrowPlan(config: UseTomorrowPlanOptions) {
  const [planText, setPlanText] = useState<string | null>(getTodayPlan());
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCard, setShowCard] = useState(isNightTime());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check time periodically
  useEffect(() => {
    const check = () => {
      setShowCard(isNightTime());
      setPlanText(getTodayPlan());
    };
    const timer = setInterval(check, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(timer);
  }, []);

  const generate = useCallback(async () => {
    // Don't regenerate if already have today's plan
    const existing = getTodayPlan();
    if (existing) { setPlanText(existing); return; }

    setIsGenerating(true);
    try {
      const tips = loadCachedTips();
      const recentTips = tips.slice(-10).map(t => t.text);

      const response = await fetch(PLAN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          crop: config.crop,
          stage: config.stage,
          location: config.location,
          recentTips,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.planText) {
        saveTodayPlan(data.planText);
        setPlanText(data.planText);
      }
    } catch (err) {
      console.error('[TomorrowPlan] Error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [config.crop, config.stage, config.location]);

  const speakPlan = useCallback(() => {
    if (!planText || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(planText);
    utteranceRef.current = utterance;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.includes('ne') || v.name.toLowerCase().includes('nepali'))
      || voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
    if (voice) utterance.voice = voice;
    utterance.lang = 'ne-NP';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); utteranceRef.current = null; };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [planText, isSpeaking]);

  // Cleanup
  useEffect(() => {
    return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, []);

  return { planText, isGenerating, showCard, isSpeaking, generate, speakPlan };
}
