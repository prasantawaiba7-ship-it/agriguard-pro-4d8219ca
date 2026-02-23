/**
 * FARMER ACTION FILM v1 — Main page with full flow
 * 
 * Flow: Setup (select season, settings) → Generate → View Story
 * How to disable: Remove /action-film route from App.tsx and delete this folder.
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Film, Eye, EyeOff, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { JourneyTimeline } from './components/JourneyTimeline';
import { demoFilm, demoSeasons, type FarmerFilm } from './data/demoData';

type Step = 'setup' | 'generating' | 'story';

export default function ActionFilmPage() {
  const [step, setStep] = useState<Step>('setup');
  const [detailed, setDetailed] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [film, setFilm] = useState<FarmerFilm | null>(null);

  const handleGenerate = () => {
    if (!selectedSeason) return;
    setStep('generating');
    // Simulate generation delay with demo data
    setTimeout(() => {
      const result = { ...demoFilm };
      const season = demoSeasons.find(s => s.id === selectedSeason);
      if (season) {
        result.cropName = season.cropName;
        result.cropEmoji = season.emoji;
        result.seasonLabel = season.label;
      }
      if (privacyMode) {
        result.farmerName = 'किसान';
      }
      setFilm(result);
      setStep('story');
    }, 1800);
  };

  const handleReset = () => {
    setStep('setup');
    setFilm(null);
    setSelectedSeason('');
  };

  return (
    <>
      <Helmet>
        <title>मेरो कृषि यात्रा | Kishan Sathi</title>
        <meta name="description" content="तपाईंको बालीको यात्रा — के सिक्नुभयो, के जोगिनुभयो" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <Link to="/farmer">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-primary" />
              <h1 className="font-bold text-base text-foreground">🎬 मेरो कृषि यात्रा</h1>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
          <AnimatePresence mode="wait">
            {/* ===== STEP 1: SETUP ===== */}
            {step === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-5"
              >
                {/* Intro card */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardContent className="pt-5 pb-4 space-y-2">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      🌾 Farmer Action Film
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      तपाईंको बालीको फिल्म बनाउनुहोस् — के सिक्नुभयो, कति उत्पादन बढ्यो, कुन रोगबाट जोगिनुभयो। 
                      यो तपाईंको कृषि यात्राको कथा हो!
                    </p>
                  </CardContent>
                </Card>

                {/* Season selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">सिजन छान्नुहोस्</Label>
                  <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="कुन सिजनको कथा बनाउने?" />
                    </SelectTrigger>
                    <SelectContent>
                      {demoSeasons.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.emoji} {s.label} — {s.cropName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Settings */}
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">फिल्म सेटिङ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="detail-setup" className="text-sm cursor-pointer">
                        {detailed ? '📋 विस्तृत दृश्य' : '📄 सरल दृश्य'}
                      </Label>
                      <Switch id="detail-setup" checked={detailed} onCheckedChange={setDetailed} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="privacy-toggle" className="text-sm cursor-pointer">
                        🔒 गोपनीयता (नाम लुकाउने)
                      </Label>
                      <Switch id="privacy-toggle" checked={privacyMode} onCheckedChange={setPrivacyMode} />
                    </div>
                  </CardContent>
                </Card>

                {/* Generate button */}
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedSeason}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  कथा तयार पार्नुहोस् (Generate Story)
                </Button>

                <p className="text-center text-[11px] text-muted-foreground">
                  📌 अहिले demo data प्रयोग हुन्छ। पछि तपाईंको वास्तविक बाली डेटा जोडिनेछ।
                </p>
              </motion.div>
            )}

            {/* ===== STEP 2: GENERATING ===== */}
            {step === 'generating' && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-20 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <p className="text-base font-semibold text-foreground">🎬 तपाईंको कथा तयार हुँदैछ...</p>
                <p className="text-sm text-muted-foreground">केही सेकेन्ड पर्खनुहोस्</p>
              </motion.div>
            )}

            {/* ===== STEP 3: STORY VIEW ===== */}
            {step === 'story' && film && (
              <motion.div
                key="story"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-5"
              >
                {/* Hero card */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {film.cropEmoji} {film.cropName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{film.seasonLabel} • {film.farmerName}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80 leading-relaxed">{film.summaryNe}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {film.badges.map(b => (
                        <Badge key={b.label} variant="secondary" className="text-[10px] gap-1">
                          {b.icon} {b.label}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* View toggle */}
                <div className="flex items-center justify-between bg-card rounded-lg border border-border px-4 py-2.5">
                  <Label htmlFor="detail-toggle" className="text-sm flex items-center gap-2 cursor-pointer">
                    {detailed ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    {detailed ? 'विस्तृत हेर्नुहोस्' : 'सरल दृश्य'}
                  </Label>
                  <Switch id="detail-toggle" checked={detailed} onCheckedChange={setDetailed} />
                </div>

                {/* Timeline */}
                <JourneyTimeline events={film.events} detailed={detailed} />

                {/* Back to setup */}
                <Button variant="outline" onClick={handleReset} className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  अर्को कथा बनाउनुहोस्
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
